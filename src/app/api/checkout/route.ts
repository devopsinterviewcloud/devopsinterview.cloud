import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { quote, gatewayForCurrency } from '@/lib/pricing'
import { filesForSlug } from '@/lib/storage'
import { createRazorpayOrder, fetchRazorpayOrder, razorpayConfigured } from '@/lib/payments/razorpay'
import { createPayPalOrder, getPayPalOrder, paypalApprovalUrl, paypalConfigured } from '@/lib/payments/paypal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  productId: z.string().min(1),          // json id or slug
  currency: z.enum(['INR', 'USD']),      // the only two we charge; also picks the gateway
  email: z.string().email(),
  name: z.string().max(120).optional(),
})

// Reuse a buyer's recent unpaid order instead of minting a new gateway order per
// click: retries stay bound to ONE order, so the funnel data stays readable and
// gateway dashboards show attempts against a single order id.
const REUSE_WINDOW_MS = 30 * 60 * 1000

export async function POST(req: NextRequest) {
  let parsed
  try {
    parsed = Body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { productId, currency, email, name } = parsed

  const q = quote(productId)
  if (!q) return NextResponse.json({ error: 'Unknown product' }, { status: 404 })

  // Safety net: never take money for a product we cannot deliver.
  if (filesForSlug(q.slug).length === 0) {
    return NextResponse.json({ error: 'This title is not available for download yet.' }, { status: 409 })
  }

  const gateway = gatewayForCurrency(currency)

  try {
    if (gateway === 'razorpay') {
      if (!razorpayConfigured()) return NextResponse.json({ error: 'Payments unavailable' }, { status: 503 })
      // Best-effort reuse (not atomic: two simultaneous first clicks can still
      // create two orders, which is harmless - only one ever gets paid).
      const existing = await db.order.findFirst({
        where: {
          gateway: 'razorpay', paymentStatus: 'PENDING',
          customerEmail: email, ebookSlug: q.slug, total: q.inrAmount,
          createdAt: { gt: new Date(Date.now() - REUSE_WINDOW_MS) },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (existing?.gatewayOrderId) {
        try {
          const gw = await fetchRazorpayOrder(existing.gatewayOrderId)
          // Already paid at the gateway (webhook still in flight): a fresh order
          // here would let the buyer pay twice. Tell them it's done instead.
          if (gw.status === 'paid') {
            return NextResponse.json(
              { error: 'This purchase already completed - your download link is on its way to your email.' },
              { status: 409 },
            )
          }
          return NextResponse.json({
            gateway, keyId: process.env.RAZORPAY_KEY_ID,
            orderId: existing.gatewayOrderId, amount: q.inrAmountPaise, currency: 'INR', name: q.title,
          })
        } catch {
          // Status check failed: fall through and mint a fresh order.
        }
      }
      const rzpOrder = await createRazorpayOrder(q.inrAmountPaise, q.slug.slice(0, 40), { slug: q.slug, email })
      await db.order.create({
        data: {
          gateway, gatewayOrderId: rzpOrder.id, ebookSlug: q.slug,
          customerEmail: email, customerName: name,
          subtotal: q.inrTaxable, tax: q.inrGst, total: q.inrAmount, currency: 'INR',
          paymentMethod: 'razorpay',
        },
      })
      return NextResponse.json({
        gateway, keyId: process.env.RAZORPAY_KEY_ID,
        orderId: rzpOrder.id, amount: q.inrAmountPaise, currency: 'INR', name: q.title,
      })
    }

    // PayPal (international / USD)
    if (!paypalConfigured()) return NextResponse.json({ error: 'Payments unavailable' }, { status: 503 })
    const existingPp = await db.order.findFirst({
      where: {
        gateway: 'paypal', paymentStatus: 'PENDING',
        customerEmail: email, ebookSlug: q.slug, total: q.usdAmount,
        createdAt: { gt: new Date(Date.now() - REUSE_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (existingPp?.gatewayOrderId) {
      try {
        const gw = await getPayPalOrder(existingPp.gatewayOrderId)
        if (gw.status === 'CREATED' || gw.status === 'PAYER_ACTION_REQUIRED' || gw.status === 'APPROVED') {
          // Send the buyer (back) through PayPal approval. For APPROVED orders
          // this lets a declined funding source be replaced (PayPal's documented
          // INSTRUMENT_DECLINED recovery); the return lands on /checkout/success,
          // which captures idempotently even if the webhook got there first.
          return NextResponse.json({
            gateway, orderId: existingPp.gatewayOrderId,
            approvalUrl: paypalApprovalUrl(existingPp.gatewayOrderId),
          })
        }
        if (gw.status === 'COMPLETED') {
          // Captured already (webhook in flight): the confirm page fulfils
          // idempotently - never a second charge via a fresh order.
          return NextResponse.json({
            gateway, orderId: existingPp.gatewayOrderId,
            approvalUrl: `/checkout/success?token=${encodeURIComponent(existingPp.gatewayOrderId)}`,
          })
        }
        // VOIDED/EXPIRED etc: fall through to a fresh order.
      } catch {
        // Status check failed: fall through and mint a fresh order.
      }
    }
    const ppOrder = await createPayPalOrder(q.usdAmountString, q.slug, q.title)
    await db.order.create({
      data: {
        gateway, gatewayOrderId: ppOrder.id, ebookSlug: q.slug,
        customerEmail: email, customerName: name,
        subtotal: q.usdAmount, tax: 0, total: q.usdAmount, currency: 'USD',
        paymentMethod: 'paypal',
      },
    })
    const approval = ppOrder.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href
    return NextResponse.json({ gateway, orderId: ppOrder.id, approvalUrl: approval })
  } catch (e) {
    console.error('checkout error', e)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}

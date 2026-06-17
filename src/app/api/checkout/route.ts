import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { quote, gatewayForCurrency } from '@/lib/pricing'
import { filesForSlug } from '@/lib/storage'
import { createRazorpayOrder, razorpayConfigured } from '@/lib/payments/razorpay'
import { createPayPalOrder, paypalConfigured } from '@/lib/payments/paypal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  productId: z.string().min(1),          // json id or slug
  currency: z.string().min(3).max(3),    // e.g. INR, USD
  email: z.string().email(),
  name: z.string().max(120).optional(),
})

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

import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpayWebhook } from '@/lib/payments/razorpay'
import { fulfillByGatewayOrderId } from '@/lib/fulfillment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RazorpayWebhookEvent {
  event?: string
  payload?: { payment?: { entity?: { order_id?: string; id?: string; amount?: number; currency?: string } } }
}

export async function POST(req: NextRequest) {
  // Razorpay signs the RAW body — read it as text, do not parse first.
  const raw = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  if (!verifyRazorpayWebhook(raw, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  let event: RazorpayWebhookEvent
  try { event = JSON.parse(raw) } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  if (event?.event === 'payment.captured' || event?.event === 'order.paid') {
    const payment = event?.payload?.payment?.entity
    const orderId = payment?.order_id
    const paymentId = payment?.id
    if (orderId && paymentId) {
      // Razorpay reports amount in paise; reconcile against the stored INR order total.
      const paid = typeof payment?.amount === 'number'
        ? { amount: payment.amount / 100, currency: payment.currency || 'INR' }
        : undefined
      await fulfillByGatewayOrderId(orderId, paymentId, paid)
    }
  }
  // Always 200 so Razorpay doesn't retry forever once we've accepted it.
  return NextResponse.json({ received: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyPayPalWebhook, capturePayPalOrder } from '@/lib/payments/paypal'
import { fulfillByGatewayOrderId } from '@/lib/fulfillment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PayPalWebhookEvent {
  event_type?: string
  resource?: {
    id?: string
    amount?: { value: string; currency_code: string }
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  let event: PayPalWebhookEvent
  try { event = JSON.parse(raw) } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const ok = await verifyPayPalWebhook(req.headers, event)
  if (!ok) return NextResponse.json({ error: 'invalid signature' }, { status: 400 })

  const type = event?.event_type
  // The order id we stored at checkout is the v2 Orders id.
  if (type === 'CHECKOUT.ORDER.APPROVED') {
    const orderId = event?.resource?.id
    if (orderId) {
      // Capture the money FIRST. Only fulfil if the capture actually COMPLETED, and
      // only for the amount/currency PayPal reports it captured. A failed/declined
      // capture must never deliver the ebook.
      try {
        const capture = await capturePayPalOrder(orderId)
        const cap = capture?.purchase_units?.[0]?.payments?.captures?.[0]
        if (capture?.status === 'COMPLETED' && cap?.status === 'COMPLETED' && cap?.amount) {
          await fulfillByGatewayOrderId(orderId, cap.id || orderId, {
            amount: Number(cap.amount.value),
            currency: cap.amount.currency_code,
          })
        } else {
          console.error('paypal: capture not completed, not fulfilling', { orderId, status: capture?.status })
        }
      } catch (e) {
        // Do NOT fulfil on capture failure. PayPal will resend; we ack 200 to avoid a storm.
        console.error('paypal capture failed, not fulfilling', e)
      }
    }
  } else if (type === 'PAYMENT.CAPTURE.COMPLETED') {
    // Backstop for the captured-money event. Map back to our stored Orders-v2 id.
    const orderId = event?.resource?.supplementary_data?.related_ids?.order_id
    const captureId = event?.resource?.id
    const amt = event?.resource?.amount
    if (orderId && amt) {
      await fulfillByGatewayOrderId(orderId, captureId || orderId, {
        amount: Number(amt.value),
        currency: amt.currency_code,
      })
    } else {
      console.warn('paypal CAPTURE.COMPLETED missing related order id; relying on APPROVED capture path')
    }
  }
  return NextResponse.json({ received: true })
}

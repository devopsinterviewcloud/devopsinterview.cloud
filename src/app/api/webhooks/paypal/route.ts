import { NextRequest, NextResponse } from 'next/server'
import { verifyPayPalWebhook, capturePayPalOrder, getPayPalOrder } from '@/lib/payments/paypal'
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
      let cap: { id?: string; status?: string; amount?: { value: string; currency_code: string } } | null = null
      try {
        const capture = await capturePayPalOrder(orderId)
        if (capture?.status === 'COMPLETED') cap = capture?.purchase_units?.[0]?.payments?.captures?.[0] ?? null
        else console.error('paypal: capture not completed, not fulfilling', { orderId, status: capture?.status })
      } catch (e) {
        // A retried delivery hits ORDER_ALREADY_CAPTURED (422); the money moved on the
        // first attempt, so recover the capture from the order and continue to fulfil.
        const msg = e instanceof Error ? e.message : String(e)
        const declined = /capture failed: 4\d\d/.test(msg) && !msg.includes('capture failed: 429')
        if (msg.includes('ORDER_ALREADY_CAPTURED')) {
          const existing = await getPayPalOrder(orderId) // a throw here -> 500 -> PayPal retries
          cap = existing?.purchase_units?.[0]?.payments?.captures?.[0] ?? null
        } else if (declined) {
          // Definitive 4xx (declined / not approved): no money moved and a retry of the
          // same capture cannot succeed, so ack 200 and never fulfil.
          console.error('paypal capture declined, not fulfilling', e)
        } else {
          // Unknown outcome (network error, timeout, PayPal 5xx, rate limit): money MAY
          // have moved. 503 so PayPal redelivers; the retry either captures cleanly or
          // hits ORDER_ALREADY_CAPTURED and recovers above.
          console.error('paypal capture outcome unknown, requesting redelivery', e)
          return NextResponse.json({ error: 'capture retry' }, { status: 503 })
        }
      }
      if (cap?.status === 'COMPLETED' && cap.amount) {
        // NOT wrapped in try/catch: if fulfilment throws (transient DB error), the
        // resulting 500 makes PayPal redeliver, and the retry path above recovers
        // the already-made capture instead of double-charging.
        const result = await fulfillByGatewayOrderId(orderId, cap.id || orderId, {
          amount: Number(cap.amount.value),
          currency: cap.amount.currency_code,
        })
        if ('emailFailed' in result && result.emailFailed) {
          return NextResponse.json({ error: 'email pending' }, { status: 503 }) // PayPal redelivers; email retried
        }
      }
    }
  } else if (type === 'PAYMENT.CAPTURE.COMPLETED') {
    // Backstop for the captured-money event. Map back to our stored Orders-v2 id.
    const orderId = event?.resource?.supplementary_data?.related_ids?.order_id
    const captureId = event?.resource?.id
    const amt = event?.resource?.amount
    if (orderId && amt) {
      const result = await fulfillByGatewayOrderId(orderId, captureId || orderId, {
        amount: Number(amt.value),
        currency: amt.currency_code,
      })
      if ('emailFailed' in result && result.emailFailed) {
        return NextResponse.json({ error: 'email pending' }, { status: 503 }) // PayPal redelivers; email retried
      }
    } else {
      console.warn('paypal CAPTURE.COMPLETED missing related order id; relying on APPROVED capture path')
    }
  }
  return NextResponse.json({ received: true })
}

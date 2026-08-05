import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
      let declined = false
      let terminalDecline = false
      try {
        const capture = await capturePayPalOrder(orderId)
        cap = capture?.purchase_units?.[0]?.payments?.captures?.[0] ?? null
        if (capture?.status !== 'COMPLETED') {
          console.error('paypal: capture not completed yet', { orderId, status: capture?.status })
        }
      } catch (e) {
        // A retried delivery hits ORDER_ALREADY_CAPTURED (422); the money moved on the
        // first attempt, so recover the capture from the order and continue to fulfil.
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('ORDER_ALREADY_CAPTURED')) {
          const existing = await getPayPalOrder(orderId) // a throw here -> 500 -> PayPal retries
          cap = existing?.purchase_units?.[0]?.payments?.captures?.[0] ?? null
        } else if (msg.includes('INSTRUMENT_DECLINED') || msg.includes('TRANSACTION_REFUSED')) {
          // No money moved and retrying the SAME capture cannot succeed, so ack 200
          // and never fulfil from this delivery. INSTRUMENT_DECLINED stays PENDING
          // locally (PayPal documents it as buyer-recoverable via another funding
          // source); TRANSACTION_REFUSED is terminal and marks the order FAILED.
          // Other 422s (PAYER_ACTION_REQUIRED, ORDER_NOT_APPROVED) need buyer
          // action and fall through to redelivery; if the buyer completes later,
          // either a retried capture succeeds or the PAYMENT.CAPTURE.COMPLETED
          // backstop fulfils.
          declined = true
          terminalDecline = msg.includes('TRANSACTION_REFUSED')
          console.error('paypal capture declined, not fulfilling', e)
        } else {
          // Anything else (401/403/408/409/429, network error, PayPal 5xx) is an
          // UNKNOWN outcome: money may have moved. 503 so PayPal redelivers; the
          // retry either captures cleanly or hits ORDER_ALREADY_CAPTURED above.
          console.error('paypal capture outcome unknown, requesting redelivery', e)
          return NextResponse.json({ error: 'capture retry' }, { status: 503 })
        }
      }
      if (terminalDecline || cap?.status === 'DECLINED' || cap?.status === 'FAILED') {
        // Persist the terminal failure so checkout's order-reuse query stops
        // serving this order. Guarded to PENDING rows: never overrides a success,
        // and a later amount-reconciled capture can still resurrect the row.
        await db.order.updateMany({
          where: { gatewayOrderId: orderId, gateway: 'paypal', paymentStatus: 'PENDING' },
          data: { paymentStatus: 'FAILED', status: 'FAILED' },
        })
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
      } else if (!declined && !(cap && (cap.status === 'DECLINED' || cap.status === 'FAILED'))) {
        // Capture exists but is PENDING/unresolved (payment review), or the response
        // had no capture object: not terminal, so keep redelivering rather than
        // silently acking a paid-but-unfulfilled order.
        console.error('paypal: capture unresolved, requesting redelivery', { orderId, capStatus: cap?.status })
        return NextResponse.json({ error: 'capture unresolved' }, { status: 503 })
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

/**
 * Called by /checkout/success when PayPal redirects the buyer back with
 * ?token=<orderId>. The webhook remains the fulfilment source of truth; this
 * endpoint exists so the buyer sees a real confirmation instead of racing it.
 * It is safe to call repeatedly and concurrently with the webhook: capture
 * recovery handles ORDER_ALREADY_CAPTURED and fulfilment's atomic claim plus
 * the Resend idempotency key make double delivery impossible.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { capturePayPalOrder, getPayPalOrder } from '@/lib/payments/paypal'
import { fulfillByGatewayOrderId } from '@/lib/fulfillment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({ token: z.string().min(5).max(64).regex(/^[A-Za-z0-9_-]+$/) })

type Capture = { id?: string; status?: string; amount?: { value: string; currency_code: string } } | null

function captureOf(order: unknown): Capture {
  return (order as { purchase_units?: { payments?: { captures?: Capture[] } }[] })
    ?.purchase_units?.[0]?.payments?.captures?.[0] ?? null
}

// Persist a terminal failure so the checkout reuse query stops serving this
// order and later polls answer instantly. Only ever flips PENDING rows: a
// concurrent successful fulfilment must never be overridden.
async function markFailed(gatewayOrderId: string) {
  await db.order.updateMany({
    where: { gatewayOrderId, gateway: 'paypal', paymentStatus: 'PENDING' },
    data: { paymentStatus: 'FAILED', status: 'FAILED' },
  })
}

async function fulfillFromCapture(orderId: string, cap: Capture) {
  if (cap?.status === 'COMPLETED' && cap.amount) {
    const result = await fulfillByGatewayOrderId(orderId, cap.id || orderId, {
      amount: Number(cap.amount.value),
      currency: cap.amount.currency_code,
    })
    if (!result.ok) return NextResponse.json({ state: 'failed' })
    // Money moved but the email hasn't been accepted yet: report "processing" so
    // the buyer keeps polling and every poll retries the send (webhook backstop too).
    if ('emailFailed' in result && result.emailFailed) return NextResponse.json({ state: 'processing' })
    return NextResponse.json({ state: 'paid' })
  }
  // The order can be COMPLETED while its capture was declined: the nested
  // capture status is decisive, mirror the webhook's terminal classification.
  if (cap?.status === 'DECLINED' || cap?.status === 'FAILED') {
    await markFailed(orderId)
    return NextResponse.json({ state: 'failed' })
  }
  return NextResponse.json({ state: 'processing' }) // e.g. capture PENDING (payment review)
}

export async function POST(req: NextRequest) {
  let token: string
  try {
    token = Body.parse(await req.json()).token
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const order = await db.order.findUnique({ where: { gatewayOrderId: token } })
  if (!order || order.gateway !== 'paypal') {
    return NextResponse.json({ state: 'unknown' }, { status: 404 })
  }
  if (order.paymentStatus === 'SUCCEEDED') {
    // PROCESSING means paid but the download email hasn't been accepted yet
    // (Resend failure). Re-running fulfilment retries the send idempotently, so
    // a stuck email gets another chance on every poll, not just on webhook luck.
    // Report "processing" until the email actually goes out, so polling continues.
    if (order.status === 'PROCESSING') {
      try {
        const r = await fulfillByGatewayOrderId(token, order.gatewayPaymentId || token)
        if ('emailFailed' in r && r.emailFailed) return NextResponse.json({ state: 'processing' })
      } catch (e) {
        console.error('paypal confirm: email retry failed', { token, error: e })
        return NextResponse.json({ state: 'processing' })
      }
    }
    return NextResponse.json({ state: 'paid' })
  }
  // No FAILED short-circuit: local FAILED marks are provisional (declines can be
  // retried, and a failure-first race must not hide a later completed capture),
  // so always let the gateway's current state drive the answer below.

  // Ask PayPal. Transient PayPal errors are reported as
  // "processing" - the webhook will settle the truth.
  let pp: { status?: string }
  try {
    pp = await getPayPalOrder(token)
  } catch (e) {
    console.error('paypal confirm: getOrder failed', { token, error: e })
    return NextResponse.json({ state: 'processing' })
  }

  if (pp.status === 'COMPLETED') {
    // Webhook capture already happened but fulfilment hasn't flipped the row yet.
    return fulfillFromCapture(token, captureOf(pp))
  }

  if (pp.status === 'APPROVED') {
    // Buyer approved and came back before the webhook: capture now. Same outcome
    // classification as the webhook route.
    let cap: Capture = null
    try {
      cap = captureOf(await capturePayPalOrder(token))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('ORDER_ALREADY_CAPTURED')) {
        try {
          cap = captureOf(await getPayPalOrder(token))
        } catch {
          return NextResponse.json({ state: 'processing' })
        }
      } else if (msg.includes('INSTRUMENT_DECLINED')) {
        // Recoverable per PayPal: the buyer can restart checkout with another
        // funding source, so keep the order PENDING and send them back to retry.
        return NextResponse.json({ state: 'pending' })
      } else if (msg.includes('TRANSACTION_REFUSED')) {
        await markFailed(token)
        return NextResponse.json({ state: 'failed' })
      } else {
        console.error('paypal confirm: capture outcome unknown, webhook will settle', { token, error: e })
        return NextResponse.json({ state: 'processing' })
      }
    }
    return fulfillFromCapture(token, cap)
  }

  if (pp.status === 'CREATED' || pp.status === 'PAYER_ACTION_REQUIRED') {
    return NextResponse.json({ state: 'pending' }) // approval never finished
  }
  if (pp.status === 'VOIDED' || pp.status === 'EXPIRED') {
    await markFailed(token)
    return NextResponse.json({ state: 'failed' })
  }
  return NextResponse.json({ state: 'processing' })
}

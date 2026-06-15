/**
 * Razorpay (domestic / INR). Implemented against the REST API + node crypto so
 * we don't depend on the SDK. Signature verification is the security-critical part.
 *
 * Flow: server creates an Order (this file) -> client opens Razorpay Checkout with
 * that order_id -> on success Razorpay posts a webhook (payment.captured) which we
 * verify here and fulfil. We treat the WEBHOOK as the source of truth, not the
 * browser callback.
 */
import crypto from 'crypto'

const KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || ''

export function razorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET)
}

/** Create a Razorpay order. `amountPaise` and `receipt` come from the server-side quote. */
export async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes, payment_capture: 1 }),
  })
  if (!res.ok) {
    throw new Error(`Razorpay createOrder failed: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as { id: string; amount: number; currency: string; receipt: string }
}

/**
 * Verify the webhook signature. Razorpay signs the RAW request body with the
 * webhook secret (HMAC-SHA256). Pass the raw text body exactly as received.
 */
export function verifyRazorpayWebhook(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
  return timingSafeEqualHex(expected, signature)
}

/**
 * Verify the browser checkout callback (razorpay_order_id|razorpay_payment_id signed
 * with the key secret). Useful for an instant client-side confirmation page, but
 * fulfilment still happens in the webhook.
 */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!KEY_SECRET) return false
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex')
  return timingSafeEqualHex(expected, signature)
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  if (ab.length !== bb.length || ab.length === 0) return false
  return crypto.timingSafeEqual(ab, bb)
}

/**
 * PayPal (international / USD) via the Orders v2 REST API.
 *
 * Flow: server creates an Order (intent=CAPTURE) -> client approves via the PayPal
 * JS buttons or the approval link -> server captures -> PayPal also posts a webhook
 * (CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED) which we verify and fulfil.
 */
import crypto from 'crypto'

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || ''
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox'
const BASE = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://devopsinterview.cloud'

export function paypalConfigured(): boolean {
  // WEBHOOK_ID is required too: without it verifyPayPalWebhook() rejects every
  // event, so buyers could pay with no fulfilment ever running. Fail fast instead.
  // Production must be explicitly 'live': an unset PAYPAL_ENV silently sent every
  // international buyer to sandbox for six weeks (Jun-Jul 2026). Refuse to sell
  // rather than sell through sandbox.
  if (process.env.VERCEL_ENV === 'production' && PAYPAL_ENV !== 'live') {
    console.error('paypal: PAYPAL_ENV must be "live" in production; disabling PayPal checkout')
    return false
  }
  return Boolean(CLIENT_ID && CLIENT_SECRET && WEBHOOK_ID)
}

async function accessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal token failed: ${res.status} ${await res.text()}`)
  return (await res.json()).access_token as string
}

export async function createPayPalOrder(amountUsd: string, sku: string, description: string) {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Narrow scope: guards against PayPal processing ONE request twice (network
      // replay). Cross-click dedupe is handled by the order-reuse lookup in
      // /api/checkout, which is why this id can be random per call.
      'PayPal-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: sku,
        description: description.slice(0, 127),
        amount: { currency_code: 'USD', value: amountUsd },
      }],
      // Without a return_url the buyer approves the payment and is then stranded
      // on paypal.com with no confirmation; money still moves via the webhook but
      // the purchase looks failed to the buyer.
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'DevOpsInterview.Cloud',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: `${APP_URL}/checkout/success`,
            cancel_url: `${APP_URL}/checkout?ebook=${encodeURIComponent(sku)}&cancelled=paypal`,
          },
        },
      },
    }),
  })
  if (!res.ok) throw new Error(`PayPal createOrder failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as { id: string; status: string; links: { href: string; rel: string }[] }
}

/** Buyer approval URL for an existing order (same pattern the create response links carry). */
export function paypalApprovalUrl(orderId: string): string {
  return PAYPAL_ENV === 'live'
    ? `https://www.paypal.com/checkoutnow?token=${encodeURIComponent(orderId)}`
    : `https://www.sandbox.paypal.com/checkoutnow?token=${encodeURIComponent(orderId)}`
}

/** Fetch an order's current state; used to recover the capture on webhook retries. */
export async function getPayPalOrder(orderId: string) {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`PayPal getOrder failed: ${res.status} ${await res.text()}`)
  return await res.json()
}

export async function capturePayPalOrder(orderId: string) {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status} ${await res.text()}`)
  return await res.json()
}

/**
 * Verify a PayPal webhook by asking PayPal to validate the signature headers.
 * `headers` are the inbound request headers; `body` is the parsed JSON event.
 */
export async function verifyPayPalWebhook(headers: Headers, body: unknown): Promise<boolean> {
  if (!WEBHOOK_ID) return false
  const token = await accessToken()
  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: WEBHOOK_ID,
      webhook_event: body,
    }),
  })
  if (!res.ok) return false
  return (await res.json()).verification_status === 'SUCCESS'
}

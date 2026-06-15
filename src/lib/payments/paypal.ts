/**
 * PayPal (international / USD) via the Orders v2 REST API.
 *
 * Flow: server creates an Order (intent=CAPTURE) -> client approves via the PayPal
 * JS buttons or the approval link -> server captures -> PayPal also posts a webhook
 * (CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED) which we verify and fulfil.
 */
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || ''
const BASE = (process.env.PAYPAL_ENV || 'sandbox') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export function paypalConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET)
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
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        custom_id: sku,
        description: description.slice(0, 127),
        amount: { currency_code: 'USD', value: amountUsd },
      }],
    }),
  })
  if (!res.ok) throw new Error(`PayPal createOrder failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as { id: string; status: string; links: { href: string; rel: string }[] }
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

# Payment Gateway Setup

The payment code (Razorpay + PayPal) is fully implemented. This is the dashboard
setup + env-var checklist to take it live. Webhooks can only be registered against a
**live, reachable URL**, so deploy first, then do the webhook steps.

Base URL used below: `https://devopsinterview.cloud`

---

## 1. Razorpay (INR / domestic)

### 1.1 Account
- [ ] Create a Razorpay account and complete **KYC** (business name, PAN, bank, address).
      Live payments are blocked until KYC is approved.
- [ ] Note: Razorpay's website review expects a visible business name + address + contact
      and policy pages (Privacy / Terms / Refund / Shipping). We removed the public business
      block — be ready to restore a minimal footer version if their review flags it.

### 1.2 API keys  → env
- [ ] Dashboard → **Settings → API Keys → Generate Key**
- [ ] `RAZORPAY_KEY_ID`  (use `rzp_test_…` first, `rzp_live_…` for production)
- [ ] `RAZORPAY_KEY_SECRET`  (shown once — copy immediately)

### 1.3 Webhook  → env
- [ ] Dashboard → **Settings → Webhooks → Add New Webhook**
- [ ] URL: `https://devopsinterview.cloud/api/webhooks/razorpay`
- [ ] Secret: generate a strong random string → set as `RAZORPAY_WEBHOOK_SECRET`
- [ ] Active events: **`payment.captured`** and **`order.paid`**
- [ ] Save. Use "Send test webhook" to confirm a 200.

---

## 2. PayPal (USD / international)

### 2.1 Account + app
- [ ] Create/log into a PayPal **Business** account.
- [ ] developer.paypal.com → **Apps & Credentials** → create a REST app.
- [ ] Toggle **Sandbox** vs **Live** at the top to get the matching credentials.

### 2.2 Credentials  → env
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `PAYPAL_ENV` = `sandbox` while testing, `live` for production

### 2.3 Webhook  → env
- [ ] In the same app → **Webhooks → Add Webhook**
- [ ] URL: `https://devopsinterview.cloud/api/webhooks/paypal`
- [ ] Event types: **`CHECKOUT.ORDER.APPROVED`** and **`PAYMENT.CAPTURE.COMPLETED`**
- [ ] Copy the generated **Webhook ID** → set as `PAYPAL_WEBHOOK_ID`
      (signature verification calls PayPal back using this ID; without it webhooks are rejected)

---

## 3. Supporting env (shared)

All of these go in **Vercel → Settings → Environment Variables (Production)**:

- [ ] `DATABASE_URL` — Supabase **pooled** string (port 6543 + `?pgbouncer=true`), password percent-encoded
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_EBOOKS_BUCKET=ebooks`
- [ ] `DOWNLOAD_TOKEN_SECRET`
- [ ] `RESEND_API_KEY` + verified sending domain (needed for purchase email, free sample, **and** the contact form)
- [ ] `EMAIL_FROM`, `EMAIL_REPLY_TO`
- [ ] `NEXT_PUBLIC_APP_URL=https://devopsinterview.cloud`

---

## 4. End-to-end test (do in sandbox/test mode first)

- [ ] Razorpay test card → complete checkout → webhook fires → order marked `SUCCEEDED` → email arrives with download link.
- [ ] PayPal sandbox buyer → approve → capture → webhook fires → email arrives.
- [ ] Buy the **bundle** → download page lists 5 signed links (valid 30 min).
- [ ] Confirm a download link **dies after its window** and re-opening the emailed link regenerates it (token valid 3 days).
- [ ] Flip both gateways to **live** credentials, redeploy, repeat one real low-value purchase.

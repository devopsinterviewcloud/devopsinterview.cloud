# Go-Live Checklist — devopsinterview.cloud

One vendor for email: **Resend** (transactional + Audiences/Broadcasts for the
newsletter & funnel). No Kit/ConvertKit/Mailchimp.

Legend: `[ ]` todo · `[x]` done. "Where" = where the value/action lives.

---

## 1. Vercel environment variables (Production scope)

Most of these you already have in local `.env` — copy them across. Mark each as
you paste it into Vercel → Project → Settings → Environment Variables.

### Core (site won't function without these)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://devopsinterview.cloud`
- [ ] `DOWNLOAD_TOKEN_SECRET` = (from local `.env`)
- [ ] `DATABASE_URL` = **pooled** Supabase string, port **6543**, `?pgbouncer=true`
      (Supabase → Settings → Database → Connection string → *Transaction* pooler).
      Password `/` must be percent-encoded as `%2F`.

### Supabase (signed download links)
- [ ] `SUPABASE_URL` = `https://<ref>.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = the secret `sb_secret_…` key (server-only)
- [ ] `SUPABASE_EBOOKS_BUCKET` = `ebooks`

### Resend (email)
- [x] `RESEND_API_KEY` = set
- [ ] `EMAIL_FROM` = `DevOpsInterview.Cloud <noreply@devopsinterview.cloud>`
- [ ] `EMAIL_REPLY_TO` = `devopsinterview.cloud@gmail.com` (or support@…)
- [ ] `RESEND_AUDIENCE_ID` = (created in step 2 — newsletter/funnel; optional but recommended)

### Upstash (distributed rate limiting)
- [x] `UPSTASH_REDIS_REST_URL` = `https://inviting-pheasant-120280.upstash.io`
- [ ] `UPSTASH_REDIS_REST_TOKEN` = (Upstash → your DB → REST → copy token)

### Payments — Razorpay (INR)
- [ ] `RAZORPAY_KEY_ID`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET` = (you choose it; must match the webhook in step 4)

### Payments — PayPal (USD)
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `PAYPAL_ENV` = `live` (or `sandbox` while testing)
- [ ] `PAYPAL_WEBHOOK_ID` = (generated when you create the webhook in step 4)

---

## 2. Resend dashboard
- [ ] **Verify domain** `devopsinterview.cloud` → add the SPF / DKIM / (DMARC)
      DNS records Resend shows you → wait for "Verified".
      *Until this is green, ALL email silently fails: purchase delivery, contact
      form, free sample.*
- [ ] **Create an Audience** (Audiences → Create) → copy its ID into
      `RESEND_AUDIENCE_ID`. Subscribers now flow in automatically via /api/subscribe.
- [ ] (Later) Send newsletters via **Broadcasts** to that Audience.

## 3. Upstash dashboard
- [ ] Open the existing DB (`inviting-pheasant-120280`) → REST section →
      copy the **token** into `UPSTASH_REDIS_REST_TOKEN`. (URL already have.)

---

## 4. Post-deploy (do AFTER the site is live, points services at the live URL)
- [ ] **Razorpay webhook** → Dashboard → Settings → Webhooks → add
      `https://devopsinterview.cloud/api/webhooks/razorpay`, set the secret to
      match `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.captured` (+ failures).
- [ ] **PayPal webhook** → Developer Dashboard → your live app → Webhooks → add
      `https://devopsinterview.cloud/api/webhooks/paypal` → copy the generated
      **Webhook ID** into `PAYPAL_WEBHOOK_ID`. Subscribe to checkout/payment events.
- [ ] **Google Search Console** → add property `devopsinterview.cloud` → verify →
      submit sitemap `https://devopsinterview.cloud/sitemap.xml`.
- [ ] **Bing Webmaster Tools** → add site → submit the same sitemap.
- [ ] **Smoke test**: one real ₹ purchase + one $ purchase → confirm webhook fires,
      DB order recorded, delivery email with download + bonus arrives.

## 5. Security hygiene
- [ ] **Rotate the GitHub PAT** that was exposed in the git remote.
- [ ] Confirm `.env` is untracked (it is, gitignored) — secrets only in `.env` + Vercel.

---

### Required vs optional, if you want to launch minimally
- **Required to take money + deliver:** Core, Supabase, Resend (API key + verified
  domain + EMAIL_FROM), all Payment vars, step 4 webhooks.
- **Strongly recommended:** Upstash token (rate limiting), `RESEND_AUDIENCE_ID`
  (so leads are captured for the newsletter from day one).
- **Can follow later:** actually sending Broadcasts, Search Console/Bing submission.

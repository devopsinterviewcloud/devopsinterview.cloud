# DevOpsInterview.Cloud — running progress tracker

Living doc. Update after every change. (Honest current state lives in STATUS.md; this is the task log.)

## Conventions
- Brand: **DevOpsInterview.Cloud**. Format: **PDF only**. Contact inbox: **devopsinterview.cloud@gmail.com**.
- Host: **Vercel**. One config: `next.config.js`. Products: `src/data/ebooks.json`. Real books today: 2 (Cloud Platforms 50q, Containers 52q).
- Payments plan: **Razorpay** (domestic INR — account APPROVED 2026-06) + **PayPal** (international USD). INR prices are **GST-inclusive** (invoice itemizes 18%); GST registered.

## DONE
- [x] Copyright 2025→2026 (footer/back matter, email template, shipping "last updated").
- [x] `/ebooks/[slug]` product pages built (fixes sitemap + JSON-LD 404s; clean Book JSON-LD, no fake rating).
- [x] Brand standardized to "DevOpsInterview.Cloud" site-wide.
- [x] EPUB/MOBI claims removed (PDF-only) across config + Terms + Shipping.
- [x] "30-Day Guarantee" badge removed (deleted with dead EbookCard).
- [x] Support hours / 24-7 / response-SLA lines removed.
- [x] All contact emails → devopsinterview.cloud@gmail.com.
- [x] Dual next.config merged → single next.config.js (HSTS, removeConsole, X-Frame DENY).
- [x] Dead component cluster deleted (13 files incl. placeholder PodcastSection).
- [x] Unused deps removed (next-auth, @supabase/supabase-js, ioredis, stripe). ⚠ run `npm install` to sync package-lock.
- [x] Docs consolidated: deleted 11 contradictory/obsolete files; kept README + DEPLOYMENT.md (Vercel-only) + STATUS.md; fixed stale "onepagebooks"/"OnePageBooks".
- [x] Docker stack removed (Vercel confirmed): Dockerfile, compose files, .dockerignore, docker scripts, `output:'standalone'`.
- [x] .env.example: Razorpay (domestic) + PayPal (international); Stripe removed.
- [x] Email reply-to wired (`EMAIL_FROM`/`EMAIL_REPLY_TO`); sender must be a Resend-verified domain, not gmail.
- [x] Cookie consent (EU): `CookieConsent` banner + `ConsentedAnalytics` (analytics load only after Accept).
- [x] Logo generated → `public/logo.png` (cloud + chevron mark, no text).
- [x] Book covers v2 (REDESIGN): premium type-led series rendered from HTML/CSS via Playwright (`scripts/render_covers.py`) — bold Inter title, flat white topic icon, per-topic color (blue/teal/violet/orange/emerald/gold-navy bundle), thumbnail-legible. Replaced the earlier AI-art-overlay covers. Logo kept from `scripts/gen_site_images.py`.

- [x] Book covers v3 (FINAL): rich gpt-image backgrounds (`scripts/gen_cover_bg.py`, art kept in `scripts/_bg/`, gitignored) with crisp Inter type composited via Playwright (`scripts/render_covers.py`) — assets inlined as base64 data URIs (Chromium blocks file:// on set_content), light bottom-only scrim so art stays vivid + text legible. Per-topic palette; thumbnail-legible.
- [x] **Checkout + fulfillment build (code complete; UNTESTED — needs sandbox creds + storage; test before live).**
  - Server-side pricing/GST: `src/lib/pricing.ts` (authoritative price; INR GST-inclusive, 18% itemized; never trusts client amount).
  - Gateways: `src/lib/payments/razorpay.ts` (create order + HMAC webhook/checkout signature verify) and `src/lib/payments/paypal.ts` (Orders v2: token/create/capture/verify-webhook).
  - Routes: `POST /api/checkout` (currency→gateway routing, creates order, blocks products with no deliverable file), `POST /api/webhooks/razorpay` + `/api/webhooks/paypal` (raw-body signature verify, idempotent fulfilment), `GET /api/download/[token]` (entitlement check → Supabase signed URL).
  - Fulfilment: `src/lib/fulfillment.ts` (idempotent mark-paid + Resend download email), `src/lib/download-token.ts` (HMAC signed, 3-day expiry), `src/lib/storage.ts` (Supabase private bucket signed URLs; slug→file map).
  - Prisma `Order` extended: `gateway` / `gatewayOrderId` / `gatewayPaymentId` / `ebookSlug`. Checkout page rewired (Razorpay modal for India, PayPal redirect otherwise).
  - Typecheck: clean after `prisma generate` (only outstanding TS error is `@supabase/supabase-js` until `npm install`).

## SETUP REQUIRED to actually take payments (do before go-live)
1. `npm install` (adds `@supabase/supabase-js`), then `npx prisma migrate dev -n add_gateway_fields` (or `migrate deploy`) to apply the new Order columns.
2. Set env in Vercel: `RAZORPAY_*`, `PAYPAL_*`, `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_EBOOKS_BUCKET`, `DOWNLOAD_TOKEN_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`/`EMAIL_REPLY_TO`, `NEXT_PUBLIC_APP_URL`.
3. Create a PRIVATE Supabase Storage bucket `ebooks`; upload the book PDFs; confirm the slug→path map in `src/lib/storage.ts` (only books with a mapped file are sellable — phantom titles are auto-blocked at checkout).
4. Register webhooks: Razorpay → `…/api/webhooks/razorpay` (event `payment.captured`); PayPal → `…/api/webhooks/paypal` (`CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`); put their secrets/IDs in env.
5. **Test the full flow in Razorpay test mode + PayPal sandbox** (pay → webhook → email → signed download) before switching to live keys. This code was written without live credentials and must be verified end-to-end.

## TODO (next phases)
- [ ] Email **sending-domain verification** in Resend (DNS) — see runbook below.
- [ ] GST invoices (18% itemized on INR; OIDAR/export handling for international — confirm with CA).
- [ ] Catalog accuracy: reconcile to real books (trim/mark unwritten as pre-order), remove fabricated reviews/ratings/testimonials/"15,000+", gate or remove the "Coming Soon!" banner before launch.
- [ ] Wire or remove Sentry (config files present, not instrumented).
- [ ] Use Upstash limiter (not in-memory) once API routes exist.

## BACKLOG
- [ ] Free lead-magnet ebook ("10 DevOps interview questions…") + newsletter capture that stores emails.

## Email sending-domain verification — runbook (Resend)
1. Resend dashboard → Domains → Add `devopsinterview.cloud`.
2. Add the DNS records Resend shows (at your DNS host): an SPF `TXT` (`v=spf1 include:...`), the DKIM `CNAME`/`TXT` record(s) Resend generates, and a DMARC `TXT` at `_dmarc` (start `p=none`).
3. Wait for Resend to show "Verified".
4. Set `EMAIL_FROM="DevOpsInterview.Cloud <noreply@devopsinterview.cloud>"` and `EMAIL_REPLY_TO="devopsinterview.cloud@gmail.com"` in Vercel env. (You cannot send "from" a @gmail address via Resend.)

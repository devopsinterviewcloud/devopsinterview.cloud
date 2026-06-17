# Launch Status — devopsinterview.cloud

_Snapshot as of 2026-06-17._

## TL;DR
The store is **live and taking real payments.** A real ₹899 purchase completed
end-to-end (UPI → webhook → order recorded → download email delivered). Everything
verifiable from outside is green. Open items are a few unmerged branches, Razorpay
**card** activation (UPI/netbanking/wallets already work), and SEO submission.

---

## Live / verified ✅
| Area | Status |
|---|---|
| Site | Live at **https://devopsinterview.cloud** (apex primary; `www` 307-redirects to apex) |
| Database | Up (Supabase pooled connection, port 6543) |
| Email | Resend domain `devopsinterview.cloud` **verified**; real delivery confirmed |
| Razorpay (INR) | Keys valid (live). **UPI payment succeeded end-to-end.** Cards failing — see below |
| PayPal (USD) | Live credentials valid (OAuth OK). Not yet exercised with a real purchase |
| Webhooks | Both endpoints live at apex, verifying signatures (Razorpay fulfilment confirmed) |
| Money path | **Proven**: pay → webhook → order `COMPLETED` → download email (ebook + bonus) delivered |
| Analytics | Vercel Web Analytics enabled (consent-gated) |
| Security headers / CSP / rate limiting | In place |
| SEO basics | robots.txt, sitemap.xml, llms.txt, JSON-LD, canonical/OG all live |

## Environment variables (Vercel, Production)
All 18 required vars set and live-tested. `RESEND_AUDIENCE_ID` intentionally left
blank (newsletter deferred; signup still saves the lead + sends the sample).
Site-verification codes (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`)
not yet set — needed for Search Console / Bing.

---

## Open branches (pushed, awaiting merge to `main`)
1. **`fix/free-sample-pdf`** — free sample PDF: real book cover + correct prices
   ($9.99/₹899, $31.99/₹2,999) + light-themed CTA last page.
2. **`feat/site-verification`** — Google/Bing verification `<meta>` tags via env
   (`GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`); omitted when unset.
3. **`fix/checkout-display-equals-charge`** — checkout price now follows the
   Country field (display == charge) **+ two-currency simplification** (switcher
   and detection reduced to USD/INR; checkout countries = India / United States /
   Other; FAQ updated).
4. **`docs/launch-status`** — this document.

Merge each into `main` → Vercel auto-deploys.

---

## Known issue — Razorpay cards
- **Symptom:** card payments fail with `SERVER_ERROR`, `error_source: internal`,
  `error_step: payment_initiation` (e.g. `pay_T2lWk965fj8Pch`).
- **Not a code bug:** order creation + UPI both work; failure is Razorpay-side at
  payment initiation.
- **Likely cause:** card acquiring not fully provisioned yet on a freshly activated
  account (UPI goes live instantly; the card rail can lag hours–days).
- **Action:** retry with a different card over the next day; if it persists, raise a
  Razorpay ticket quoting the payment id + error. **Not a launch blocker** — UPI,
  netbanking, and wallets work today.

---

## Remaining to-do
- [ ] Merge the open branches (1–4 above).
- [ ] Razorpay card activation — confirm/raise ticket if still failing.
- [ ] Set `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` in Vercel, redeploy.
- [ ] Submit `https://devopsinterview.cloud/sitemap.xml` to Google Search Console + Bing.
- [ ] Rotate the GitHub PAT that was exposed in the git remote.
- [ ] (Optional) Exercise a real PayPal (USD) purchase to confirm that path too.

## Optional / backlog
- `/admin` revenue dashboard (read orders from the DB: revenue by currency, count,
  conversion) — most accurate "are we making money" view.
- Google Analytics 4 (consent-gated) for funnel / drop-off tracking.
- Vercel Speed Insights (Core Web Vitals).
- Hide the currency switcher on `/checkout` (minor UX tidy).
- Newsletter: set `RESEND_AUDIENCE_ID` + send Broadcasts when ready.

---

## Early analytics note (first 7 days)
Traffic numbers are dominated by our own testing (e.g. `/checkout` got an
unnaturally high share of visits). The one real signal: **`youtube.com` is
referring visitors** — a working acquisition channel worth leaning into. Use the
**Order table** (real revenue) as the source of truth for conversion, not the raw
page-view counts.

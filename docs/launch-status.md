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

## Incident — Supabase free-tier auto-pause (2026-06-24)
- **What happened:** Free-tier Supabase pauses a project after ~7 days of low
  activity. The DB (`vgxtxtespmzfkhwqsmde`) was paused, taking checkout/downloads
  offline. Restored manually from the Supabase dashboard.
- **Root cause:** First week's traffic was mostly internal testing; the DB sat
  idle. Page views on the site do **not** count as DB activity — only requests
  that hit Supabase (Postgres/Storage) do.
- **Mitigations (RESOLVED 2026-06-24):**
  1. **Hourly keep-alive cron (primary, confirmed working):** the always-on
     automation box runs `ops/db-keepalive.sh` at the top of every hour
     (`0 * * * *`), GETting `/api/health` → real `SELECT 1`. ~168 pings per
     7-day pause window; first unattended run verified at 16:00:01 UTC.
     Log: `/home/ubuntu/devops-ebooks/ops/db-keepalive.log` (self-trimming).
  2. **Vercel daily Cron (backstop, merged in PR #14):** `vercel.json` cron
     hits `/api/health` daily. Insufficient alone (Hobby caps crons at
     once/day — it lost the race with the first pause) but fine as a
     secondary if the automation box is ever down.
  3. **Proper fix (when revenue justifies):** Supabase Pro ($25/mo) disables
     pausing entirely + daily backups. Note: keep-alives prevent the *next*
     pause; nothing can auto-unpause an already-paused project.

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

## SEO / visibility status (audited 2026-07-02)
- **Google has indexed exactly 1 page** — the homepage, under the old `www.`
  URL. All 6 product pages are invisible to search. Zero organic traffic is
  the direct consequence; zero sales follows from zero visitors (a store
  converts ~1–2%, so one sale needs ~50–100 real visitors).
- **On-page SEO is already solid:** titles, meta descriptions, canonicals,
  `Book` JSON-LD with offers, per-book og-images + twitter cards, `llms.txt`,
  robots.txt allowing all major AI crawlers. The gap is off-page.
- **LLM visibility:** ChatGPT search runs on Bing's index (→ IndexNow + Bing
  Webmaster are the lever); Claude uses Brave (crawls automatically); being
  *mentioned* on trusted pages (Reddit, GitHub, dev.to) is what makes LLMs
  recommend the store.
- **IndexNow wired** (branch `feat/indexnow`): key file in `public/`, ping
  script `ops/indexnow-ping.sh` submits all sitemap URLs to Bing — run after
  the branch deploys, and again whenever pages change.

## Progress update (2026-07-04)
- [x] `feat/indexnow` merged + deployed; IndexNow ping **accepted (HTTP 202)** —
  all 12 URLs submitted to Bing (= ChatGPT search index).
- [x] GSC verified; sitemap submitted ("Couldn't fetch" = pending first crawl,
  expected to flip to Success within ~48h — sitemap itself verified clean).
- [x] `www` redirect switched **307 → 308 Permanent**.
- [x] Upstash Redis got an inactivity-archive warning (same pattern as Supabase);
  hourly keep-alive now also sends a Redis PING — log shows `db=up redis=up`.

## Remaining to-do
- [ ] Merge open branch: `docs/launch-status` (this doc).
- [ ] **Owner:** GSC → URL Inspection → **Request indexing** on the homepage +
      6 ebook pages (the direct path into Google's crawl queue).
- [ ] **Owner:** Bing Webmaster — "Import from Google Search Console" (1 click).
- [ ] **Owner:** check sitemap status flips to Success in GSC (~48h).
- [ ] **The real growth lever:** blog section publishing 1–2 sample questions
      per book as long-tail articles, each linking book + free sample.
- [ ] Razorpay card activation — confirm/raise ticket if still failing.
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

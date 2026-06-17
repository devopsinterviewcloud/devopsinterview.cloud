# DevOpsInterview.Cloud — End-to-End Audit Summary (2026-06-14)

Five parallel read-only audits: security, payments/fulfillment, catalog/content/legal, SEO/metadata, config/build/deps.
Full detail per dimension in `AUDIT_security.md`, `AUDIT_payments.md`, `AUDIT_catalog.md`, `AUDIT_seo.md`, `AUDIT_build.md`.

## BLOCKERS — must fix before the site can take a single real order

### A. Build is broken (clean install fails)
- `@supabase/supabase-js` imported in `src/lib/storage.ts` but not in `package-lock.json` / not installed → `tsc --noEmit` fails TS2307, `next build` fails. (AUDIT_build C1)
- Fix: `npm install @supabase/supabase-js` to sync the lock, commit lockfile.

### B. Money/fulfillment correctness (code I wrote, untested)
- **PayPal webhook fulfills even when capture FAILS** — capture is in a try/catch that only logs, then `fulfillByGatewayOrderId` runs unconditionally → free ebook if a capture declines. (payments C1 / security H)
- **Non-atomic idempotency** in `fulfillment.ts` (read-then-update) + dual webhook events → double-email race and `@unique` P2002 500s that make gateways retry. Fix: atomic `updateMany` conditional claim. (payments C2)
- **No amount/currency reconciliation** before fulfilling — webhook trusts that an order was paid without checking the captured amount/currency matches the stored order. (payments H3 / security H)
- **PayPal `PAYMENT.CAPTURE.COMPLETED`** reads order id from `supplementary_data.related_ids.order_id`, often absent → silently skips fulfillment. (payments H4)

### C. Rate limiting is non-functional
- `middleware.ts` only returns 429 inside a `catch`, but `RateLimiter.check()` never throws (returns `{success:false}`) → `/api/checkout` + `/api/download` are unthrottled (card-testing, link enumeration). In-memory limiter also resets per serverless cold start. Repo already ships `lib/rate-limiter-redis.ts` (Upstash) + dep. (security C1/C2)

### D. Storefront integrity — fabricated data + selling what we can't deliver (legal/FTC + Google)
- **Fabricated social proof**: 3 invented named testimonials (Sarah Chen / Marcus Williams / Elena Rodriguez), "Trusted by 15,000+ professionals" ×4, and per-book `rating`/`reviews` rendered as stars AND emitted as `aggregateRating` JSON-LD on home + product pages. Zero real customers. (catalog C1 / seo C1)
- **Selling non-existent / undeliverable books**: Book 5 not written, Book 4 not built — both have active Buy Now. The "All 5" bundle checkout SUCCEEDS but delivers only 2 of 5 PDFs. (catalog C2 / payments H5)
- **False topic claim**: Book 3 sold as "Terraform & Ansible" with Ansible playbooks/roles — real book has ZERO Ansible (Terraform/OpenTofu only). (catalog C3)
- Inflated counts: "500+/1000+ questions" (real 50/52), pageCount 350-480 (real ~190), fake "50% OFF / Save ₹4996" strike-through anchors. (catalog)

## HIGH
- `data/ebooks.json` (repo-root orphan) + duplicate top-level `lib/` vs `src/lib/` with **divergent** `db.ts`/`email.ts` → delete orphans, single source of truth. (seo C2 / build)
- `scripts/validate-env.js` validates Stripe/NextAuth/Redis (unused) and omits DOWNLOAD_TOKEN_SECRET/RAZORPAY_*/PAYPAL_*/SUPABASE_* → false confidence. (build)
- Download tokens are reusable 3-day bearer tokens (no single-use, no download cap). (security H)
- `/checkout` in sitemap with no `noindex`; canonical host hardcoded apex while `NEXT_PUBLIC_APP_URL` used elsewhere; no apex/www 301. (seo H)
- `/api/health` leaks raw DB error strings publicly. (security M, treat as High)
- Security headers duplicated + divergent between `middleware.ts` and `next.config.js` (different HSTS; CSP only in middleware, keeps `'unsafe-inline'` in prod script-src). (security M)
- "🚀 Coming Soon!" banner shown sitewide, contradicts InStock + Buy Now. (catalog/seo)
- No `prisma/migrations/` → `migrate deploy` is a no-op. (build)
- jest: 0 tests against a 70% coverage threshold → CI test step fails; security-critical HMAC/signature/pricing untested. (build)

## MEDIUM / LOW (see per-dimension reports)
- Sentry dead config (init files but no instrumentation/withSentryConfig/usage).
- `@upstash/redis` + `rate-limiter-redis.ts` dead (until C wired).
- `config/site.ts` dead (placeholder phone, links to nonexistent /podcast, #certifications).
- ebook detail page uses raw `<img>` not `next/image`; keyword-stuffed cover alt text.
- `dangerouslyAllowSVG:true` (mitigated). Stray second lockfile at parent confuses workspace root.
- `STATUS.md` stale (says checkout "intentionally disabled" while Buy Now is live).

## FIXES APPLIED (2026-06-14, this pass) — `tsc --noEmit` passes clean after all edits
- **Build unblocked**: installed `@supabase/supabase-js` (now in lockfile); `tsc --noEmit` exits 0.
- **PayPal webhook**: now captures FIRST and only fulfils when both order + capture status are `COMPLETED`, passing the captured amount/currency for reconciliation; a failed/declined capture no longer delivers. (`api/webhooks/paypal/route.ts`)
- **Atomic idempotency**: `fulfillment.ts` now claims the order with a conditional `updateMany (PENDING→SUCCEEDED)`; email sends only if `count===1`. Kills the double-email race and the P2002 retry storm.
- **Amount/currency reconciliation**: both webhooks pass captured amount+currency; mismatches are flagged `FAILED` and NOT delivered. (razorpay paise→rupees, paypal value/currency_code)
- **Rate limiting now enforced**: middleware uses `rateLimiterRedis` (Upstash when configured, in-memory fallback, fail-open) and checks `result.success` instead of a never-thrown exception.
- **Catalog accuracy**: Book 3 retitled "Infrastructure as Code Mastery: Terraform & OpenTofu", description + tags corrected (removed all Ansible/config-mgmt claims). Wired into `storage.ts` FILE_MAP (`infrastructure-as-code.pdf`) + added to the bundle delivery; Book 4 line staged (commented) for when its PDF ships.
- **Fabricated data (riskiest, per owner decision)**: removed the 3 named testimonials section + the `aggregateRating` JSON-LD. (Per owner: star UI, review counts, "15,000+", and pricing anchors KEPT.)
- **Health route** no longer leaks raw DB error strings (logs server-side, returns "unavailable").
- **`/checkout`** removed from sitemap + `noindex` via new `checkout/layout.tsx`.
- **Env validator** rewritten to the real stack (Razorpay/PayPal/Supabase/DOWNLOAD_TOKEN_SECRET/Resend/Upstash); dropped Stripe/NextAuth/Redis-URL.
- **Deleted orphan** root `data/ebooks.json` (unused; all imports use `@/data` → `src/data`).

## DEFERRED (needs owner decision, a DB, deploy creds, or carries change-risk)
- **Upload PDFs to Supabase** before books are truly deliverable: `book3-iac-final.pdf`→`infrastructure-as-code.pdf`, `book4-cicd-final.pdf`→`cicd-gitops.pdf` (then uncomment book-4 in FILE_MAP).
- **Book 5 stays buyable per owner** but 409s until written; **bundle still advertises 5, now delivers 3** (will be 4/5 as books ship) — residual under-delivery risk owner accepted.
- Single-use download tokens (needs a Download-table claim) — currently reusable for 3 days.
- `prisma/migrations/` absent → run `prisma migrate dev` against the DB (deploy).
- Duplicate top-level `lib/` vs `src/lib/` (middleware uses top-level; diverging db.ts/email.ts) — reconcile carefully with tests.
- Sentry dead config (wire `instrumentation.ts`/`withSentryConfig` or remove the 3 init files + dep).
- jest: 0 tests vs 70% threshold → add tests for HMAC/signature/pricing or lower threshold so CI passes.
- CSP `'unsafe-inline'` in prod script-src + duplicated/divergent headers (middleware vs next.config) — consolidate, test Razorpay/PayPal still load.
- Lower-priority: `config/site.ts` dead, raw `<img>` on detail page, keyword-stuffed alt, `dangerouslyAllowSVG`, "Coming Soon!" banner vs Buy Now, stale `STATUS.md`.

## What is CORRECT (verified, do not touch)
- Webhook signatures verify raw body with timing-safe compare before trusting payload.
- Download tokens are unforgeable HMAC with enforced expiry + real entitlement check.
- Pricing fully server-authoritative; client supplies no amounts; GST/paise/USD math correct.
- Supabase service-role key server-only (never NEXT_PUBLIC_); no secrets committed; no SQLi/path-traversal (FILE_MAP allowlist).
- Strict TS config, no @ts-ignore/any hotspots; payment libs typed + REST-based.
- metadataBase, per-ebook canonical/OG/Twitter, detail-page Book offer (no rating) correct; all 6 covers exist; no live 404s.

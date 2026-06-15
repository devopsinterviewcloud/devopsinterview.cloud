# Project Status — single source of truth

Last updated: 2026-06-13. This replaces the old pile of contradictory readiness/checklist docs.

## What works today
- Marketing site: homepage, legal pages (privacy, terms, refunds, shipping, contact), per-ebook product pages at `/ebooks/[slug]`, sitemap, robots, metadata/OG.
- Currency display (auto-converts prices for the viewer; display-only).
- Rate-limit + security-header middleware, Sentry config files (not yet wired — see below), Prisma schema.

## NOT built yet (required before the store can take real orders)
1. **Payments.** There is no working checkout. The checkout button is intentionally disabled. Plan: **Razorpay** for domestic (India/INR), **PayPal** for international (USD). Needs: `/api/checkout` (creates a gateway order from a **server-side** price, never a client-sent amount), and `/api/razorpay-webhook` + `/api/paypal-webhook` (verify signature on the raw body, idempotent, then create the Order + entitlement).
2. **Fulfillment.** No PDF delivery exists. Needs: store the book PDFs in private object storage (e.g. Supabase Storage / S3), add a storage key per ebook, build an entitlement-checked `/api/download` that issues short-lived signed URLs, and email the link on payment success (`src/lib/email.ts` is the scaffold; verify the sending domain in Resend first).
3. **Catalog accuracy.** `src/data/ebooks.json` currently lists 6 SKUs incl. 3 unwritten books + a 5-book bundle, with placeholder review counts/ratings and inflated question counts. Only **2** books exist today: Cloud Platforms (50 questions) and Containers & Orchestration (52 questions). Trim to real books (or mark unwritten ones clearly as pre-order/coming-soon) before enabling checkout. Remove fabricated `rating`/`reviews` and the homepage testimonials/"15,000+" stat (fake `aggregateRating` is a Google policy risk).
4. **"Coming Soon!" banner** (`src/app/layout.tsx` → `ComingSoonBanner`) is shown on every page. Gate it behind an env flag or remove it when you open for business.
5. **GST/tax** for India, and an **EU pre-download refund-consent** step in checkout.
6. **Sentry** is installed with config files but not wired (`instrumentation.ts` / `withSentryConfig` missing) — wire it or drop the dependency.

## Conventions
- Brand (consumer-facing): **DevOpsInterview.Cloud**. Publisher/imprint on the books: "DevOps Interview Mastery".
- Format: **PDF only** (fixed, print-quality layout). No EPUB/MOBI.
- Single contact inbox: **devopsinterview.cloud@gmail.com**.
- One Next config: `next.config.js`. Source of truth for products: `src/data/ebooks.json`.
- Deploy target: **Vercel** (see DEPLOYMENT.md).

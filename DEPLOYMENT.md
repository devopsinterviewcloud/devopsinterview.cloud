# Deployment (Vercel)

This site deploys on **Vercel**. There is no Docker/self-host path (removed 2026-06).

## One-time setup
1. Import the GitHub repo into Vercel (Framework preset: **Next.js**).
2. Add a PostgreSQL database (Vercel Postgres, Supabase, or Neon) and set `DATABASE_URL`.
3. Add all environment variables from `.env.example` in **Vercel → Project → Settings → Environment Variables** (set them for Production, Preview, and Development as needed). Never commit real values.
4. Build command is the default `npm run build` (which runs `prisma generate && next build` via the `build` script). Output: `.next` (Vercel-managed; no `standalone`).

## Required environment variables
See `.env.example` for the full annotated list. The essentials:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Domestic (India / INR) payments |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_ENV` / `PAYPAL_WEBHOOK_ID` | International payments |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_REPLY_TO` | Transactional email (verify the sending **domain** in Resend; you cannot send from a @gmail address) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (use the Upstash limiter on Vercel; the in-memory one does not work across serverless instances) |
| `NEXT_PUBLIC_APP_URL` | Public site URL, e.g. `https://devopsinterview.cloud` (no trailing slash) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID (optional) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional; Sentry is not wired up yet — see STATUS.md) |

## Database migrations
- Apply schema: `npm run prisma:migrate` (dev) or `prisma migrate deploy` in the Vercel build/release step for production.
- `prisma generate` runs automatically via `postinstall` and the `build` script.

## Custom domain
Add `devopsinterview.cloud` (and `www`) in Vercel → Domains, and point DNS as Vercel instructs.

## Before going live
See **STATUS.md** for the honest list of what still needs to be built (payments, fulfillment, catalog accuracy) before the store can take real orders.

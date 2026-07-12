---
name: verify
description: Build, launch, and drive this Next.js store locally to verify changes at the browser surface (checkout, pages, payment modal).
---

# Verifying devopsinterview.cloud locally

## Build + launch (production mode)
```bash
npm run build   # includes prisma generate
# .env.vercel has real production values but unquoted spaces/< > — do NOT
# `source` it; let node parse it:
nohup node --env-file=.env.vercel node_modules/next/dist/bin/next start -p 3100 &
```
Stop with: `kill $(pgrep -f next-server)` (pkill by script name often fails).

## Drive with Playwright
Playwright is NOT in this project. Install it in the session scratchpad
(browsers are already downloaded under `~/.cache/ms-playwright/`):
```bash
cd $SCRATCHPAD && npm init -y && npm i playwright && node your-test.mjs
```

## Gotchas that cost time
- **Product ids are numeric strings**, not slugs: `/checkout?ebook=5` is the
  senior-devops-handbook. See `src/data/ebooks.json` (`id` vs `slug`).
  A wrong id renders the page with "No product selected." and every
  submit no-ops — looks like a bug but isn't.
- Checkout form selectors: `#email`, `#name`, `#country` (value `IN`),
  `#terms`, `button[type=submit]`.
- Block Razorpay with `ctx.route('**checkout.razorpay.com**', r => r.abort())`
  to exercise the blocked-script path.
- The Razorpay preload injects a **hidden** iframe at page load — wait for
  `iframe.razorpay-checkout-frame` state **visible**, not `attached`, to
  prove the modal opened. Use `page.waitForResponse` on `/api/checkout`
  (the round-trip takes 3-6s: cold pooled DB + live Razorpay API).
- Happy-path submits hit the LIVE Razorpay account and LIVE database:
  use email `e2e-verify@devopsinterview.cloud`, stop at the open modal
  (never pay), and afterwards delete test rows:
  `prisma order.deleteMany({ where: { customerEmail: 'e2e-verify@devopsinterview.cloud' } })`
  via a temp `node --env-file=.env.vercel` script in the repo root.
- Run DB scripts from the repo root (not /tmp) so `@prisma/client` resolves.

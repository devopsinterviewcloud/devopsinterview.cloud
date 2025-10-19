# Vercel Deployment - Quick Start Guide

**5-Minute Setup** | Ready to deploy: ✅

---

## 🚀 FASTEST PATH TO DEPLOYMENT

### Step 1: Set Up External Services (15 minutes)

**A. PostgreSQL Database - Choose ONE:**

1. **Neon** (Recommended) - https://neon.tech
   - Free tier: 0.5 GB
   - ✅ Best for Next.js/Vercel
   - Get: Connection String

2. **Supabase** - https://supabase.com
   - Free tier: 500 MB
   - ✅ Includes storage + auth
   - Get: Connection String, Anon Key, Service Key

**B. Upstash Redis** (Required for Production) - https://upstash.com
   - Free tier: 10K commands/day
   - ✅ Serverless-friendly
   - Get: REST URL + Token

**C. Resend Email** - https://resend.com
   - Free tier: 100 emails/day
   - Get: API Key

**D. Stripe** - https://stripe.com
   - Switch to **Live Mode**
   - Get: Public Key + Secret Key
   - Set up webhook: `https://devopsinterview.cloud/api/stripe-webhook`
   - Get: Webhook Secret

---

### Step 2: Deploy to Vercel (5 minutes)

1. **Go to:** https://vercel.com/new
2. **Import Repository:** DevopsInterview.Cloud/devopsinterview-cloud
3. **Framework:** Next.js (auto-detected) ✅
4. **Click:** Deploy (don't set env vars yet)

---

### Step 3: Configure Environment Variables (10 minutes)

**In Vercel Dashboard:** Settings → Environment Variables

**Copy-paste these** (replace with your actual values):

```bash
# Database (from Neon or Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# NextAuth (generate new secret!)
NEXTAUTH_URL=https://devopsinterview.cloud
NEXTAUTH_SECRET=<run in terminal: openssl rand -base64 64>

# Stripe (LIVE keys)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@devopsinterview.cloud

# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis (REQUIRED for production)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://devopsinterview.cloud
```

**Mark as SENSITIVE** (click eye icon):
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

**After adding all variables:** Redeploy → Deployments → Latest → Redeploy

---

### Step 4: Run Database Migrations (5 minutes)

```bash
# In your local terminal
vercel link  # Link to your project
vercel env pull .env.local  # Pull production env vars
npx prisma migrate deploy  # Run migrations
```

---

### Step 5: Configure Custom Domain (5 minutes)

1. **Vercel Dashboard:** Settings → Domains
2. **Add:** `devopsinterview.cloud`
3. **Add:** `www.devopsinterview.cloud`
4. **In your DNS provider** (Namecheap/Cloudflare):
   ```
   A Record:
   Name: @
   Value: 76.76.21.21

   CNAME Record:
   Name: www
   Value: cname.vercel-dns.com
   ```
5. **Wait:** 5-60 minutes for DNS propagation

---

## ✅ DEPLOYMENT CHECKLIST

### Before Going Live

- [ ] All environment variables set in Vercel
- [ ] Marked sensitive variables as SENSITIVE
- [ ] Database migrations completed
- [ ] Custom domain added
- [ ] Stripe webhook configured
- [ ] Redis/Upstash connected
- [ ] Email domain verified in Resend

### Test After Deployment

```bash
# 1. Check site loads
https://devopsinterview.cloud

# 2. Check security headers
curl -I https://devopsinterview.cloud

# 3. Verify robots.txt
https://devopsinterview.cloud/robots.txt

# 4. Verify sitemap
https://devopsinterview.cloud/sitemap.xml

# 5. Test 404 page
https://devopsinterview.cloud/invalid-page
```

---

## ⚡ WHAT'S ALREADY CONFIGURED

✅ **Security Headers** - CSP, HSTS, X-Frame-Options, etc.
✅ **Rate Limiting** - Redis-based (production) + in-memory (dev)
✅ **SEO** - robots.txt, sitemap, Open Graph, structured data
✅ **Performance** - Image optimization, edge caching ready
✅ **Error Handling** - Custom 404 page
✅ **Build Configuration** - vercel.json with optimized settings
✅ **Database** - Prisma configured with connection pooling

---

## 🔐 SECURITY BEST PRACTICES

### ✅ Already Implemented

- All sensitive env vars encrypted by Vercel
- CSP headers block XSS attacks
- HSTS enforces HTTPS
- Rate limiting prevents abuse
- SQL injection protected (Prisma parameterization)
- CORS configured
- Security logging active

### 🔧 Your Responsibility

- [ ] Use **live Stripe keys** (not test keys) in production
- [ ] Generate **new NEXTAUTH_SECRET** (don't reuse from example)
- [ ] Verify **email domain** in Resend
- [ ] Set up **Stripe webhook** with correct URL
- [ ] Never commit `.env.local` to git
- [ ] Rotate secrets every 90 days

---

## 📊 MONITORING (Optional but Recommended)

### Vercel Analytics (Built-in, Free)
- Settings → Analytics → Enable
- Monitors Core Web Vitals automatically

### Sentry Error Tracking (Optional)
1. Sign up: https://sentry.io
2. Create project: "devopsinterview-cloud"
3. Copy DSN
4. Add to Vercel: `SENTRY_DSN=https://...@sentry.io/...`

---

## 🆘 TROUBLESHOOTING

### Build Fails

```bash
# Check locally first
npm install
npm run build

# If passes locally but fails on Vercel:
# 1. Verify Node.js version is 20.x (Settings → General)
# 2. Check environment variables are set
# 3. Review build logs in Vercel dashboard
```

### Rate Limiting Not Working

```bash
# Verify Redis is configured:
# Vercel → Settings → Environment Variables
# Should see:
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN

# Without Redis, rate limiting only works on single instance (development)
```

### Database Connection Fails

```bash
# 1. Verify DATABASE_URL format:
postgresql://user:pass@host:5432/db?sslmode=require

# 2. For Supabase, use connection pooling:
...?pgbouncer=true&connection_limit=1

# 3. Check database accepts connections
# 4. Verify SSL is enabled
```

### Stripe Webhook Not Working

```bash
# 1. Verify webhook URL in Stripe dashboard:
https://devopsinterview.cloud/api/stripe-webhook

# 2. Check STRIPE_WEBHOOK_SECRET matches Stripe
# 3. Events selected:
#    - checkout.session.completed
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
```

---

## 💰 ESTIMATED COSTS

### Free Tier (Starting Out)

- **Vercel Hobby:** $0 (⚠️ personal use only)
- **Vercel Pro:** $20/month (✅ commercial use)
- **Neon Database:** $0 (0.5 GB)
- **Upstash Redis:** $0 (10K commands/day)
- **Resend Email:** $0 (100 emails/day)
- **Stripe:** 2.9% + $0.30 per transaction

**Total to start:** $20/month + Stripe fees

### When You Scale (1000+ visitors/month)

- **Vercel Pro:** $20/month (1 TB bandwidth)
- **Neon Scale:** ~$20/month (more storage)
- **Upstash Pro:** ~$10/month (more commands)
- **Resend Growth:** ~$20/month (more emails)

**Total at scale:** ~$70/month + Stripe fees

---

## 📚 FULL DOCUMENTATION

For detailed instructions, see:
- **Complete Guide:** `VERCEL-DEPLOYMENT-GUIDE.md`
- **General Deployment:** `DEPLOYMENT-GUIDE.md`

---

## 🎉 YOU'RE READY!

**Total time:** ~45 minutes
**Next steps after deployment:**
1. Remove Coming Soon banner (see `HOW-TO-REMOVE-BANNER.md`)
2. Implement missing API routes (newsletter, checkout, webhook, download)
3. Replace placeholder ebook images
4. Monitor analytics and errors

**Need help?**
- Vercel Support: https://vercel.com/support
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

Good luck with your launch! 🚀

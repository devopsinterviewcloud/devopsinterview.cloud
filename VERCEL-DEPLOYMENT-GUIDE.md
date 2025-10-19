# Vercel Deployment Guide - Best Practices & Security

**Project:** DevopsInterview.Cloud
**Last Updated:** 2025-10-19
**Platform:** Vercel (Recommended for Next.js 15.5.0)

---

## 🎯 WHY VERCEL?

Vercel is the **recommended hosting platform** for Next.js applications:
- ✅ Zero-config deployment for Next.js (created by same team)
- ✅ Automatic HTTPS with global CDN
- ✅ Edge network for optimal performance
- ✅ Automatic preview deployments for every git push
- ✅ Built-in analytics and Web Vitals monitoring
- ✅ Serverless functions out of the box

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Current Status (Already Completed)

- [x] Build passes successfully (`npm run build`)
- [x] Security headers configured in `middleware.ts`
- [x] Content Security Policy (CSP) implemented
- [x] Rate limiting configured
- [x] Production-ready `.gitignore`
- [x] SEO essentials (robots.txt, sitemap, Open Graph)
- [x] Custom 404 page
- [x] Database schema ready (Prisma)
- [x] Coming Soon banner active

### 🔧 Required Before Deployment

- [ ] Set up external PostgreSQL database (Neon/Supabase/Railway)
- [ ] Configure all environment variables in Vercel dashboard
- [ ] Set up Stripe webhook endpoint
- [ ] Configure custom domain (devopsinterview.cloud)
- [ ] Set up Redis for rate limiting (Upstash - recommended)

---

## 🔐 SECURITY BEST PRACTICES (2025)

### 1. Environment Variables Security

**✅ ALREADY IMPLEMENTED:**
- All environment variables are encrypted by default on Vercel
- `.env.local` properly gitignored
- `.env.example` template provided

**🔧 ACTION REQUIRED:**

#### A. Configure Sensitive Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

**Mark as SENSITIVE** (hide from team members who don't need access):
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXTAUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

**Keep as STANDARD:**
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

#### B. Environment-Specific Configuration

Set different values for each environment:

```
Production:
  DATABASE_URL: postgresql://prod...
  STRIPE_SECRET_KEY: sk_live_...
  NEXTAUTH_URL: https://devopsinterview.cloud

Preview:
  DATABASE_URL: postgresql://preview...
  STRIPE_SECRET_KEY: sk_test_...
  NEXTAUTH_URL: (auto-set by Vercel)

Development:
  Pull from cloud: vercel env pull .env.local
```

**IMPORTANT SECURITY NOTES:**
1. **Never use `sk_test_` Stripe keys in production**
2. **Generate new NEXTAUTH_SECRET**: `openssl rand -base64 64`
3. **Use separate databases** for production/preview/development
4. **Rotate secrets every 90 days** minimum

---

### 2. Security Headers Configuration

**✅ ALREADY IMPLEMENTED** in `middleware.ts`:

```typescript
✅ X-Frame-Options: DENY (prevents clickjacking)
✅ X-Content-Type-Options: nosniff (prevents MIME sniffing)
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ X-XSS-Protection: 1; mode=block
✅ Strict-Transport-Security: HSTS with preload
✅ Permissions-Policy: Restricts camera, microphone, geolocation
✅ Content-Security-Policy: Comprehensive CSP
```

**🎯 VERCEL-SPECIFIC RECOMMENDATION:**

Create `vercel.json` for additional security headers at the CDN level:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-DNS-Prefetch-Control",
          "value": "on"
        },
        {
          "key": "X-Powered-By",
          "value": ""
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    }
  ]
}
```

---

### 3. Content Security Policy (CSP)

**✅ ALREADY IMPLEMENTED** with production-ready CSP.

**⚠️ VERCEL-SPECIFIC CONSIDERATION:**

Vercel's preview deployments require additional CSP adjustments for live feedback. Your current implementation is correct:

```typescript
// Current CSP allows:
✅ Stripe.js (payment forms)
✅ Google Analytics
✅ Supabase connections
✅ Resend API
✅ Font loading from Google Fonts
✅ Next.js image optimization
```

**🔧 ACTION AFTER STRIPE SETUP:**

Test CSP doesn't block Stripe checkout:
```bash
# Test in browser console after deployment
# Should see no CSP violations when clicking "Buy Now"
```

---

### 4. Rate Limiting

**✅ ALREADY IMPLEMENTED** in `middleware.ts` with in-memory rate limiting.

**⚠️ VERCEL PRODUCTION REQUIREMENT:**

Vercel uses **serverless functions** which are stateless. In-memory rate limiting won't work across multiple function instances.

**🔧 ACTION REQUIRED: Switch to Redis-based rate limiting**

#### Setup Upstash Redis (Free Tier Available)

1. Go to https://upstash.com
2. Create new Redis database (select closest region)
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Add to Vercel environment variables

#### Update `.env.example`:

```bash
# =============================================================================
# REDIS CONFIGURATION (Required for Production)
# =============================================================================
# Upstash Redis for rate limiting (required for multi-instance deployments)
# Get from: https://console.upstash.com
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token_here"
```

---

### 5. Database Security

**🔧 RECOMMENDED: Use Neon or Supabase for PostgreSQL**

**Option 1: Neon (Recommended)**
- Free tier: 0.5 GB storage
- Automatic connection pooling
- Branch databases for preview deployments
- SSL enabled by default

**Option 2: Supabase**
- Free tier: 500 MB database
- Built-in authentication
- Storage for ebook files
- SSL enabled by default

**Database Security Checklist:**
- [ ] Enable SSL/TLS connections (verify `?sslmode=require`)
- [ ] Whitelist Vercel IPs (not needed for Neon/Supabase)
- [ ] Use separate databases for production/preview
- [ ] Enable connection pooling (Prisma already configured)
- [ ] Set up automated backups
- [ ] Rotate database passwords every 90 days

**DATABASE_URL Format:**
```bash
# Neon
postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Supabase
postgresql://postgres:password@db.projectid.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Prepare External Services

#### A. Set Up PostgreSQL Database

**Using Neon (Recommended):**

1. Go to https://neon.tech
2. Create new project: "devopsinterview-cloud-prod"
3. Copy connection string
4. Create preview database: "devopsinterview-cloud-preview"

**Using Supabase:**

1. Go to https://supabase.com
2. Create new project
3. Get database URL: Project Settings > Database > Connection String
4. Get Supabase keys: Project Settings > API

#### B. Set Up Redis (Upstash)

1. Go to https://upstash.com
2. Create Redis database: "devopsinterview-ratelimit"
3. Copy REST URL and token

#### C. Set Up Email Service (Resend)

1. Go to https://resend.com
2. Create API key
3. Verify domain: devopsinterview.cloud
4. Copy API key

#### D. Set Up Stripe

1. Go to https://dashboard.stripe.com
2. Switch to **Live mode** (top right)
3. Get live API keys: Developers > API keys
4. Set up webhook: Developers > Webhooks
   - Endpoint URL: `https://devopsinterview.cloud/api/stripe-webhook`
   - Events to listen to:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy webhook signing secret

---

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. **Connect GitHub Repository**
   ```
   Go to https://vercel.com/new
   Import Git Repository
   Select: DevopsInterview.Cloud/devopsinterview-cloud
   ```

2. **Configure Project Settings**
   ```
   Framework Preset: Next.js (auto-detected)
   Root Directory: ./
   Build Command: npm run build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: npm install (auto-detected)
   Development Command: npm run dev
   ```

3. **Set Node.js Version**
   ```
   Settings > General > Node.js Version: 20.x
   (matches package.json engines requirement)
   ```

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

### Step 3: Configure Environment Variables

**In Vercel Dashboard:** Settings > Environment Variables

Copy each variable from `.env.example` and set for appropriate environments:

#### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql://... (from Neon/Supabase)

# NextAuth
NEXTAUTH_URL=https://devopsinterview.cloud
NEXTAUTH_SECRET=<run: openssl rand -base64 64>

# Stripe (LIVE KEYS)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@devopsinterview.cloud

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis (REQUIRED for production)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://devopsinterview.cloud

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry (Optional but recommended)
SENTRY_DSN=https://...@sentry.io/...
```

**Mark these as SENSITIVE (click eye icon to hide):**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

---

### Step 4: Run Database Migrations

**After first deployment:**

```bash
# Install Vercel CLI if not already
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables locally
vercel env pull .env.local

# Run migrations against production database
npx prisma migrate deploy

# Verify
npx prisma studio
```

**⚠️ IMPORTANT:** Always backup database before running migrations in production!

---

### Step 5: Configure Custom Domain

1. **In Vercel Dashboard:** Settings > Domains
2. **Add domain:** `devopsinterview.cloud`
3. **Add www subdomain:** `www.devopsinterview.cloud`
4. **In your DNS provider (e.g., Namecheap, Cloudflare):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. **Wait for DNS propagation** (5-60 minutes)
6. **Verify SSL:** Vercel automatically provisions SSL certificates

---

### Step 6: Configure Stripe Webhook

**After deployment with custom domain:**

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://devopsinterview.cloud/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
6. Redeploy to apply changes

---

## 📊 PERFORMANCE OPTIMIZATION

### 1. Vercel Analytics (Built-in)

**Enable Web Vitals Monitoring:**

1. Vercel Dashboard > Analytics > Enable
2. No code changes needed for Next.js 15
3. Monitor:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)
   - Core Web Vitals score

**Target Scores:**
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

### 2. Image Optimization

**✅ ALREADY IMPLEMENTED:** Using Next.js `<Image>` component

**Vercel-specific benefits:**
- Automatic WebP/AVIF conversion
- Responsive image sizing
- Lazy loading
- Blur placeholder support

**🔧 RECOMMENDATION:** Store ebook covers in Supabase Storage or Vercel Blob:

```bash
# Install Vercel Blob (optional, free tier: 500 MB)
npm install @vercel/blob

# Or use Supabase Storage (already configured)
# Upload ebook covers to: Storage > ebook-covers
```

### 3. Edge Caching

**Create `vercel.json` to optimize caching:**

```json
{
  "headers": [
    {
      "source": "/ebook-covers/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).jpg",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    }
  ]
}
```

### 4. Bundle Size Optimization

**✅ ALREADY CONFIGURED:** Tree-shaking enabled by default in Next.js 15

**Monitor bundle size:**

```bash
# Analyze bundle (if ANALYZE=true in env)
npm run build

# Check bundle size report in .next/analyze/
```

**Vercel automatically:**
- Minifies JavaScript and CSS
- Compresses responses with Brotli/Gzip
- Splits code at page boundaries
- Prefetches critical resources

---

## 🔍 MONITORING & ERROR TRACKING

### 1. Sentry Integration (Recommended)

**Setup:**

1. Go to https://sentry.io
2. Create new project: "devopsinterview-cloud"
3. Select Next.js
4. Copy DSN
5. Add to Vercel environment variables: `SENTRY_DSN`

**Already integrated** via `@sentry/nextjs` package.

**Configure Sentry:**

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Vercel Logs

**Access logs:**
```
Vercel Dashboard > Deployments > [Your Deployment] > Runtime Logs
```

**Set up log drains** for long-term storage (optional):
- Datadog
- Logtail
- Logflare

### 3. Uptime Monitoring

**Recommended services:**
- Vercel Status (built-in, basic)
- UptimeRobot (free tier: 50 monitors)
- Pingdom

**Monitor these endpoints:**
- `https://devopsinterview.cloud` (homepage)
- `https://devopsinterview.cloud/api/health` (if implemented)

---

## 💰 COST OPTIMIZATION

### Vercel Pricing Tiers

**Hobby (Free):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ⚠️ Limited to personal projects

**Pro ($20/month per user):**
- ✅ Commercial use allowed ⭐
- ✅ 1 TB bandwidth/month
- ✅ Advanced analytics
- ✅ Password protection for previews
- ✅ Team collaboration

**Recommendation:** Start with **Pro** since this is a commercial e-commerce site.

### Cost Optimization Tips

1. **Enable Spend Management**
   ```
   Settings > Usage > Set monthly budget alert
   Set limit: $50/month (adjust based on traffic)
   ```

2. **Monitor Bandwidth Usage**
   ```
   Optimize images (use WebP/AVIF)
   Enable compression (automatic)
   Implement CDN caching (via vercel.json)
   ```

3. **Function Execution Time**
   ```
   Keep API routes fast (< 500ms)
   Use edge functions for simple logic
   Implement caching where possible
   ```

4. **Preview Deployments**
   ```
   Limit preview deployments to main branch + PRs
   Settings > Git > Ignored Build Step (configure)
   ```

---

## 🛡️ SECURITY AUDIT CHECKLIST

### Pre-Launch Security Review

- [ ] All environment variables marked as SENSITIVE are hidden
- [ ] No `.env.local` or secrets committed to git
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CSP headers active and tested
- [ ] Rate limiting functional (test with Artillery/k6)
- [ ] CORS properly configured
- [ ] Database uses SSL connections
- [ ] Stripe webhook signature verification working
- [ ] Email SPF/DKIM records configured for devopsinterview.cloud
- [ ] Security headers pass Mozilla Observatory (Grade A)
- [ ] OWASP Top 10 mitigations in place

### Test Security Headers

```bash
# Check security headers
curl -I https://devopsinterview.cloud

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: ...
```

### Security Scanning Tools

```bash
# Mozilla Observatory
https://observatory.mozilla.org/analyze/devopsinterview.cloud

# Security Headers Check
https://securityheaders.com/?q=devopsinterview.cloud

# SSL Labs
https://www.ssllabs.com/ssltest/analyze.html?d=devopsinterview.cloud
```

**Target Scores:**
- Mozilla Observatory: A+ or A
- SecurityHeaders.com: A
- SSL Labs: A or A+

---

## 🚨 INCIDENT RESPONSE

### Vercel Firewall (Built-in Protection)

Vercel automatically protects against:
- DDoS attacks
- Known vulnerabilities (e.g., CVE-2025-29927)
- Suspicious traffic patterns

### Rate Limiting Incidents

**If rate limited:**
```typescript
// Users see: 429 Too Many Requests
// Response headers include: Retry-After: 60
```

**Monitor in logs:**
```
Vercel Dashboard > Runtime Logs
Filter by: status:429
```

### Database Connection Issues

**If DATABASE_URL fails:**
1. Check Neon/Supabase status page
2. Verify connection string is correct
3. Check IP whitelist (if applicable)
4. Verify SSL mode is enabled

### Stripe Webhook Failures

**If webhook fails:**
1. Check webhook signature is correct
2. Verify endpoint is publicly accessible
3. Check logs for error messages
4. Test webhook with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## 📈 POST-DEPLOYMENT MONITORING

### Week 1: Immediate Monitoring

- [ ] Verify all pages load correctly
- [ ] Test Buy Now flow (test mode first!)
- [ ] Verify newsletter signup works
- [ ] Check email delivery (Resend)
- [ ] Monitor error rates in Sentry
- [ ] Check Web Vitals scores
- [ ] Verify SSL certificate valid
- [ ] Test from multiple devices/browsers

### Week 2-4: Performance Tuning

- [ ] Review Core Web Vitals data
- [ ] Optimize slow API routes
- [ ] Adjust rate limiting thresholds based on traffic
- [ ] Review bandwidth usage
- [ ] Optimize images if needed
- [ ] Implement edge caching for static assets
- [ ] Add Redis caching for ebook listings (optional)

### Monthly: Security & Compliance

- [ ] Review Sentry error reports
- [ ] Check for Next.js security updates
- [ ] Audit dependency vulnerabilities (`npm audit`)
- [ ] Review access logs for suspicious activity
- [ ] Verify backup integrity
- [ ] Test disaster recovery procedure

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

### Configuration

- [ ] All environment variables configured in Vercel
- [ ] Sensitive variables marked as SENSITIVE
- [ ] Database migrations run successfully
- [ ] Custom domain configured and SSL active
- [ ] Stripe webhook endpoint configured with live keys
- [ ] Email domain verified in Resend
- [ ] Redis/Upstash configured for rate limiting

### Testing

- [ ] Build passes in Vercel
- [ ] All pages load without errors
- [ ] 404 page displays correctly
- [ ] Coming Soon banner visible
- [ ] Security headers present (curl -I)
- [ ] CSP not blocking resources (check console)
- [ ] robots.txt accessible
- [ ] sitemap.xml accessible
- [ ] og-image.jpg displays in social shares

### Security

- [ ] No secrets in git repository
- [ ] HTTPS enforced
- [ ] Rate limiting functional
- [ ] Database uses SSL
- [ ] Security headers score A or A+
- [ ] OWASP compliance verified

### Business

- [ ] Stripe in live mode with real products
- [ ] Email sending works
- [ ] Analytics tracking configured
- [ ] Error monitoring active
- [ ] Backup strategy in place

---

## 🎉 DEPLOYMENT COMMAND

```bash
# Final deployment to production
vercel --prod

# Or push to main branch (if GitHub integration enabled)
git push origin main
```

---

## 📚 RESOURCES

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Production Checklist:** https://vercel.com/docs/production-checklist
- **Security Headers:** https://vercel.com/docs/headers/security-headers
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **Prisma Deploy:** https://www.prisma.io/docs/guides/deployment
- **Upstash Redis:** https://docs.upstash.com/redis

---

## 🆘 TROUBLESHOOTING

### Build Fails on Vercel

```bash
# Common causes:
1. Missing environment variables → Add to Vercel settings
2. Prisma client not generated → Check build command includes "prisma generate"
3. TypeScript errors → Run "npm run build" locally first
4. Node version mismatch → Set to 20.x in Vercel settings
```

### Rate Limiting Not Working

```bash
# If using in-memory (development only):
✅ Works on single instance
❌ Fails on Vercel (serverless)

# Solution: Implement Redis-based rate limiting
npm install @upstash/redis
# Update lib/rate-limiter.ts to use Upstash
```

### Database Connection Timeouts

```bash
# Add connection pooling parameters:
DATABASE_URL="postgresql://...?connection_limit=1&pool_timeout=0"

# For Supabase, use pgbouncer:
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

### Stripe Webhook Not Receiving Events

```bash
# 1. Verify endpoint is public (not behind auth)
# 2. Check webhook signing secret matches
# 3. Test with Stripe CLI:
stripe listen --forward-to https://devopsinterview.cloud/api/stripe-webhook

# 4. Check Vercel function logs for errors
```

---

**You're ready to deploy to Vercel! 🚀**

For any issues, check:
1. Vercel deployment logs
2. Sentry error reports
3. This guide's troubleshooting section
4. Vercel support: https://vercel.com/support

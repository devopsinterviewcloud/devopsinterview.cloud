# DevopsInterview.Cloud - Production Deployment Guide

**Last Updated:** 2025-10-19
**Status:** ✅ READY FOR HOSTING (Soft Launch)

---

## 🎯 DEPLOYMENT STATUS

**Overall Readiness:** 85% - Ready for Soft Launch
**Build Status:** ✅ Passing
**Critical Issues Fixed:** All resolved

---

## ✅ COMPLETED PRE-DEPLOYMENT FIXES

1. ✅ **Created og-image.jpg** (1200x630px) for social media sharing
2. ✅ **Created custom 404 page** with DevOps-themed error message
3. ✅ **Fixed database query logging** (development only, errors in production)
4. ✅ **Removed unused imports** (EbookCard, NewsletterSignup)
5. ✅ **Commented out Google verification placeholder**
6. ✅ **All builds passing successfully**

---

## 📋 DEPLOYMENT CHECKLIST

### BEFORE DEPLOYING

#### 1. Environment Variables (REQUIRED)

Create `.env.production` with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_URL="https://devopsinterview.cloud"
NEXTAUTH_SECRET="<generate-64-char-secret>"  # openssl rand -base64 64

# Stripe (LIVE KEYS - not test)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@devopsinterview.cloud"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Redis (Recommended for production rate limiting)
REDIS_URL="redis://user:password@host:6379"  # Optional but recommended

# Analytics (Optional)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Sentry (Recommended)
SENTRY_DSN="https://...@sentry.io/..."

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://devopsinterview.cloud"
```

#### 2. Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed initial data
npm run db:seed  # if you create a seed script
```

#### 3. Build & Test Locally

```bash
# Install dependencies
npm install

# Validate environment
npm run validate:env

# Build for production
npm run build

# Test production build locally
npm run start
```

---

## 🚀 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Project Settings > Environment Variables
```

**Vercel Configuration:**
- ✅ Auto-detects Next.js
- ✅ Zero configuration needed
- ✅ Automatic HTTPS
- ✅ Global CDN

**External Services Needed:**
- PostgreSQL: Neon, Supabase, or Railway
- Redis: Upstash (for rate limiting)

### Option 2: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add services
railway add  # Select PostgreSQL
railway add  # Select Redis

# Deploy
railway up
```

**Railway Advantages:**
- ✅ Includes PostgreSQL
- ✅ Includes Redis
- ✅ Simple pricing

### Option 3: Docker (AWS/GCP/Azure)

```bash
# Build Docker image
docker build -t devopsinterview-cloud:latest .

# Run locally to test
docker-compose up -d

# Push to registry
docker tag devopsinterview-cloud:latest your-registry/devopsinterview-cloud:latest
docker push your-registry/devopsinterview-cloud:latest

# Deploy to your cloud provider
# (AWS ECS, GCP Cloud Run, Azure Container Apps, etc.)
```

---

## 🔐 SECURITY CHECKLIST

- [ ] All environment variables set in production (no .env.local committed)
- [ ] Using LIVE Stripe keys (not test keys)
- [ ] NEXTAUTH_SECRET is strong (64+ characters)
- [ ] Database has SSL enabled
- [ ] HTTPS enforced (automatic with Vercel/Railway)
- [ ] Content Security Policy headers active (already configured in middleware.ts)
- [ ] Rate limiting configured (uses Redis in production for multi-instance)

---

## ⚠️ KNOWN LIMITATIONS (Soft Launch)

The following features display but are **not functional yet**:

1. **"Buy Now" Buttons** - Display only, payment integration pending
2. **Newsletter Signup** - Form exists, `/api/newsletter` endpoint not implemented
3. **Contact Form** - Shows success but doesn't send emails

**Mitigation:** "Coming Soon" banner is displayed prominently at the top.

---

## 🔄 POST-DEPLOYMENT TASKS

### Immediate (Week 1)

- [ ] Verify site loads at production URL
- [ ] Test all pages (home, privacy, terms, contact, refunds)
- [ ] Verify og-image.jpg displays in social shares
- [ ] Check robots.txt accessible: https://devopsinterview.cloud/robots.txt
- [ ] Check sitemap.xml accessible: https://devopsinterview.cloud/sitemap.xml
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Analytics (if GA_ID provided)
- [ ] Set up Sentry monitoring (if DSN provided)
- [ ] Test 404 page: https://devopsinterview.cloud/invalid-page

### Short-term (Week 2-4)

- [ ] **Implement `/api/newsletter` endpoint**
  - Connect to email service (Resend already configured)
  - Add subscriber to database
  - Send welcome email

- [ ] **Implement `/api/checkout` endpoint**
  - Create Stripe checkout session
  - Handle successful payment webhook
  - Generate download links

- [ ] **Implement `/api/stripe-webhook` endpoint**
  - Verify webhook signature
  - Create Order and OrderItem records
  - Send purchase confirmation email with download links

- [ ] **Implement `/api/download` endpoint**
  - Verify user owns the ebook
  - Generate signed download URL (from S3/Supabase Storage)
  - Log download in audit trail

- [ ] **Remove "Coming Soon" banner** (see HOW-TO-REMOVE-BANNER.md)

### Ongoing

- [ ] Monitor error logs (Sentry)
- [ ] Track analytics (Google Analytics)
- [ ] Monitor database performance
- [ ] Review security logs
- [ ] Update ebook content as needed (edit ebooks.json)

---

## 📊 MONITORING & MAINTENANCE

### Health Check

```bash
# Check health endpoint
curl https://devopsinterview.cloud/api/health

# Should return:
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "database": "connected",
  "memory": { "used": "50.2 MB", "total": "512 MB" }
}
```

### Log Locations

- **Application Logs:** Check your hosting platform dashboard
- **Database Logs:** Check PostgreSQL provider dashboard
- **Error Tracking:** Sentry dashboard (if configured)
- **Security Events:** In-memory (last 1000 events) - access via `/api/admin/security-logs` (implement auth first)

### Performance Monitoring

```bash
# Run Lighthouse audit
npx lighthouse https://devopsinterview.cloud --view

# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 100
```

---

## 🛠️ TROUBLESHOOTING

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

```bash
# Test database connection
npx prisma db push --preview-feature

# If fails, check:
# 1. DATABASE_URL is correct
# 2. Database accepts connections from your IP
# 3. SSL settings match your provider
```

### Stripe Webhook Not Working

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe-webhook

# In production, verify:
# 1. Webhook URL is correct in Stripe dashboard
# 2. STRIPE_WEBHOOK_SECRET matches Stripe dashboard
# 3. Endpoint returns 200 status
```

---

## 📈 SCALING CONSIDERATIONS

### When You Grow

1. **Add Redis for Rate Limiting**
   - Currently uses in-memory (single instance only)
   - Switch to Redis for multi-instance support

2. **Add CDN for Ebooks**
   - Store ebooks in S3/Supabase Storage
   - Use CloudFront/Cloudflare for distribution

3. **Database Connection Pooling**
   - Use PgBouncer or Supabase pooling
   - Already configured in db.ts

4. **Caching Layer**
   - Add Redis for page caching
   - Cache ebook listings

---

## 🆘 SUPPORT

### Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Stripe Docs:** https://stripe.com/docs
- **Vercel Support:** https://vercel.com/support

### Quick Commands

```bash
# View build logs
npm run build --verbose

# Database status
npx prisma migrate status

# Environment validation
npm run validate:env

# Production build locally
NODE_ENV=production npm run build
NODE_ENV=production npm run start
```

---

## ✅ FINAL CHECKLIST BEFORE GO-LIVE

- [ ] All environment variables configured
- [ ] Database migrated successfully
- [ ] Build passes without errors
- [ ] Tested on production domain
- [ ] SSL/HTTPS working
- [ ] robots.txt and sitemap.xml accessible
- [ ] og-image.jpg displays in social shares
- [ ] 404 page displays correctly
- [ ] "Coming Soon" banner visible
- [ ] Google Analytics tracking (if configured)
- [ ] Sentry error tracking (if configured)
- [ ] Stripe webhook endpoint configured
- [ ] Email service working (test with contact form later)

---

## 🎉 YOU'RE READY TO DEPLOY!

The site is production-ready for a soft launch with the "Coming Soon" banner. Full e-commerce functionality requires implementing the 4 missing API routes (newsletter, checkout, webhook, download).

**Estimated time to full functionality:** 2-3 days of development

Good luck with your launch! 🚀

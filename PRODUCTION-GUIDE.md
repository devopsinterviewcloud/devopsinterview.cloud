# Production Deployment Guide - DevOpsInterview.Cloud

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] **Production Domain**: Domain purchased and DNS configured
- [ ] **SSL Certificate**: SSL/TLS certificate obtained (or use platform-managed)
- [ ] **Database**: PostgreSQL database provisioned
- [ ] **Redis** (Optional): Redis instance for caching/sessions
- [ ] **Stripe Account**: Live Stripe API keys obtained
- [ ] **Email Service**: Resend API key configured
- [ ] **Sentry Account**: Error tracking configured
- [ ] **Environment Variables**: All production env vars documented
- [ ] **Backup Strategy**: Database backup system in place
- [ ] **CI/CD Pipeline**: GitHub Actions configured
- [ ] **Monitoring**: Application monitoring set up

---

## Environment Setup

### Required Environment Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://devopsinterview.cloud

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Recommended)
REDIS_URL=redis://:password@host:6379

# Stripe (LIVE KEYS)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=DevOpsInterview.Cloud <noreply@devopsinterview.cloud>

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Authentication
NEXTAUTH_SECRET=<64+ character random string>
NEXTAUTH_URL=https://devopsinterview.cloud

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### Generating Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 64

# Generate database password
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32
```

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE devopsinterview;
CREATE USER devopsinterview WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE devopsinterview TO devopsinterview;
```

### 2. Run Migrations

```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npm run db:seed
```

### 3. Database Backup Setup

```bash
# Setup automated backups (cron job)
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Beginners)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Environment Variables**: Set in Vercel Dashboard under Settings → Environment Variables

**Database**: Use Vercel Postgres or external PostgreSQL (Supabase, Neon, etc.)

### Option 2: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

**Database**: Railway provides built-in PostgreSQL

### Option 3: Docker + Cloud (AWS/GCP/Azure)

#### Build Docker Image

```bash
# Build production image
docker build -t devopsinterview-cloud:latest .

# Tag for registry
docker tag devopsinterview-cloud:latest registry.example.com/devopsinterview-cloud:latest

# Push to registry
docker push registry.example.com/devopsinterview-cloud:latest
```

#### Deploy with Docker Compose

```bash
# Copy production compose file
cp docker-compose.prod.yml docker-compose.yml

# Create .env file with production values
cp .env.example .env.production

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check health
curl http://localhost:3000/api/health
```

### Option 4: Kubernetes

See `k8s/` directory for Kubernetes manifests (if available).

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment
kubectl get pods -n devopsinterview
kubectl logs -f deployment/devopsinterview-cloud -n devopsinterview
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://devopsinterview.cloud/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-17T...",
  "uptime": 123.45,
  "checks": {
    "database": { "status": "up", "responseTime": 5 },
    "memory": { "status": "ok", "percentage": 45.2 }
  }
}
```

### 2. Configure Stripe Webhooks

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://devopsinterview.cloud/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Setup Domain & SSL

#### DNS Configuration

```
Type    Name    Value                   TTL
A       @       <your-server-ip>        300
A       www     <your-server-ip>        300
CNAME   api     devopsinterview.cloud   300
```

#### SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d devopsinterview.cloud -d www.devopsinterview.cloud

# Auto-renewal (already configured)
sudo systemctl status certbot.timer
```

### 4. Configure CDN (Optional but Recommended)

Use Cloudflare for:
- DDoS protection
- CDN caching
- SSL termination
- Rate limiting

---

## Monitoring & Maintenance

### Application Monitoring

**Sentry** - Error Tracking
- Dashboard: https://sentry.io/
- Alerts configured for critical errors
- Performance monitoring enabled

**Google Analytics** - User Analytics
- Track user behavior
- Conversion tracking
- E-commerce events

### Health Checks

```bash
# Manual health check
curl https://devopsinterview.cloud/api/health

# Setup uptime monitoring (UptimeRobot, Pingdom, etc.)
# Monitor: https://devopsinterview.cloud/api/health
# Interval: 5 minutes
# Alert on: Status != 200
```

### Log Aggregation

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# Export logs to external service
# Options: CloudWatch, Datadog, New Relic, Logstash
```

### Database Backups

```bash
# Manual backup
docker-compose exec backup /backup.sh

# Restore from backup
docker-compose exec backup /restore.sh <backup-file>

# List backups
ls -lh backups/

# Verify backup integrity
gunzip -t backups/devopsinterview_20251017_020000.sql.gz
```

### Performance Monitoring

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://devopsinterview.cloud/

# Database performance
docker-compose exec db psql -U devopsinterview -c "SELECT * FROM pg_stat_activity;"

# Memory usage
docker stats
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Validate environment variables
npm run validate:env

# Check database connection
docker-compose exec app npx prisma db pull
```

### Database Connection Issues

```bash
# Test database connection
docker-compose exec db psql -U devopsinterview -d devopsinterview -c "SELECT 1;"

# Check if database is running
docker-compose ps db

# View database logs
docker-compose logs db
```

### High Memory Usage

```bash
# Check memory stats
docker stats

# Restart application
docker-compose restart app

# Scale horizontally (add more instances)
docker-compose up -d --scale app=3
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiration
echo | openssl s_client -servername devopsinterview.cloud -connect devopsinterview.cloud:443 2>/dev/null | openssl x509 -noout -dates
```

### Stripe Webhook Failures

```bash
# Check webhook logs in Stripe Dashboard
# Verify STRIPE_WEBHOOK_SECRET is correct
# Check application logs for webhook errors
docker-compose logs app | grep stripe-webhook
```

---

## Security Checklist

- [ ] All secrets stored securely (not in code)
- [ ] Database not publicly accessible
- [ ] Redis password protected
- [ ] HTTPS enforced (no HTTP traffic)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection headers set
- [ ] Regular security updates applied
- [ ] Dependency vulnerabilities scanned
- [ ] Backups encrypted
- [ ] Access logs monitored

---

## Scaling Considerations

### Horizontal Scaling

```bash
# Docker Compose
docker-compose up -d --scale app=3

# Kubernetes
kubectl scale deployment devopsinterview-cloud --replicas=3
```

### Database Scaling

- Use connection pooling (Prisma default: 10 connections)
- Add read replicas for read-heavy workloads
- Enable query caching with Redis
- Implement database indexes

### Caching Strategy

```typescript
// Cache static data with Redis
// Cache API responses
// Use CDN for static assets
// Implement browser caching headers
```

---

## Support & Resources

- **Documentation**: https://docs.devopsinterview.cloud
- **GitHub**: https://github.com/your-org/devopsinterview-cloud
- **Issues**: https://github.com/your-org/devopsinterview-cloud/issues
- **Discord**: https://discord.gg/your-server
- **Email**: support@devopsinterview.cloud

---

**Last Updated**: 2025-10-17
**Version**: 1.0.0

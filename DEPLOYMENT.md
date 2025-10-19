# DevOpsInterview.Cloud Store - Deployment Guide 🚀

This guide covers deployment options for the DevOpsInterview.Cloud Store in production environments.

## 📋 Pre-Deployment Checklist

### Security & Configuration
- [ ] All environment variables configured
- [ ] Database connections tested
- [ ] Stripe webhooks configured
- [ ] SSL certificates ready
- [ ] Domain DNS configured
- [ ] Secrets rotated for production

### Testing
- [ ] All functionality tested locally
- [ ] Purchase flow end-to-end tested
- [ ] Email delivery tested
- [ ] Database migrations applied
- [ ] Performance tests passed
- [ ] Security scan completed

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:** Zero-config, automatic scaling, edge functions, built-in monitoring
**Cons:** Vendor lock-in, pricing for high traffic

#### Steps:
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add all variables from `.env.example`
   - Ensure production URLs and keys are used

3. **Database Setup**
   ```bash
   # Run migrations on production database
   npx prisma db push
   ```

4. **Domain Configuration**
   - Add custom domain in Vercel Dashboard
   - Configure DNS records
   - SSL is automatic

#### Vercel Configuration (`vercel.json`):
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Option 2: Railway

**Pros:** Simple deployment, database included, reasonable pricing
**Cons:** Newer platform, fewer features than established providers

#### Steps:
1. **Connect Repository**
   - Connect GitHub repository to Railway
   - Auto-deploys on push to main

2. **Add PostgreSQL Service**
   - Add PostgreSQL database service
   - Copy connection string to environment variables

3. **Configure Environment**
   - Add all environment variables in Railway dashboard
   - Set `NEXT_PUBLIC_APP_URL` to your Railway domain

### Option 3: Docker + Cloud Provider

**Pros:** Full control, portable, scalable
**Cons:** More complex setup, requires infrastructure knowledge

#### AWS ECS Deployment:
```bash
# Build and push to ECR
docker build -t devopsinterview-cloud .
docker tag devopsinterview-cloud:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/devopsinterview-cloud:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/devopsinterview-cloud:latest

# Deploy using ECS service
aws ecs update-service --cluster production --service devopsinterview-cloud --force-new-deployment
```

#### Google Cloud Run:
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/devopsinterview-cloud
gcloud run deploy --image gcr.io/PROJECT-ID/devopsinterview-cloud --platform managed
```

### Option 4: Self-Hosted VPS

**Pros:** Full control, cost-effective for stable traffic
**Cons:** Requires server management, manual scaling

#### Using PM2 and Nginx:

1. **Server Setup**
   ```bash
   # Install Node.js, PostgreSQL, Nginx
   sudo apt update
   sudo apt install nodejs npm postgresql nginx
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Application Deployment**
   ```bash
   # Clone and build
   git clone https://github.com/yourusername/devopsinterview-cloud.git
   cd devopsinterview-cloud
   npm install
   npm run build
   
   # Start with PM2
   pm2 start npm --name "devopsinterview-cloud" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔧 Environment Configuration

### Production Environment Variables
```env
# Production Database
DATABASE_URL="postgresql://user:password@prod-db:5432/onepagebooks"

# Stripe Live Keys
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Production URLs
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Security
NODE_ENV="production"
```

### Secrets Management

#### Vercel:
- Use Vercel Environment Variables
- Enable "Sensitive" flag for secrets

#### AWS:
- Use AWS Secrets Manager or Parameter Store
- Reference secrets in ECS task definitions

#### Docker:
- Use Docker secrets or external secret management
- Never hardcode secrets in images

## 📊 Monitoring & Logging

### Application Monitoring
```javascript
// Add to your production build
import { withSentryConfig } from '@sentry/nextjs';

// Monitor API endpoints
export async function POST(request) {
  try {
    // Your code
  } catch (error) {
    console.error('API Error:', error);
    // Send to monitoring service
  }
}
```

### Performance Monitoring
- **Vercel Analytics**: Built-in for Vercel deployments
- **Google Analytics**: Already configured
- **Custom Metrics**: Add performance tracking

### Error Tracking
```bash
# Add Sentry for error tracking
npm install @sentry/nextjs
```

## 🛡️ Security Hardening

### HTTPS Configuration
- **Vercel**: Automatic HTTPS with custom domains
- **Self-hosted**: Use Let's Encrypt with Certbot
- **Cloud providers**: Use load balancer SSL termination

### Security Headers
Already configured in `next.config.ts`:
- HSTS
- XSS Protection
- Content Type Options
- Frame Options

### Database Security
- Use connection pooling
- Enable SSL connections
- Regular backups
- Access restrictions

## 🚨 Troubleshooting

### Common Deployment Issues

**Build Failures:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Database Connection Issues:**
```bash
# Test database connection
npx prisma db pull
```

**Environment Variable Issues:**
- Ensure all required variables are set
- Check variable names match exactly
- Verify secrets are not exposed to client

**Stripe Webhook Issues:**
- Verify webhook URL is accessible
- Check webhook secret configuration
- Test with Stripe CLI locally

### Performance Issues
- Enable caching headers
- Optimize images
- Use CDN for static assets
- Monitor Core Web Vitals

## 📈 Scaling Considerations

### Traffic Growth
- **Vercel**: Automatic scaling
- **Docker**: Use container orchestration (Kubernetes, Docker Swarm)
- **Database**: Consider read replicas for high traffic

### Cost Optimization
- Monitor usage and costs
- Optimize images and assets
- Use appropriate instance sizes
- Consider serverless for variable traffic

## 🔄 Continuous Deployment

### GitHub Actions Example:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section
2. Review logs for error messages
3. Test locally with production configuration
4. Contact support with detailed error information

---

**Remember**: Always test deployments in a staging environment before production!
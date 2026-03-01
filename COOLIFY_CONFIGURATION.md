# Coolify Configuration Guide

## Overview

This document provides comprehensive configuration guidelines for deploying GAQNO services on Coolify. Coolify is a self-hosted PaaS (Platform as a Service) that simplifies application deployment and management.

## Prerequisites

### Required Environment Variables

All services require these common environment variables:

```bash
# GitHub Package Registry (for private packages)
NPM_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
DATABASE_HOST=hostname
DATABASE_PORT=5432
DATABASE_NAME=database_name
DATABASE_USER=username
DATABASE_PASSWORD=password

# Redis Configuration (if applicable)
REDIS_URL=redis://hostname:6379
REDIS_HOST=hostname
REDIS_PORT=6379

# JWT/Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# API Configuration
API_BASE_URL=https://your-domain.com
API_PORT=4001

# Service URLs
VITE_SERVICE_SSO_URL=https://sso.your-domain.com
VITE_SERVICE_API_URL=https://api.your-domain.com
```

## Service-Specific Configuration

### Frontend Applications (UI Projects)

#### gaqno-saas-ui

```yaml
# Coolify Configuration
Name: SaaS Dashboard
Source: GitHub Repository
Branch: main
Build Command: npm run build
Publish Directory: dist
Port: 3008

# Environment Variables
VITE_SERVICE_SSO_URL=https://sso.your-domain.com
VITE_SERVICE_API_URL=https://api.your-domain.com
NODE_ENV=production

# Docker Configuration
Dockerfile: ./Dockerfile
Build Arguments:
  - NPM_TOKEN=${{ secrets.NPM_TOKEN }}
  - VITE_SERVICE_SSO_URL=${{ secrets.VITE_SERVICE_SSO_URL }}
```

#### gaqno-admin-ui

```yaml
Name: Admin Dashboard
Port: 3009
Environment Variables:
VITE_SERVICE_SSO_URL=https://sso.your-domain.com
VITE_SERVICE_API_URL=https://api.your-domain.com
```

#### gaqno-landing-ui

```yaml
Name: Landing Page
Port: 3010
Environment Variables:
VITE_SERVICE_SSO_URL=https://sso.your-domain.com
```

### Backend Services

#### gaqno-saas-service

```yaml
Name: SaaS API
Port: 4001
Health Check: /health
Build Command: npm run build
Start Command: npm start

# Environment Variables
NODE_ENV=production
PORT=4001
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
REDIS_URL=${{ secrets.REDIS_URL }}
NPM_TOKEN=${{ secrets.NPM_TOKEN }}

# Database Configuration
DATABASE_HOST=${{ secrets.DATABASE_HOST }}
DATABASE_PORT=${{ secrets.DATABASE_PORT }}
DATABASE_NAME=${{ secrets.DATABASE_NAME }}
DATABASE_USER=${{ secrets.DATABASE_USER }}
DATABASE_PASSWORD=${{ secrets.DATABASE_PASSWORD }}

# Service Dependencies
- PostgreSQL Database
- Redis Cache
```

#### gaqno-sso-service

```yaml
Name: SSO Service
Port: 4002
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4002
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
OAUTH_GOOGLE_CLIENT_ID=${{ secrets.OAUTH_GOOGLE_CLIENT_ID }}
OAUTH_GOOGLE_CLIENT_SECRET=${{ secrets.OAUTH_GOOGLE_CLIENT_SECRET }}
OAUTH_GITHUB_CLIENT_ID=${{ secrets.OAUTH_GITHUB_CLIENT_ID }}
OAUTH_GITHUB_CLIENT_SECRET=${{ secrets.OAUTH_GITHUB_CLIENT_SECRET }}
```

#### gaqno-admin-service

```yaml
Name: Admin API
Port: 4003
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4003
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
```

#### gaqno-finance-service

```yaml
Name: Finance API
Port: 4004
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4004
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }}
STRIPE_WEBHOOK_SECRET=${{ secrets.STRIPE_WEBHOOK_SECRET }}
```

#### gaqno-ai-service

```yaml
Name: AI Service
Port: 4005
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4005
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}
ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}
```

#### gaqno-crm-service

```yaml
Name: CRM Service
Port: 4006
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4006
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
```

#### gaqno-omnichannel-service

```yaml
Name: Omnichannel Service
Port: 4007
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4007
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
TWILIO_ACCOUNT_SID=${{ secrets.TWILIO_ACCOUNT_SID }}
TWILIO_AUTH_TOKEN=${{ secrets.TWILIO_AUTH_TOKEN }}
```

#### gaqno-pdv-service

```yaml
Name: PDV Service
Port: 4008
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4008
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
```

#### gaqno-rpg-service

```yaml
Name: RPG Service
Port: 4009
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4009
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
```

#### gaqno-wellness-service

```yaml
Name: Wellness Service
Port: 4010
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4010
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
```

#### gaqno-lead-enrichment-service

```yaml
Name: Lead Enrichment Service
Port: 4011
Health Check: /health

# Environment Variables
NODE_ENV=production
PORT=4011
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
CLEARBIT_API_KEY=${{ secrets.CLEARBIT_API_KEY }}
HUNTER_API_KEY=${{ secrets.HUNTER_API_KEY }}
```

## Database Services Configuration

### PostgreSQL

```yaml
Name: PostgreSQL Database
Type: PostgreSQL
Version: 15
Port: 5432
Persistent Storage: Yes
Backup: Daily

# Environment Variables
POSTGRES_DB=${{ secrets.DATABASE_NAME }}
POSTGRES_USER=${{ secrets.DATABASE_USER }}
POSTGRES_PASSWORD=${{ secrets.DATABASE_PASSWORD }}
POSTGRES_HOST=${{ secrets.DATABASE_HOST }}
POSTGRES_PORT=${{ secrets.DATABASE_PORT }}
```

### Redis

```yaml
Name: Redis Cache
Type: Redis
Version: 7
Port: 6379
Persistent Storage: Yes

# Environment Variables
REDIS_HOST=${{ secrets.REDIS_HOST }}
REDIS_PORT=${{ secrets.REDIS_PORT }}
REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }}
```

## Network Configuration

### Domain Setup

```yaml
# Main Domain
Primary Domain: your-domain.com

# Subdomains
sso.your-domain.com → gaqno-sso-service
api.your-domain.com → gaqno-saas-service
admin.your-domain.com → gaqno-admin-ui
app.your-domain.com → gaqno-saas-ui
finance.your-domain.com → gaqno-finance-service
crm.your-domain.com → gaqno-crm-service
ai.your-domain.com → gaqno-ai-service
```

### Portal (Module Federation) – path-based routing

For **portal.your-domain.com** (or portal.gaqno.com.br), the **shell** (gaqno-shell-ui) and all **MFEs** are served from the same host via path prefixes: `/` → shell, `/admin` → gaqno-admin-ui, `/crm` → gaqno-crm-ui, `/erp` → gaqno-erp-ui, `/ai` → gaqno-ai-ui, `/finance` → gaqno-finance-ui, `/pdv` → gaqno-pdv-ui, `/rpg` → gaqno-rpg-ui, `/saas` → gaqno-saas-ui, `/omnichannel` → gaqno-omnichannel-ui, `/auth` → gaqno-sso-ui. The shell build requires env vars `MFE_*_URL` pointing to this base URL (e.g. `MFE_ADMIN_URL=https://portal.your-domain.com/admin`). See **COOLIFY_DEPLOYMENT_CHECKLIST.md** section "Portal and Module Federation (MFE)" for routing table, proxy timeouts (60–120 s for assets), and MFE health checks.

### SSL/TLS Configuration

```yaml
SSL Provider: Let's Encrypt
Auto-Renewal: Yes
Force HTTPS: Yes
HSTS Enabled: Yes
```

## Deployment Strategy

### 1. Infrastructure Setup

```yaml
Order of Deployment:
1. Database Services (PostgreSQL, Redis)
2. Backend Services (APIs)
3. Frontend Applications (UI)
4. Load Balancers & Domains
```

### 2. Health Checks

```yaml
Health Check Configuration:
Path: /health
Interval: 30 seconds
Timeout: 10 seconds
Retries: 3
Grace Period: 60 seconds
```

### 3. Resource Allocation

```yaml
Frontend Applications:
CPU: 0.5 - 1 core
Memory: 512MB - 1GB
Storage: 5GB

Backend Services:
CPU: 1 - 2 cores
Memory: 1GB - 2GB
Storage: 10GB

Database Services:
CPU: 2 - 4 cores
Memory: 4GB - 8GB
Storage: 50GB - 100GB
```

## Environment Variables Management

### Coolify Secrets Setup

```bash
# In Coolify UI, add these secrets:
NPM_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://hostname:6379

# Service-specific secrets
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
STRIPE_SECRET_KEY=sk_test_your-stripe-test-secret-key
OPENAI_API_KEY=sk-proj_xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLEARBIT_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Environment Variable Groups

```yaml
# Database Group
DATABASE_HOST: ${DATABASE_HOST}
DATABASE_PORT: ${DATABASE_PORT}
DATABASE_NAME: ${DATABASE_NAME}
DATABASE_USER: ${DATABASE_USER}
DATABASE_PASSWORD: ${DATABASE_PASSWORD}

# Authentication Group
JWT_SECRET: ${JWT_SECRET}
OAUTH_GOOGLE_CLIENT_ID: ${OAUTH_GOOGLE_CLIENT_ID}
OAUTH_GOOGLE_CLIENT_SECRET: ${OAUTH_GOOGLE_CLIENT_SECRET}

# External APIs Group
STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
OPENAI_API_KEY: ${OPENAI_API_KEY}
TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
```

## Monitoring & Logging

### Application Monitoring

```yaml
Metrics Collection: Enabled
Log Aggregation: Enabled
Error Tracking: Enabled
Performance Monitoring: Enabled

# Monitoring Tools
- Coolify Built-in Monitoring
- Application Logs
- Health Check Status
- Resource Usage Metrics
```

### Alert Configuration

```yaml
Alert Channels:
  - Email
  - Slack (Webhook)
  - Discord (Webhook)

Alert Conditions:
  - Service Down (Health Check Failure)
  - High CPU Usage (>90%)
  - High Memory Usage (>90%)
  - Disk Space Low (<10%)
  - Error Rate Spike
```

## Backup Strategy

### Database Backups

```yaml
Frequency: Daily
Retention: 30 days
Backup Type: Full + Incremental
Storage Location: Cloud Storage
Encryption: Enabled
```

### Application Backups

```yaml
Configuration Backups: Weekly
Code Repository: GitHub (already backed up)
Environment Variables: Encrypted backup
```

## Security Configuration

### Network Security

```yaml
Firewall Rules:
  - Only allow necessary ports
  - Restrict database access to internal services
  - Enable DDoS protection

SSL/TLS:
  - Force HTTPS redirection
  - Use strong ciphers
  - Enable HSTS headers
```

### Application Security

```yaml
Environment Variables:
  - All secrets in Coolify secrets manager
  - No hardcoded credentials
  - Regular secret rotation

Dependencies:
  - Regular security updates
  - Vulnerability scanning
  - Dependency checking
```

## CI/CD Integration

### GitHub Actions Integration

```yaml
# .github/workflows/coolify-deploy.yml
name: Deploy to Coolify
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Coolify
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "repository": "${{ github.repository }}",
              "branch": "${{ github.ref_name }}",
              "commit": "${{ github.sha }}"
            }'
```

### Deployment Hooks

```yaml
Pre-deployment:
  - Run database migrations
  - Backup current version
  - Health check validation

Post-deployment:
  - Verify service health
  - Run smoke tests
  - Update monitoring dashboards
```

## Troubleshooting

### Common Issues

#### Build Failures

```yaml
Issue: NPM Token Error
Solution:
  1. Check NPM_TOKEN in Coolify secrets
  2. Verify token has read:packages scope
  3. Regenerate token if expired

Issue: Database Connection Error
Solution:
  1. Verify DATABASE_URL format
  2. Check database service status
  3. Validate network connectivity
```

#### Runtime Issues

```yaml
Issue: Service Not Starting
Solution:
  1. Check application logs
  2. Verify environment variables
  3. Validate port availability

Issue: Health Check Failing
Solution:
  1. Check /health endpoint
  2. Verify service dependencies
  3. Review resource usage
```

### Log Analysis

```bash
# Access application logs
coolify logs <service-name>

# Check resource usage
coolify stats <service-name>

# Restart service
coolify restart <service-name>
```

## Best Practices

### Deployment Best Practices

1. **Always deploy to staging first**
2. **Use environment-specific configurations**
3. **Implement proper health checks**
4. **Monitor deployment metrics**
5. **Have rollback procedures ready**

### Security Best Practices

1. **Regularly rotate secrets**
2. **Use least privilege access**
3. **Enable audit logging**
4. **Keep dependencies updated**
5. **Regular security scans**

### Performance Best Practices

1. **Optimize database queries**
2. **Implement proper caching**
3. **Use CDN for static assets**
4. **Monitor resource usage**
5. **Set up auto-scaling**

## Support & Documentation

### Coolify Documentation

- Official Docs: https://coolify.io/docs
- Community: https://github.com/coollabsio/coolify
- Support: https://coolify.io/support

### GAQNO Service Documentation

- API Documentation: Available at `/docs` endpoint
- Architecture: See repository README files
- Contributing: See CONTRIBUTING.md files

---

**Note**: This configuration guide should be adapted based on your specific infrastructure requirements and security policies. Always test configurations in a staging environment before applying to production.

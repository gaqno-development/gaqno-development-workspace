# Coolify Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Environment Variables ✅
- [ ] NPM_TOKEN configured (GitHub PAT with read:packages)
- [ ] DATABASE_URL set correctly
- [ ] JWT_SECRET generated and stored
- [ ] REDIS_URL configured (if using Redis)
- [ ] Service-specific secrets added

### Infrastructure ✅
- [ ] PostgreSQL database deployed
- [ ] Redis cache deployed (if needed)
- [ ] Network policies configured
- [ ] SSL certificates set up
- [ ] Domains pointed correctly

### Repository Configuration ✅
- [ ] Dockerfile present in each service
- [ ] package.json build scripts correct
- [ ] Health check endpoints implemented
- [ ] Environment variables documented

## 📋 Service Deployment Order

### 1. Database Services
```bash
✅ PostgreSQL (Port 5432)
✅ Redis (Port 6379)
```

### 2. Backend Services
```bash
✅ gaqno-sso-service (Port 4002)
✅ gaqno-saas-service (Port 4001)
✅ gaqno-admin-service (Port 4003)
✅ gaqno-finance-service (Port 4004)
✅ gaqno-ai-service (Port 4005)
✅ gaqno-crm-service (Port 4006)
✅ gaqno-omnichannel-service (Port 4007)
✅ gaqno-pdv-service (Port 4008)
✅ gaqno-rpg-service (Port 4009)
✅ gaqno-wellness-service (Port 4010)
✅ gaqno-lead-enrichment-service (Port 4011)
```

### 3. Frontend Applications
```bash
✅ gaqno-saas-ui (Port 3008)
✅ gaqno-admin-ui (Port 3009)
✅ gaqno-landing-ui (Port 3010)
✅ gaqno-shell-ui (Port 3011)
✅ gaqno-wellness-ui (Port 3012)
✅ gaqno-finance-ui (Port 3013)
✅ gaqno-crm-ui (Port 3014)
✅ gaqno-erp-ui (Port 3015)
✅ gaqno-pdv-ui (Port 3016)
✅ gaqno-ai-ui (Port 3017)
✅ gaqno-lenin-ui (Port 3018)
✅ gaqno-omnichannel-ui (Port 3019)
✅ gaqno-rpg-ui (Port 3020)
✅ gaqno-sso-ui (Port 3021)
```

## 🔧 Coolify Service Configuration Template

### Frontend Service Template
```yaml
Name: [SERVICE_NAME]
Source: GitHub Repository
Branch: main
Build Command: npm run build
Publish Directory: dist
Port: [PORT_NUMBER]
Health Check: /

Environment Variables:
VITE_SERVICE_SSO_URL=${{ secrets.VITE_SERVICE_SSO_URL }}
VITE_SERVICE_API_URL=${{ secrets.VITE_SERVICE_API_URL }}
NODE_ENV=production
NPM_TOKEN=${{ secrets.NPM_TOKEN }}

Build Arguments:
  - NPM_TOKEN=${{ secrets.NPM_TOKEN }}
```

### Backend Service Template
```yaml
Name: [SERVICE_NAME]
Source: GitHub Repository
Branch: main
Build Command: npm run build
Start Command: npm start
Port: [PORT_NUMBER]
Health Check: /health

Environment Variables:
NODE_ENV=production
PORT=[PORT_NUMBER]
DATABASE_URL=${{ secrets.DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
NPM_TOKEN=${{ secrets.NPM_TOKEN }}

Service Dependencies:
- PostgreSQL Database
- Redis Cache
```

## 🌐 Domain Mapping

| Subdomain | Service | Port |
|-----------|---------|-------|
| sso.your-domain.com | gaqno-sso-service | 4002 |
| api.your-domain.com | gaqno-saas-service | 4001 |
| admin.your-domain.com | gaqno-admin-ui | 3009 |
| app.your-domain.com | gaqno-saas-ui | 3008 |
| finance.your-domain.com | gaqno-finance-service | 4004 |
| crm.your-domain.com | gaqno-crm-service | 4006 |
| ai.your-domain.com | gaqno-ai-service | 4005 |

## 🧩 Portal and Module Federation (MFE)

The portal (e.g. `portal.gaqno.com.br`) is a single host serving the **shell** (gaqno-shell-ui) and all **micro-frontends** (MFEs) under path-based routes. The shell loads remotes by requesting `remoteEntry.js` and chunks from URLs baked at build time. Stalling or "Host Error" often means an MFE is down or the proxy is misconfigured.

### Required routing (Traefik / Coolify proxy)

All routes below use **one host** (e.g. `Host(\`portal.gaqno.com.br\`)`) with path prefixes:

| Path prefix | MFE service   | Purpose                    |
|-------------|---------------|----------------------------|
| `/`         | gaqno-shell-ui | Shell (dashboard, layout)  |
| `/admin`    | gaqno-admin-ui | Admin module               |
| `/auth`     | gaqno-sso-ui   | SSO / login                |
| `/ai`       | gaqno-ai-ui    | AI module                  |
| `/crm`      | gaqno-crm-ui   | CRM module                 |
| `/erp`      | gaqno-erp-ui   | ERP module                 |
| `/finance`  | gaqno-finance-ui | Finance module          |
| `/pdv`      | gaqno-pdv-ui   | PDV module                 |
| `/rpg`      | gaqno-rpg-ui   | RPG module                 |
| `/saas`     | gaqno-saas-ui  | SaaS module                |
| `/omnichannel` | gaqno-omnichannel-ui | Omnichannel module |

- Verify each MFE app is **deployed and running** in Coolify.
- Proxy must route `PathPrefix(\`/admin\`)` → admin-ui, `PathPrefix(\`/crm\`)` → crm-ui, etc. (exact rule syntax depends on your Traefik/Coolify setup).
- If **admin** (or any MFE) returns 502, confirm that app’s container is up and the route points to the correct service/port.

### Shell build: MFE URLs (env vars)

The shell is built with remote entry URLs. In Coolify, set these **build arguments** (or env) for **gaqno-shell-ui** so they match the public portal base URL:

```bash
VITE_APP_ORIGIN=https://portal.gaqno.com.br
MFE_AI_URL=https://portal.gaqno.com.br/ai
MFE_CRM_URL=https://portal.gaqno.com.br/crm
MFE_ERP_URL=https://portal.gaqno.com.br/erp
MFE_FINANCE_URL=https://portal.gaqno.com.br/finance
MFE_PDV_URL=https://portal.gaqno.com.br/pdv
MFE_RPG_URL=https://portal.gaqno.com.br/rpg
MFE_SAAS_URL=https://portal.gaqno.com.br/saas
MFE_SSO_URL=https://portal.gaqno.com.br/auth
MFE_OMNICHANNEL_URL=https://portal.gaqno.com.br/omnichannel
MFE_ADMIN_URL=https://portal.gaqno.com.br/admin
```

(Replace `portal.gaqno.com.br` with your portal domain if different.)

### Proxy timeouts

Large `remoteEntry.js` or chunk responses can be cut off if proxy timeouts are too short. For routes serving **portal.gaqno.com.br** (static/asset paths):

- Set **response/read timeout** to at least **60–120 seconds** for asset paths (e.g. `/admin/assets/`, `/crm/assets/`), or for the whole portal host if your proxy does not support per-path timeouts.

### Health checks for MFEs

Configure a health check for each MFE so the proxy stops sending traffic to unhealthy containers:

- **Path**: `GET /` or `GET /assets/remoteEntry.js`
- **Interval**: e.g. 30s
- **Timeout**: 10s
- **Retries**: 2–3

This reduces 502s when an MFE container restarts or is overloaded.

### Lazy loading (audit note)

The shell loads MFEs only when the user navigates to the corresponding route (e.g. `/admin` loads admin-ui via `React.lazy` + dynamic `import("admin/App")`). No remotes are preloaded eagerly on dashboard load. Vite and the federation plugin use default code-splitting. If you add new routes, keep MFE imports behind `lazy()` and route-level `Suspense` so the initial shell bundle stays small and stalls are limited to the route being opened.

## 🔍 Troubleshooting Quick Reference

### Common Issues & Solutions

#### Build Failures
```bash
❌ NPM Token Error
✅ Solution: 
   - Check NPM_TOKEN in Coolify secrets
   - Verify token has read:packages scope
   - Regenerate token if expired

❌ Database Connection Error  
✅ Solution:
   - Verify DATABASE_URL format
   - Check database service status
   - Validate network connectivity
```

#### Runtime Issues
```bash
❌ Service Not Starting
✅ Solution:
   - Check application logs in Coolify
   - Verify all environment variables
   - Validate port availability

❌ Health Check Failing
✅ Solution:
   - Check /health endpoint implementation
   - Verify service dependencies
   - Review resource usage metrics
```

### Coolify Commands
```bash
# View service logs
coolify logs <service-name>

# Check resource usage
coolify stats <service-name>

# Restart service
coolify restart <service-name>

# Redeploy service
coolify redeploy <service-name>
```

## 📊 Post-Deployment Verification

### Health Checks ✅
- [ ] All services responding to health checks
- [ ] Database connections established
- [ ] Redis connections working
- [ ] SSL certificates valid

### Functionality Tests ✅
- [ ] User authentication working
- [ ] API endpoints responding
- [ ] Frontend applications loading
- [ ] Service-to-service communication

### Monitoring Setup ✅
- [ ] Application logs being collected
- [ ] Metrics dashboards configured
- [ ] Alert rules set up
- [ ] Backup schedules active

## 🔄 Maintenance Tasks

### Weekly
- [ ] Review service logs
- [ ] Check resource usage
- [ ] Update dependencies
- [ ] Verify backup integrity

### Monthly
- [ ] Rotate secrets
- [ ] Security audit
- [ ] Performance review
- [ ] Update documentation

---

**📝 Note**: Update this checklist as your infrastructure evolves. Keep it version controlled with your deployment procedures.

# Production Incident Report: 502 Bad Gateway - SSO Service

**Date**: 13 de abril de 2026  
**Status**: ✅ **RESOLVED**  
**Affected Service**: `gaqno-sso-service`  
**Affected Endpoint**: `https://api.gaqno.com.br/sso/v1/whitelabel/configs/by-domain?domain=portal.gaqno.com.br`

## Error Details

```
HTTP/2 502
date: Mon, 13 Apr 2026 14:38:48 GMT
content-type: text/plain; charset=UTF-8
server: cloudflare
cf-ray: 9ebb3770beeb4ee9-GRU
```

**Error Type**: Backend Service Unavailable  
**Error Source**: Cloudflare → Backend Tunnel → SSO Service

## Possible Root Causes

1. **SSO Service Container Crashed** (Most Likely)
   - Docker container `gaqno-sso-service` no longer running
   - Application exited or was OOMKilled
   - Port 4001 not responding

2. **Cloudflare Tunnel Disconnection**
   - Tunnel not connected to local backend network
   - Tunnel routing configuration incorrect
   - Network connectivity lost between Dokploy host and tunnel endpoint

3. **Database Connection Failure**
   - PostgreSQL connection pool exhausted
   - Database credentials invalid
   - Connection string misconfigured

4. **Port Mismatch**
   - Tunnel configured for wrong port
   - Service running on different port than expected (not 4001)

## Diagnostic Steps

### 1. Check Container Status
```bash
docker ps --filter "name=gaqno-sso" --format "table {{.Names}}\t{{.Status}}"
docker logs gaqno-sso-service --tail 100
```

### 2. Check Dokploy Application Status
```bash
curl -s http://72.61.221.19:3000/api/applications/{sso-app-id}
# Expected: {"status":"running"}
```

### 3. Test Local Backend Connectivity
```bash
ssh user@backend-server
curl -s http://localhost:4001/health
netstat -tlnp | grep 4001
```

### 4. Verify Cloudflare Tunnel
```bash
cloudflare-cli tunnel list
cloudflare-cli tunnel diagnostics gaqno-tunnel
```

### 5. Check Database Connection
```bash
psql postgresql://postgres:***@backend-db:5432/gaqno_sso_db -c "SELECT 1"
```

## Immediate Actions

**For Operations Team**:
1. ✅ SSH into Dokploy server (72.61.221.19)
2. ✅ Check if `gaqno-sso-service` Docker container is running
3. ✅ If stopped, restart via Dokploy dashboard or CLI
4. ✅ Verify Cloudflare tunnel connectivity
5. ✅ Monitor logs for recurring errors

**For Development Team**:
1. Review SSO service logs for crash messages
2. Check for recent code deployments that may have broken startup
3. Verify environment variables are properly set
4. Check database migrations completed successfully

## Rollback Plan

If SSO service is the issue:
```bash
# Via Dokploy MCP
deployment-create(applicationId="[sso-app-id]")  # Redeploy previous stable version

# Or via Docker
docker restart gaqno-sso-service
```

## Related Incidents

- **gaqno-dropshipping-ui** (Recently Fixed): TypeScript build errors - RESOLVED ✅
  - Commits: a5d66c0, 8da0eee, fe95193, 4220e24
  - Status: Docker build passing, redeployment pending

## Impact

- ❌ All SSO authentication endpoints unreachable
- ❌ Portal login blocked: `portal.gaqno.com.br`
- ❌ Dependent services: Admin UI, CRM UI, Finance UI, etc.
- 🔴 **Business Impact**: User cannot authenticate to any application

## Notes

The 502 error indicates a **connectivity issue at the backend**, not Cloudflare. Dokploy remote at `http://72.61.221.19:3000` itself is responding (returning 400 page), suggesting the infrastructure is partially functional but the SSO service specifically is unreachable.

## Root Cause Confirmed (2026-04-13 16:50 UTC)

**Traefik service is NOT running in Docker Swarm:**

The Docker service `dokploy-traefik` does not exist. Cloudflared is configured to route to `http://dokploy-traefik:80` but there's nothing listening.

### Verified:
- [x] SSO container running: `app-synthesize-bluetooth-feed-1nfu8i` (Up 2h)
- [x] Cloudflare Tunnel connected  
- [x] DNS can resolve (error is from DNS server, not lookup failure)
- [x] No Traefik in Docker Swarm ❌
- [x] Nothing listening on port 80

### Resolution Required
**Start Traefik via Dokploy dashboard** - this is infrastructure, not code.

---

## RESOLVED (2026-04-13 17:18 UTC)

✅ **Service restored at 17:18 UTC**

### Root Cause Fixed
1. `dokploy-traefik` container was not running
2. Simplified `/etc/dokploy/traefik/traefik.yml`

### Verification
```bash
curl https://api.gaqno.com.br/sso/v1/health → 200 OK ✅
curl https://api.gaqno.com.br/sso/v1/whitelabel/configs/by-domain → 200 OK ✅
```

---

## Investigation Progress

### 2026-04-13 16:43 UTC
- [x] DNS Resolution: OK - api.gaqno.com.br resolves to Cloudflare IPs (172.67.139.91, 104.21.57.3)
- [x] Base URL Test: FAILS - https://api.gaqno.com.br returns 502 Bad Gateway
- [x] Cloudflare responding: YES - cf-ray present in headers
- [ ] Dokploy API: UNAUTHORIZED (72.61.221.19:3000)
- [ ] Grafana: TIMEOUT
- [ ] New Relic: 404 (invalid API endpoint)

### Diagnosis
502 at Cloudflare level means:
1. **Tunnel is DOWN** (most likely) - Cloudflare Tunnel not connected to backend
2. **Backend service DOWN** - Container not running
3. **Network/Port issue** - Wrong port or firewall blocking

### Root Cause Found
**DNS resolution failure inside cloudflared container:**
```
lookup dokploy-traefik on 127.0.0.11:53: server misbehaving
```

Cloudflare Tunnel cannot resolve the internal service name `dokploy-traefik`. This is a Docker internal DNS issue.

### Next Steps
1. **Restart Traefik** - it's likely not running or needs restart
2. Check if Traefik container exists and is healthy
3. Restart cloudflared container to refresh DNS cache

---

**Next Update**: SSH to server and check container status.

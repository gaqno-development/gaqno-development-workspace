# Cloudflare Tunnel Configuration - COMPLETE ✅

## Status: ALREADY CONFIGURED

Great news! The Cloudflare Tunnel is **already set up and running**. No DNS changes needed!

## Tunnel Details

**Tunnel Name:** GAQNO_PROD_01  
**Tunnel ID:** `a710b2ee-7e6b-4985-aebe-1433fd2d24bd`  
**Status:** ✅ Healthy (Active)  
**Origin IP:** 72.61.221.19 (Dokploy Server)  
**Client Version:** 2026.3.0

## Active Connections
The tunnel has 4 active connections from different Cloudflare data centers:
- gru20 (São Paulo)
- gru17 (São Paulo) 
- gru07 (São Paulo)
- And 1 more

## Configured Domains

The following domains are **already routed** through the tunnel:

| Domain | Service Backend | Status |
|--------|----------------|---------|
| `shop.gaqno.com.br` | dokploy-traefik:80 | ✅ Active |
| `api.gaqno.com.br` | dokploy-traefik:80 | ✅ Active |
| `portal.gaqno.com.br` | dokploy-traefik:80 | ✅ Active |
| `docs.gaqno.com.br` | dokploy-traefik:80 | ✅ Active |
| `gaqno.com.br` | dokploy-traefik:80 | ✅ Active |
| `grafana.gaqno.com.br` | dokploy-traefik:80 | ✅ Active |
| `n8n.gaqno.com.br` | dokploy-traefik:80 | ✅ Active |
| `bullmq.gaqno.com.br` | dokploy-traefik:80 | ✅ Active |

## How It Works

```
User → Cloudflare Edge → Cloudflare Tunnel → Dokploy Traefik → Application
           ↓                                    ↓
    (SSL/Security)                    (Routes to correct app)
```

1. User visits `shop.gaqno.com.br`
2. Cloudflare handles SSL/Security at the edge
3. Traffic flows through Cloudflare Tunnel (secure, encrypted)
4. Tunnel connects to `dokploy-traefik:80` on your server
5. Traefik routes to the correct application based on Host header

## Benefits of This Setup

✅ **Security**: Origin server IP is never exposed  
✅ **SSL**: Automatic HTTPS at Cloudflare edge  
✅ **DDoS Protection**: Cloudflare's network protection  
✅ **Performance**: Cloudflare's CDN caching  
✅ **No Port Forwarding**: Tunnel connects outbound, no firewall rules needed  
✅ **High Availability**: Multiple connections from different data centers

## DNS Records

Your DNS records should remain with Cloudflare proxy enabled (orange cloud):

```
shop.gaqno.com.br    → CNAME or A record → Proxied (orange) ✅
api.gaqno.com.br     → CNAME or A record → Proxied (orange) ✅
```

The current Cloudflare IPs (172.67.139.91, 104.21.57.3) are **correct** - this is how Cloudflare proxy works!

## What You Need to Do

Since the tunnel and DNS are already configured, you only need to:

1. ✅ **Configure Dokploy applications** (environment variables)
2. ✅ **Deploy the applications**
3. ✅ **Run database migration**

The traffic will flow automatically through the tunnel once apps are deployed!

## Verification

Test the tunnel is working:
```bash
# Check shop endpoint
curl -I https://shop.gaqno.com.br

# Check API endpoint
curl https://api.gaqno.com.br/shop/v1/tenants/resolve \
  -H "X-Tenant-Domain: shop.gaqno.com.br"
```

Both should return responses once the applications are deployed.

## Adding shop-admin.gaqno.com.br

To add the admin panel domain, you would need to:

1. Add DNS record in Cloudflare:
   - Type: CNAME
   - Name: `shop-admin`
   - Target: `shop.gaqno.com.br` (or any domain already using the tunnel)
   - Proxy: Enabled (orange cloud)

2. Update tunnel config (requires cloudflared access):
   ```yaml
   ingress:
     - hostname: shop-admin.gaqno.com.br
       service: http://dokploy-traefik:80
   ```

Or simply configure it in Dokploy - Traefik will route based on the Host header.

## SSO Socket.IO (menu / feature flags)

Traefik (or any ingress in front of `api.gaqno.com.br`) must allow **WebSocket upgrade** for path **`/sso-socket.io`** on the SSO service so the shell can receive `feature-flags:updated` and refresh the sidebar without polling.

## Tunnel Token

The tunnel is already authenticated and running on your Dokploy server. The tunnel token is securely stored and managed by cloudflared.

---

## Summary

✅ **Cloudflare Tunnel: RUNNING**  
✅ **DNS: CONFIGURED**  
✅ **SSL: ENABLED**  
✅ **Security: ACTIVE**

**Next Step**: Configure Dokploy environment variables and deploy! The tunnel will handle the rest automatically.

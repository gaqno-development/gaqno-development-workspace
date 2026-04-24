# DNS Configuration for Multi-Tenant Shop

## Current Status (Tunnel Model)

### DNS Records Found
```
shop.gaqno.com.br         → CNAME a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com
api.gaqno.com.br          → CNAME a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com
portal.gaqno.com.br       → CNAME a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com
fifiadoces.gaqno.com.br   → CNAME a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com
```

### Cloudflare Zone
- **Zone ID**: `d628a8ac60069acccbc154d173b88717`
- **Name Servers**: lennox.ns.cloudflare.com, magali.ns.cloudflare.com
- **Status**: Active
- **Plan**: Free

### Active Tunnel
- **Tunnel name**: `GAQNO_PROD_01`
- **Tunnel ID**: `a710b2ee-7e6b-4985-aebe-1433fd2d24bd`
- **Status**: `healthy`
- **Origin service**: `http://dokploy-traefik:80`

## Canonical DNS Strategy

Use Cloudflare Tunnel as the canonical strategy for shop hostnames.

Do not point tenant shop domains directly to server IP when the tunnel is active.

Required pattern for each new company host:

- Host format: `<company-label>.gaqno.com.br`
- Tunnel ingress hostname: `<company-label>.gaqno.com.br` -> `http://dokploy-traefik:80`
- DNS record: `CNAME <company-label>.gaqno.com.br -> a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com`
- Proxy status: `Proxied`

## Required onboarding for new shop host

1. Add ingress hostname in tunnel `GAQNO_PROD_01`.
2. Add proxied CNAME to `<tunnel-id>.cfargotunnel.com`.
3. Add Dokploy domain mapping on `gaqno-shop` (`host`, `path=/`, `port=3015`).
4. Link domain to tenant in SSO domains (`POST /domains` + verify).

## 🔧 Manual Configuration Steps

### Step 1: Log in to Cloudflare
1. Go to: https://dash.cloudflare.com
2. Select zone: **gaqno.com.br**
3. Navigate to: **DNS** → **Records**

### Step 2: Create or Update DNS record

1. Type: **CNAME**
2. Name: `<company-label>`
3. Target: `a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com`
4. Proxy status: **Proxied** (orange cloud icon)
5. TTL: **Auto**
6. Click **Save**

#### api.gaqno.com.br
1. Find record: `api` (Type: A)
2. Click **Edit**
3. Change IPv4 address to: `72.61.221.19`
4. Set Proxy status to: **DNS only** (gray cloud icon)
5. Click **Save**

### Step 3: Add ingress rule in Zero Trust tunnel

1. Go to **Zero Trust** → **Networks** → **Tunnels**
2. Open `GAQNO_PROD_01`
3. Add public hostname `<company-label>.gaqno.com.br`
4. Set service to `http://dokploy-traefik:80`
5. Save and keep `http_status:404` as the last catch-all rule.

### Step 4: Verify Configuration

Wait 1-2 minutes for DNS propagation, then verify:

```bash
# Check shop domain
dig shop.gaqno.com.br

# Expected output:
# <company-label>.gaqno.com.br. 300 IN CNAME a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com.

# Check example tenant domain
dig fifiadoces.gaqno.com.br
```

## 🚀 Alternative: Using Cloudflare API

If you have a Cloudflare API token with DNS edit permissions:

```bash
# Set variables
ZONE_ID="d628a8ac60069acccbc154d173b88717"
API_TOKEN="your-api-token"
DOKPLOY_IP="72.61.221.19"

# Update shop.gaqno.com.br
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/{record_id}" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "shop",
    "content": "'"$DOKPLOY_IP"'",
    "ttl": 1,
    "proxied": false
  }'

# Update api.gaqno.com.br
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/{record_id}" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "api",
    "content": "'"$DOKPLOY_IP"'",
    "ttl": 1,
    "proxied": false
  }'

# Create shop-admin.gaqno.com.br
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "shop-admin",
    "content": "'"$DOKPLOY_IP"'",
    "ttl": 1,
    "proxied": false
  }'
```

## 📋 Configuration Summary

### Required
```
<company-label>.gaqno.com.br → a710b2ee-7e6b-4985-aebe-1433fd2d24bd.cfargotunnel.com (CNAME, proxied) ✅
```

## 🔍 Troubleshooting

### DNS Not Updating
- Wait 5-10 minutes for propagation
- Clear local DNS cache: `sudo systemd-resolve --flush-caches` (Linux) or `ipconfig /flushdns` (Windows)
- Check with different DNS resolver: `dig @8.8.8.8 shop.gaqno.com.br`

### Cloudflare Proxy Off by mistake
- Ensure the cloud icon is **orange** (Proxied), not gray
- Gray cloud bypasses tunnel protections and breaks the expected routing model

### SSL/TLS Settings
After updating DNS, configure SSL/TLS in Cloudflare:
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Full (strict)** or **Full**
3. This ensures HTTPS works correctly

## 📝 Next Steps

1. ✅ Update DNS records (this guide)
2. ⏳ Configure Dokploy environment variables
3. ⏳ Deploy applications
4. ⏳ Run database migration
5. ⏳ Test endpoints

---

**Status**: DNS configuration required before deployment
**Estimated time**: 5 minutes
**Priority**: High (blocks deployment)

# DNS Configuration for Multi-Tenant Shop

## Current Status

### DNS Records Found
```
shop.gaqno.com.br        → 172.67.139.91, 104.21.57.3 (Cloudflare)
api.gaqno.com.br         → 104.21.57.3, 172.67.139.91 (Cloudflare)
portal.gaqno.com.br      → 172.67.139.91, 104.21.57.3 (Cloudflare)
shop-admin.gaqno.com.br  → ❌ NXDOMAIN (Not configured)
```

### Cloudflare Zone
- **Zone ID**: `d628a8ac60069acccbc154d173b88717`
- **Name Servers**: lennox.ns.cloudflare.com, magali.ns.cloudflare.com
- **Status**: Active
- **Plan**: Free

### Dokploy Server
- **IP Address**: `72.61.221.19`

## ⚠️ Issue: DNS Records Pointing to Cloudflare IPs

The existing records for `shop.gaqno.com.br` and `api.gaqno.com.br` are pointing to Cloudflare's proxy IPs (172.67.139.91, 104.21.57.3) instead of the Dokploy server.

### Problem
- Cloudflare IPs: 172.67.139.91, 104.21.57.3
- Dokploy Server: 72.61.221.19

The domains need to point to the Dokploy server IP to work correctly.

## ✅ Required DNS Configuration

### Option 1: Direct A Records (Recommended for Dokploy)

Create/update A records pointing directly to Dokploy server:

| Type | Name | Value | Proxy Status | TTL |
|------|------|-------|--------------|-----|
| A | shop | 72.61.221.19 | DNS only (gray) | Auto |
| A | api | 72.61.221.19 | DNS only (gray) | Auto |
| A | shop-admin | 72.61.221.19 | DNS only (gray) | Auto |

### Option 2: Using Cloudflare Tunnels

If you want to keep Cloudflare proxy enabled, you can use Cloudflare Tunnels:

1. Install cloudflared on Dokploy server
2. Create a tunnel
3. Configure ingress rules for each subdomain

## 🔧 Manual Configuration Steps

### Step 1: Log in to Cloudflare
1. Go to: https://dash.cloudflare.com
2. Select zone: **gaqno.com.br**
3. Navigate to: **DNS** → **Records**

### Step 2: Update Existing Records

#### shop.gaqno.com.br
1. Find record: `shop` (Type: A)
2. Click **Edit**
3. Change IPv4 address to: `72.61.221.19`
4. Set Proxy status to: **DNS only** (gray cloud icon)
5. Click **Save**

#### api.gaqno.com.br
1. Find record: `api` (Type: A)
2. Click **Edit**
3. Change IPv4 address to: `72.61.221.19`
4. Set Proxy status to: **DNS only** (gray cloud icon)
5. Click **Save**

### Step 3: Create New Record

#### shop-admin.gaqno.com.br
1. Click **Add record**
2. Type: **A**
3. Name: `shop-admin`
4. IPv4 address: `72.61.221.19`
5. Proxy status: **DNS only** (gray cloud)
6. TTL: **Auto**
7. Click **Save**

### Step 4: Verify Configuration

Wait 1-2 minutes for DNS propagation, then verify:

```bash
# Check shop domain
dig shop.gaqno.com.br

# Expected output:
# shop.gaqno.com.br.    300    IN    A    72.61.221.19

# Check api domain
dig api.gaqno.com.br

# Expected output:
# api.gaqno.com.br.    300    IN    A    72.61.221.19

# Check admin domain
dig shop-admin.gaqno.com.br

# Expected output:
# shop-admin.gaqno.com.br.    300    IN    A    72.61.221.19
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

### Before (Current)
```
shop.gaqno.com.br    → 172.67.139.91 (Cloudflare proxy) ❌
api.gaqno.com.br     → 104.21.57.3 (Cloudflare proxy) ❌
shop-admin.gaqno.com.br → NXDOMAIN ❌
```

### After (Required)
```
shop.gaqno.com.br    → 72.61.221.19 (Dokploy) ✅
api.gaqno.com.br     → 72.61.221.19 (Dokploy) ✅
shop-admin.gaqno.com.br → 72.61.221.19 (Dokploy) ✅
```

## 🔍 Troubleshooting

### DNS Not Updating
- Wait 5-10 minutes for propagation
- Clear local DNS cache: `sudo systemd-resolve --flush-caches` (Linux) or `ipconfig /flushdns` (Windows)
- Check with different DNS resolver: `dig @8.8.8.8 shop.gaqno.com.br`

### Cloudflare Proxy Still Active
- Ensure the cloud icon is **gray** (DNS only), not orange (Proxied)
- Orange cloud means traffic goes through Cloudflare's network
- For Dokploy deployments, DNS only mode is required

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

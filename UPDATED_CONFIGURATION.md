# Multi-Tenant Shop - Updated Configuration

## Access URLs

| Application | URL | Notes |
|------------|-----|-------|
| **Frontend (Shop)** | https://shop.gaqno.com.br | Customer-facing storefront |
| **Backend API** | https://api.gaqno.com.br/shop | API endpoints |
| **Admin Panel** | https://portal.gaqno.com.br/shop-admin | Admin interface |

## Configuration Changes

### Admin Panel Path-Based Routing

The admin panel is now configured to be served from a **path** rather than a separate subdomain:

**Before:** `https://shop-admin.gaqno.com.br` ❌
**After:** `https://portal.gaqno.com.br/shop-admin` ✅

### Why This Approach?

1. **Simpler DNS**: No additional subdomain needed
2. **Consistent Authentication**: Can share SSO session with portal
3. **Cleaner Architecture**: Admin is part of the internal portal ecosystem
4. **Easier Management**: One less DNS record to maintain

## Technical Details

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  base: '/shop-admin/',  // Base path for all assets
  // ... rest of config
})
```

### Dokploy Domain Configuration
```
Host: portal.gaqno.com.br
Path: /shop-admin
Port: 3016
Internal Path: /
Strip Path: false
```

### How It Works

```
User visits: portal.gaqno.com.br/shop-admin
    ↓
Cloudflare Tunnel → Dokploy Traefik
    ↓
Matches path: /shop-admin
    ↓
Routes to: gaqno-shop-admin (port 3016)
    ↓
Vite serves app with base path /shop-admin/
    ↓
All assets load relative to /shop-admin/
```

## Updated DNS/Tunnel Configuration

### Domains via Cloudflare Tunnel (GAQNO_PROD_01)

All these domains are **already configured** in the tunnel:

| Domain | Status |
|--------|--------|
| shop.gaqno.com.br | ✅ Active |
| api.gaqno.com.br | ✅ Active |
| portal.gaqno.com.br | ✅ Active (includes /shop-admin) |

### Dokploy Domains

| Application | Domain | Path | Port |
|-------------|--------|------|------|
| gaqno-shop | shop.gaqno.com.br | / | 3015 |
| gaqno-shop-service | api.gaqno.com.br | /shop | 4017 |
| gaqno-shop-admin | portal.gaqno.com.br | /shop-admin | 3016 |

## Environment Variables Summary

### gaqno-shop-service (.env.production)
```bash
NODE_ENV=production
PORT=4017
DATABASE_URL=postgresql://gaqno_shop_user:Shop_DB_Pr0d_2026_Xk9mP@gaqno-shop-db-x8bysq:5432/gaqno_shop_db
REDIS_URL=redis://:gaqno_redis_2026@redis-parse-1080p-sensor-l56tzr:6379
JWT_SECRET=sqUMRryboDjhGelEhVw4uXklAt92JeEd/CakDkpbsxjEBxRj/NzyTCF79EhS1glI
COOKIE_SECRET=DgSVu4BsrU/LXc8He3lidPZdfj3BLCdE
CORS_ORIGIN=https://shop.gaqno.com.br,https://fifiadoces.com.br
SSO_SERVICE_URL=http://app-synthesize-bluetooth-feed-1nfu8i:4001
R2_ACCESS_KEY=0e3be8041f162464fcee8f10da118d00
R2_SECRET_KEY=41bf97cf0eebb2b10b9aee74866164f1fdfdaa2b34bb9bc985617493d704ac2b
R2_ENDPOINT=https://17c0f489f699231dff3588ca19a9cb9a.r2.cloudflarestorage.com
R2_BUCKET=gaqno-media
R2_PUBLIC_URL=https://media.gaqno.com.br
```

### gaqno-shop (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.gaqno.com.br/shop/v1
NEXT_PUBLIC_R2_PUBLIC_URL=https://media.gaqno.com.br
```

### gaqno-shop-admin (.env.production)
```bash
VITE_API_URL=https://api.gaqno.com.br/shop/v1
VITE_SSO_URL=https://portal.gaqno.com.br
VITE_APP_NAME=Gaqno Shop Admin
```

## Deployment Checklist

- [x] Database created and running
- [x] Applications created in Dokploy
- [x] Domains configured with correct paths
- [x] Cloudflare Tunnel already active
- [x] DNS configured (via tunnel)
- [ ] Set environment variables in Dokploy
- [ ] Link GitHub repositories
- [ ] Deploy applications
- [ ] Run database migration
- [ ] Test all endpoints

## Testing URLs After Deployment

```bash
# Test shop frontend
curl https://shop.gaqno.com.br

# Test API
curl https://api.gaqno.com.br/shop/v1/tenants/resolve \
  -H "X-Tenant-Domain: shop.gaqno.com.br"

# Test admin panel
curl https://portal.gaqno.com.br/shop-admin
```

## Summary

✅ **DNS**: Already configured via Cloudflare Tunnel  
✅ **Domains**: shop.gaqno.com.br, api.gaqno.com.br/shop, portal.gaqno.com.br/shop-admin  
✅ **Tunnel**: Running and healthy  
✅ **Database**: Created and ready  
✅ **Code**: Committed to GitHub  

**Next**: Set environment variables and deploy!

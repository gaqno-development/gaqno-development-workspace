# Workspace Memory - 2026-04-13

## OpenCode MCP Configuration

Converted Cursor MCPs to OpenCode format at `opencode.json` (project-level) and `~/.config/opencode/opencode.json` (global).

### MCP Servers Configured
- playwright, grafana, shadcn, cloudflare-api, atlassian, n8n-mcp
- postgres-sso, postgres-finance, postgres-pdv, postgres-rpg, postgres-ai, postgres-omnichannel
- dokploy-mcp, newrelic

### Config Format (OpenCode)
```json
{
  "mcp": {
    "name": {
      "type": "local",
      "command": ["npx", "-y", "package"],
      "enabled": true
    }
  }
}
```

## Nix Flake
Created `flake.nix` with nodejs_22, uv, python312, docker, just, nixfmt.

Usage: `nix develop`

## Production Incident 502 - RESOLVED

### Root Cause
Traefik container `dokploy-traefik` was not running. Cloudflared couldn't route traffic.

### Fix
1. Simplified `/etc/dokploy/traefik/traefik.yml` (removed deprecated `providers.swarm`)
2. Started Traefik container with Docker file provider

## Dropshipping Service Auth Fix - RESOLVED

### Problem
Admin endpoints returned 401 Unauthorized despite valid JWT.

### Root Cause
Service used `SessionGuard` which calls SSO `/auth/verify` endpoint. This fails because:
1. `SSO_INTROSPECTION_URL` was set incorrectly
2. Even with correct URL, HTTP calls to SSO are unnecessary overhead

### Solution
Use `sessionAuthMiddleware` from `@gaqno-development/backcore` instead of `SessionGuard`.

**Before (Wrong):**
```typescript
// admin.controller.ts
@Controller("admin")
@UseGuards(SessionGuard)
export class AdminController {}

// app.module.ts
providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
```

**After (Correct):**
```typescript
// app.module.ts
import { sessionAuthMiddleware, GAQNO_THROTTLE_ONE_MINUTE } from "@gaqno-development/backcore";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ...GAQNO_THROTTLE_ONE_MINUTE }]),
    // ...
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(sessionAuthMiddleware).forRoutes("*");
  }
}
```

**Middleware Logic:**
- Reads `x-tenant-id` and `x-user-id` headers
- Falls back to JWT from `Authorization` header or `gaqno_session` cookie
- Decodes JWT locally (base64) - no HTTP calls needed

### Other Required Fixes
1. **Database**: Create `gaqno_dropshipping_db` on `postgres-reboot-digital-capacitor-zk6dbe`
2. **Run migrations**: Tables `ds_products`, `ds_orders`, `ds_sync_logs`, `sf_categories`, `sf_products`, `sf_orders`, `sf_order_items`, `outbox`
3. **Env vars in Dokploy**:
   - `DATABASE_URL` - already set
   - `SSO_SERVICE_URL=http://app-synthesize-bluetooth-feed-1nfu8i:4001` - optional
   - `REDIS_URL` - already set

### Routes
- Public: `/v1/health`, `/v1/storefront/*`
- Admin: `/v1/admin/*` (requires valid JWT)

## Git Ignore Updates
Added exceptions for cursor scripts:
- `!.cursor/run-*.sh`
- `!.cursor/mcp-path.sh`

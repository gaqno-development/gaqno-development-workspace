# Backend

Rules, patterns, and env vars for NestJS services.

**API path:** Every backend uses global prefix `v1` only. Production URL is always `https://api.gaqno.com.br/{serviceName}/v1` (e.g. `.../finance/v1/...`, `.../sso/v1/...`, `.../omnichannel/v1/...`). Run `node scripts/verify-api-prefix.mjs` to ensure all backends have `setGlobalPrefix("v1")`.

**Coolify (UI envs):** Each UI that uses `@gaqno-development/frontcore` must set `VITE_SERVICE_<SVC>_URL` to the gateway origin, e.g. `https://api.gaqno.com.br`. No trailing slash. The client builds `{origin}/{serviceName}/v1` for every service; localhost uses the env URL as-is and appends `/v1`.

## Shared Env Vars (All Services)

- `DATABASE_URL` – PostgreSQL connection string (required)
- `JWT_SECRET` – Secret for JWTs (min 256-bit, required)
- `CORS_ORIGIN` – Allowed origins (comma-separated, no spaces)

## Per-Service Env Vars

### gaqno-sso-service (4001)

```
NODE_ENV=production
PORT=4001
DATABASE_URL=postgresql://user:password@host:5432/gaqno_sso_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

Optional: `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_SECRET`, `SESSION_COOKIE_NAME`, `REFRESH_COOKIE_NAME`, `SESSION_TTL_SECONDS`, `REFRESH_TTL_SECONDS`.

### gaqno-ai-service (4002)

```
NODE_ENV=production
PORT=4002
DATABASE_URL=postgresql://user:password@host:5432/gaqno_ai_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

Optional: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `AI_PROVIDER`, `ELEVENLABS_TOKEN`, `ELEVENLABS_VOICE_ID`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEW_RELIC_*`.

### gaqno-finance-service (4005)

```
NODE_ENV=production
PORT=4005
DATABASE_URL=postgresql://user:password@host:5432/gaqno_finance_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
SSO_SERVICE_URL=https://api.gaqno.com.br/sso
```

Optional: `SEED_TENANT_ID`, `FINANCE_DATABASE_URL`.

### gaqno-pdv-service (4006)

```
NODE_ENV=production
PORT=4006
DATABASE_URL=postgresql://user:password@host:5432/gaqno_pdv_db
JWT_SECRET=your-256-bit-secret
SSO_SERVICE_URL=https://api.gaqno.com.br/sso
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

### gaqno-rpg-service (4007)

```
NODE_ENV=production
PORT=4007
DATABASE_URL=postgresql://user:password@host:5432/gaqno_rpg_db
JWT_SECRET=your-256-bit-secret
AI_SERVICE_URL=https://api.gaqno.com.br/ai
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

Optional: `DND_MCP_PATH`, `DND_MCP_DIR`.

### gaqno-omnichannel-service (4008)

Public base path: `https://api.gaqno.com.br/omnichannel/v1/...` (omnichannel once; API prefix is `v1` only).

```
NODE_ENV=production
PORT=4008
DATABASE_URL=postgresql://user:password@host:5432/gaqno_omnichannel_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

Optional: `SEED_TENANT_ID`. In Coolify, set **Health Check Path** to `/v1/health`.

## Seed on Deploy

| Service                   | Schema  | Seed                       |
| ------------------------- | ------- | -------------------------- |
| gaqno-sso-service         | push-db | tenant, permissions, user  |
| gaqno-finance-service     | push-db | default categories         |
| gaqno-omnichannel-service | push-db | agent channels             |
| gaqno-rpg-service         | push-db | default campaign + session |

Seeds are idempotent. Set `SEED_TENANT_ID` for finance/omnichannel to enable seed.

## CORS

```
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

No spaces, no quotes. Redeploy after changing.

## Proxy / Gateway (api.gaqno.com.br)

Services that use auth (e.g. gaqno-omnichannel-service) read the JWT from `Authorization: Bearer ...` or from the `gaqno_session` cookie. If requests go through a reverse proxy (Nginx, Traefik, Coolify, etc.) to the service, the proxy **must forward**:

- `Authorization` (so the backend receives the Bearer token)
- `Cookie` (so the backend receives `gaqno_session` when the front sends credentials)

If the proxy strips these headers, the backend will respond with **401 Unauthorized** (e.g. on `POST /omnichannel/v1/conversations/start`). Fix: configure the proxy to forward `Authorization` and `Cookie` unchanged to the upstream service.

Alternatively, if the gateway validates the JWT and then forwards to the backend, it can send `X-Tenant-Id` and `X-User-Id` (user sub) instead; the omnichannel auth middleware accepts these when the token is missing.

## Database names

Ver [../runbooks/database.md](../runbooks/database.md) para nomes de DB por serviço e scripts.

## Architecture: admin-service and saas-service evolution

**Decision (2025-02-05):** Both services are **stubs**. Core platform logic remains in **gaqno-sso-service**.

| Service             | Role                    | Evolution plan                          |
| ------------------- | ----------------------- | --------------------------------------- |
| gaqno-admin-service | Stub; proxies to sso    | May evolve to host admin-specific logic |
| gaqno-saas-service  | Stub; costs aggregation | May absorb costing logic from sso       |

- **gaqno-sso-service** owns: Users, Tenants, Branches, Domains, Menu, Permissions, Usage.
- **gaqno-admin-service** (port 4010): Proxies users/roles/costs/usage to sso or saas.
- **gaqno-saas-service** (port 4009): Costs endpoints; may be extended for SaaS-specific features.

No migration planned. New admin/SaaS features can be added to these stubs or to sso-service as appropriate.

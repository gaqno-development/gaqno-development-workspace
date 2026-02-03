# Backend

Rules, patterns, and env vars for NestJS services.

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

```
NODE_ENV=production
PORT=4008
DATABASE_URL=postgresql://user:password@host:5432/gaqno_omnichannel_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

Optional: `SEED_TENANT_ID`.

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

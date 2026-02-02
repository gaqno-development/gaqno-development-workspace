# Coolify Production Setup Plan – gaqno

**Project:** gaqno (monorepo)  
**Target:** VPS with Coolify  
**Strategy:** Docker services only (no Kubernetes)  
**Domains:** `gaqno.com` (frontend), `api.gaqno.com` (API)  
**Status:** Partially applied via Coolify MCP (Phase 1 Redis, Phase 5 env vars for sso/finance and frontends). FQDN/routing and optional Postgres alignment done in Coolify UI.

---

## Scope

- Configure Coolify to deploy the gaqno monorepo on a single VPS.
- Use Coolify’s internal Docker network and reverse proxy.
- Path-based routing on one frontend domain and one API domain.
- One PostgreSQL instance, one Redis instance.
- No Kubernetes, no Helm, no public backend or database ports.

---

## Phase 1 – Infrastructure (Database & Cache)

### 1.1 PostgreSQL

- [ ] Create a **PostgreSQL** service in Coolify.
- [ ] Image: `postgres:16-alpine`.
- [ ] Enable persistent volume.
- [ ] Do **not** expose port 5432 publicly.
- [ ] Set env (use Coolify Secrets where indicated):
  - `POSTGRES_USER=gaqno`
  - `POSTGRES_PASSWORD=<secret>`
  - `POSTGRES_DB=gaqno_sso_db` (default DB; others created by init)
- [ ] Run init so all DBs exist. Either:
  - Mount an init script that creates DBs, or
  - Run once manually after first start:
    - `gaqno_sso_db`, `gaqno_finance_db`, `gaqno_ai_db`, `gaqno_pdv_db`, `gaqno_rpg_db`, `gaqno_omnichannel_db`, `gaqno_crm_db`, `gaqno_erp_db`
- [ ] Note internal hostname (e.g. `postgres`) for connection strings.

**Connection pattern (DB_LOGIN):**  
`postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/<DATABASE_NAME>`

---

### 1.2 Redis

- [ ] Create a **Redis** service in Coolify.
- [ ] Image: e.g. `redis:7-alpine`.
- [ ] Internal only – no public port.
- [ ] Note internal hostname (e.g. `redis`).

**URL for apps:** `REDIS_URL=redis://redis:6379`

---

## Phase 2 – Backend Services (NestJS)

One Coolify application per backend; build from repo Dockerfile; no public ports; expose only via reverse proxy.

### 2.1 sso-service

- [ ] New Coolify application; build from monorepo root context, Dockerfile: `gaqno-sso-service/Dockerfile`.
- [ ] Internal port: `4001`.
- [ ] Reverse proxy: **Domain** `api.gaqno.com`, **Path** `/sso` → `sso-service:4001`.
- [ ] Environment:

| Variable                 | Value                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                        |
| `PORT`                   | `4001`                                                              |
| `DATABASE_URL`           | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_sso_db` |
| `JWT_SECRET`             | `<secret>`                                                          |
| `JWT_ACCESS_EXPIRATION`  | `15m`                                                               |
| `JWT_REFRESH_EXPIRATION` | `7d`                                                                |
| `COOKIE_DOMAIN`          | `.gaqno.com`                                                        |
| `COOKIE_SECURE`          | `true`                                                              |
| `COOKIE_SAME_SITE`       | `lax`                                                               |
| `CORS_ORIGIN`            | `https://gaqno.com`                                                 |

- [ ] Ensure service is on the same Coolify Docker network as Postgres.

---

### 2.2 finance-service

- [ ] New Coolify application; Dockerfile: `gaqno-finance-service/Dockerfile`.
- [ ] Internal port: `4005`.
- [ ] Reverse proxy: **Domain** `api.gaqno.com`, **Path** `/finance` → `finance-service:4005`.
- [ ] Environment:

| Variable       | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| `NODE_ENV`     | `production`                                                            |
| `PORT`         | `4005`                                                                  |
| `DATABASE_URL` | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_finance_db` |
| `JWT_SECRET`   | `<same as sso-service>`                                                 |
| `CORS_ORIGIN`  | `https://gaqno.com`                                                     |

- [ ] Same network as Postgres and sso-service.

---

### 2.3 (Future) Other backends

When adding: ai-service, rpg-service, pdv-service, omnichannel-service, saas-service – repeat the same pattern:

- [ ] One Coolify app per service.
- [ ] Build from respective `gaqno-*-service/Dockerfile`.
- [ ] Internal port as per service (4002, 4003, 4006, 4007, 4008).
- [ ] Proxy: `api.gaqno.com/<path>` → `<service>:<port>`.
- [ ] `DATABASE_URL` to correct DB (see COOLIFY_MCP_REPORT.md); omnichannel also needs `REDIS_URL`.
- [ ] Same `JWT_SECRET` and `CORS_ORIGIN=https://gaqno.com`.

---

## Phase 3 – Frontend Applications (Vite / React)

One Coolify application per frontend; build from repo; path-based routing on `gaqno.com`.

### 3.1 gaqno-shell

- [ ] New Coolify application; Dockerfile: `gaqno-shell/Dockerfile`.
- [ ] Internal port: **80** (Dockerfile uses nginx on 80; set Port to 80 in Coolify to avoid 502).
- [ ] Reverse proxy: **Domain** `gaqno.com`, **Path** `/` (root) → `gaqno-shell:80`.
- [ ] Build args (if Dockerfile expects them): e.g. `NPM_TOKEN` (if private deps), service URLs.
- [ ] Runtime env:

| Variable                   | Value                                                   |
| -------------------------- | ------------------------------------------------------- |
| `NODE_ENV`                 | `production`                                            |
| `PORT`                     | `80` (Coolify app Port must be 80; nginx listens on 80) |
| `VITE_SERVICE_SSO_URL`     | `https://api.gaqno.com/sso`                             |
| `VITE_SERVICE_FINANCE_URL` | `https://api.gaqno.com/finance`                         |

(Add other `VITE_SERVICE_*_URL` when those backends go live.)

- [ ] Module Federation: remoteEntry URLs must use these env vars (no localhost, no hardcoded ports).

---

### 3.2 gaqno-sso

- [ ] New Coolify application; Dockerfile: `gaqno-sso/Dockerfile`.
- [ ] Internal port: `3001`.
- [ ] Reverse proxy: **Domain** `gaqno.com`, **Path** `/sso` → `gaqno-sso:3001`.
- [ ] Runtime env:

| Variable               | Value                       |
| ---------------------- | --------------------------- |
| `NODE_ENV`             | `production`                |
| `PORT`                 | `3001`                      |
| `VITE_SERVICE_SSO_URL` | `https://api.gaqno.com/sso` |

---

### 3.3 gaqno-finance

- [ ] New Coolify application; Dockerfile: `gaqno-finance/Dockerfile`.
- [ ] Internal port: `3005`.
- [ ] Reverse proxy: **Domain** `gaqno.com`, **Path** `/finance` → `gaqno-finance:3005`.
- [ ] Runtime env:

| Variable                   | Value                           |
| -------------------------- | ------------------------------- |
| `NODE_ENV`                 | `production`                    |
| `PORT`                     | `3005`                          |
| `VITE_SERVICE_SSO_URL`     | `https://api.gaqno.com/sso`     |
| `VITE_SERVICE_FINANCE_URL` | `https://api.gaqno.com/finance` |

---

### 3.4 (Future) Other frontends

For `/ai`, `/rpg`, `/pdv`, `/omnichannel`, etc.: same pattern – one app, path `/ai` → app, env with `VITE_SERVICE_*_URL` pointing to `https://api.gaqno.com/<path>`.

---

## Phase 4 – Reverse Proxy & Routing

- [ ] Frontend domain: `gaqno.com`
  - `/` → gaqno-shell:80
  - `/sso` → gaqno-sso:3001
  - `/finance` → gaqno-finance:3005
- [ ] API domain: `api.gaqno.com`
  - `/sso` → sso-service:4001
  - `/finance` → finance-service:4005
- [ ] SSL: enable HTTPS for both domains (Coolify/Let’s Encrypt).
- [ ] Ensure no backend or DB ports are exposed publicly; only proxy ports (80/443) and Coolify management as desired.

---

## Phase 5 – Environment Variables (Complete Reference for MCP)

Values below are the full set per service (from repo `.env` / `.env.local`). Use **Coolify Secrets** for any `<placeholder>`; MCP can inject these into Coolify env config.

### 5.1 Root / shared (Coolify Secrets or global)

| Variable            | Example / placeholder | Notes                                            |
| ------------------- | --------------------- | ------------------------------------------------ |
| `POSTGRES_USER`     | `gaqno`               | Same for all DBs                                 |
| `POSTGRES_PASSWORD` | `<secret>`            | Use Coolify Secret                               |
| `JWT_SECRET`        | `<secret>`            | Same value for all backends; use Coolify Secret  |
| `NPM_TOKEN`         | `<secret>`            | Only if building frontends with private npm deps |

**Database URL pattern:**  
`postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/<DATABASE_NAME>`

---

### 5.2 sso-service (port 4001)

| Variable                 | Production value                                                    |
| ------------------------ | ------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                        |
| `PORT`                   | `4001`                                                              |
| `DATABASE_URL`           | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_sso_db` |
| `JWT_SECRET`             | `<JWT_SECRET>`                                                      |
| `JWT_ACCESS_EXPIRATION`  | `15m`                                                               |
| `JWT_REFRESH_EXPIRATION` | `7d`                                                                |
| `COOKIE_DOMAIN`          | `.gaqno.com`                                                        |
| `COOKIE_SECURE`          | `true`                                                              |
| `COOKIE_SAME_SITE`       | `lax`                                                               |
| `COOKIE_SECRET`          | `<optional_same_as_JWT_or_separate>`                                |
| `CORS_ORIGIN`            | `https://gaqno.com`                                                 |
| `SESSION_COOKIE_NAME`    | `gaqno_session`                                                     |
| `REFRESH_COOKIE_NAME`    | `gaqno_refresh`                                                     |
| `SESSION_TTL_SECONDS`    | `3600`                                                              |
| `REFRESH_TTL_SECONDS`    | `604800`                                                            |

---

### 5.3 finance-service (port 4005)

| Variable              | Production value                                                        |
| --------------------- | ----------------------------------------------------------------------- |
| `NODE_ENV`            | `production`                                                            |
| `PORT`                | `4005`                                                                  |
| `DATABASE_URL`        | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_finance_db` |
| `JWT_SECRET`          | `<JWT_SECRET>`                                                          |
| `CORS_ORIGIN`         | `https://gaqno.com`                                                     |
| `COOKIE_SECRET`       | `<optional>`                                                            |
| `SESSION_COOKIE_NAME` | `gaqno_session`                                                         |
| `REFRESH_COOKIE_NAME` | `gaqno_refresh`                                                         |
| `COOKIE_DOMAIN`       | `.gaqno.com`                                                            |
| `COOKIE_SECURE`       | `true`                                                                  |
| `COOKIE_SAME_SITE`    | `lax`                                                                   |
| `SESSION_TTL_SECONDS` | `3600`                                                                  |
| `REFRESH_TTL_SECONDS` | `604800`                                                                |

---

### 5.4 pdv-service (port 4006)

| Variable          | Production value                                                    |
| ----------------- | ------------------------------------------------------------------- |
| `NODE_ENV`        | `production`                                                        |
| `PORT`            | `4006`                                                              |
| `DATABASE_URL`    | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_pdv_db` |
| `JWT_SECRET`      | `<JWT_SECRET>`                                                      |
| `SSO_SERVICE_URL` | `http://sso-service:4001`                                           |
| `CORS_ORIGIN`     | `https://gaqno.com`                                                 |

---

### 5.5 ai-service (port 4002)

| Variable                          | Production value                                                   |
| --------------------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                        | `production`                                                       |
| `PORT`                            | `4002`                                                             |
| `DATABASE_URL`                    | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_ai_db` |
| `JWT_SECRET`                      | `<JWT_SECRET>`                                                     |
| `CORS_ORIGIN`                     | `https://gaqno.com`                                                |
| `OPENAI_BASE_URL`                 | `https://api.openai.com` or your proxy URL                         |
| `OPENAI_API_KEY`                  | `<secret>`                                                         |
| `GEMINI_API_KEY`                  | `<secret>`                                                         |
| `AI_PROVIDER`                     | `openai` or `gemini`                                               |
| `AI_MODEL`                        | e.g. `google/gemma-3-1b` or `qwen/qwen3-4b`                        |
| `ELEVENLABS_API_KEY`              | `<optional>`                                                       |
| `ELEVENLABS_VOICE_ID`             | `<optional>`                                                       |
| `ELEVENLABS_BASE_URL`             | `https://api.elevenlabs.io`                                        |
| `NEW_RELIC_AI_MONITORING_ENABLED` | `false` or `true`                                                  |
| `NEW_RELIC_APP_NAME`              | `gaqno-ai-service`                                                 |

---

### 5.6 rpg-service (port 4007)

| Variable              | Production value                                                    |
| --------------------- | ------------------------------------------------------------------- |
| `NODE_ENV`            | `production`                                                        |
| `PORT`                | `4007`                                                              |
| `DATABASE_URL`        | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_rpg_db` |
| `JWT_SECRET`          | `<JWT_SECRET>`                                                      |
| `CORS_ORIGIN`         | `https://gaqno.com`                                                 |
| `AI_SERVICE_URL`      | `http://ai-service:4002` (internal)                                 |
| `COOKIE_SECRET`       | `<optional>`                                                        |
| `SESSION_COOKIE_NAME` | `gaqno_session`                                                     |
| `REFRESH_COOKIE_NAME` | `gaqno_refresh`                                                     |
| `COOKIE_DOMAIN`       | `.gaqno.com`                                                        |
| `COOKIE_SECURE`       | `true`                                                              |
| `COOKIE_SAME_SITE`    | `lax`                                                               |
| `OPENAI_API_KEY`      | `<optional>`                                                        |
| `ELEVENLABS_BASE_URL` | `https://api.elevenlabs.io`                                         |
| `ELEVENLABS_TOKEN`    | `<optional>`                                                        |
| `ELEVENLABS_VOICE_ID` | `<optional>`                                                        |
| `GEMINI_API_KEY`      | `<optional>`                                                        |
| `AI_MODEL`            | e.g. `google/gemma-3-1b`                                            |

---

### 5.7 omnichannel-service (port 4008)

| Variable                   | Production value                                                            |
| -------------------------- | --------------------------------------------------------------------------- |
| `NODE_ENV`                 | `production`                                                                |
| `PORT`                     | `4008`                                                                      |
| `DATABASE_URL`             | `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/gaqno_omnichannel_db` |
| `REDIS_URL`                | `redis://redis:6379`                                                        |
| `JWT_SECRET`               | `<JWT_SECRET>`                                                              |
| `CORS_ORIGIN`              | `https://gaqno.com`                                                         |
| `AI_SERVICE_URL`           | `http://ai-service:4002` (internal)                                         |
| `WHATSAPP_TOKEN`           | `<secret>`                                                                  |
| `WHATSAPP_PHONE_NUMBER_ID` | `<id>`                                                                      |
| `WHATSAPP_APP_SECRET`      | `<secret>`                                                                  |
| `WHATSAPP_VERIFY_TOKEN`    | `<token for webhook verification>`                                          |
| `WHATSAPP_API_VERSION`     | `v21.0`                                                                     |
| `TELEGRAM_BOT_TOKEN`       | `<optional>`                                                                |
| `TELEGRAM_WEBHOOK_SECRET`  | `<optional>`                                                                |

---

### 5.8 saas-service (port 4003)

| Variable      | Production value    |
| ------------- | ------------------- |
| `NODE_ENV`    | `production`        |
| `PORT`        | `4003`              |
| `CORS_ORIGIN` | `https://gaqno.com` |

(No `DATABASE_URL` in current codebase.)

---

### 5.9 Frontend – gaqno-shell (port 80)

**Build-time (Dockerfile ARG / env):** Shell’s Vite federation uses these to build remoteEntry URLs; must point to **public** frontend URLs (where remotes are served), not API. Use `MFE_*_URL` (not old names like `RPG_SERVICE_URL` or `AI_SERVICE_URL`).

| Variable                       | Production value                                 |
| ------------------------------ | ------------------------------------------------ |
| `NODE_ENV`                     | `production`                                     |
| `PORT`                         | `80` (Coolify app Port = 80; nginx in container) |
| `MFE_AI_URL`                   | `https://gaqno.com/ai` (remote app URL)          |
| `MFE_CRM_URL`                  | `https://gaqno.com/crm`                          |
| `MFE_ERP_URL`                  | `https://gaqno.com/erp`                          |
| `MFE_FINANCE_URL`              | `https://gaqno.com/finance`                      |
| `MFE_PDV_URL`                  | `https://gaqno.com/pdv`                          |
| `MFE_RPG_URL`                  | `https://gaqno.com/rpg`                          |
| `MFE_SSO_URL`                  | `https://gaqno.com/sso`                          |
| `MFE_SAAS_URL`                 | `https://gaqno.com/saas`                         |
| `MFE_OMNICHANNEL_URL`          | `https://gaqno.com/omnichannel`                  |
| `VITE_SERVICE_SSO_URL`         | `https://api.gaqno.com/sso` (API base for auth)  |
| `VITE_SERVICE_AI_URL`          | `https://api.gaqno.com/ai`                       |
| `VITE_SERVICE_CRM_URL`         | `https://api.gaqno.com/crm`                      |
| `VITE_SERVICE_ERP_URL`         | `https://api.gaqno.com/erp`                      |
| `VITE_SERVICE_FINANCE_URL`     | `https://api.gaqno.com/finance`                  |
| `VITE_SERVICE_PDV_URL`         | `https://api.gaqno.com/pdv`                      |
| `VITE_SERVICE_RPG_URL`         | `https://api.gaqno.com/rpg`                      |
| `VITE_SERVICE_OMNICHANNEL_URL` | `https://api.gaqno.com/omnichannel`              |
| `NEXT_PUBLIC_IS_SUPER_APP`     | `true` (if used)                                 |
| `SERVICE_FQDN_SHELL`           | `gaqno.com`                                      |
| `SERVICE_URL_SHELL`            | `https://gaqno.com`                              |

---

### 5.10 Frontend – gaqno-sso (port 3001)

| Variable               | Production value            |
| ---------------------- | --------------------------- |
| `NODE_ENV`             | `production`                |
| `PORT`                 | `3001`                      |
| `VITE_SERVICE_SSO_URL` | `https://api.gaqno.com/sso` |

---

### 5.11 Frontend – gaqno-finance (port 3005)

| Variable                   | Production value                |
| -------------------------- | ------------------------------- |
| `NODE_ENV`                 | `production`                    |
| `PORT`                     | `3005`                          |
| `VITE_SERVICE_SSO_URL`     | `https://api.gaqno.com/sso`     |
| `VITE_SERVICE_FINANCE_URL` | `https://api.gaqno.com/finance` |

---

### 5.12 Frontend – gaqno-ai (port 3002)

| Variable               | Production value            |
| ---------------------- | --------------------------- |
| `NODE_ENV`             | `production`                |
| `PORT`                 | `3002`                      |
| `VITE_SERVICE_SSO_URL` | `https://api.gaqno.com/sso` |
| `VITE_SERVICE_AI_URL`  | `https://api.gaqno.com/ai`  |

---

### 5.13 Frontend – gaqno-crm (port 3003)

| Variable               | Production value            |
| ---------------------- | --------------------------- |
| `NODE_ENV`             | `production`                |
| `PORT`                 | `3003`                      |
| `VITE_SERVICE_SSO_URL` | `https://api.gaqno.com/sso` |

---

### 5.14 Frontend – gaqno-erp (port 3004)

| Variable               | Production value            |
| ---------------------- | --------------------------- |
| `NODE_ENV`             | `production`                |
| `PORT`                 | `3004`                      |
| `VITE_SERVICE_SSO_URL` | `https://api.gaqno.com/sso` |

---

### 5.15 Frontend – gaqno-pdv (port 3006)

| Variable               | Production value            |
| ---------------------- | --------------------------- |
| `NODE_ENV`             | `production`                |
| `PORT`                 | `3006`                      |
| `VITE_SERVICE_SSO_URL` | `https://api.gaqno.com/sso` |
| `VITE_SERVICE_PDV_URL` | `https://api.gaqno.com/pdv` |

---

### 5.16 Frontend – gaqno-rpg (port 3007)

| Variable               | Production value            |
| ---------------------- | --------------------------- |
| `NODE_ENV`             | `production`                |
| `PORT`                 | `3007`                      |
| `VITE_SERVICE_SSO_URL` | `https://api.gaqno.com/sso` |
| `VITE_SERVICE_RPG_URL` | `https://api.gaqno.com/rpg` |

---

### 5.17 Frontend – gaqno-omnichannel (port 3008)

| Variable                       | Production value                    |
| ------------------------------ | ----------------------------------- |
| `NODE_ENV`                     | `production`                        |
| `PORT`                         | `3008`                              |
| `VITE_SERVICE_SSO_URL`         | `https://api.gaqno.com/sso`         |
| `VITE_SERVICE_OMNICHANNEL_URL` | `https://api.gaqno.com/omnichannel` |

---

### 5.18 Frontend – gaqno-landing (Next.js, port 3000 in container)

| Variable                          | Production value    |
| --------------------------------- | ------------------- |
| `NODE_ENV`                        | `production`        |
| `PORT`                            | `3000`              |
| `NEXT_PUBLIC_SITE_URL`            | `https://gaqno.com` |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | `<optional>`        |

---

## Phase 6 – Secrets (Coolify Secrets)

- [ ] `POSTGRES_PASSWORD` – used in all `DATABASE_URL`.
- [ ] `JWT_SECRET` – same value for sso-service and finance-service (and future backends).
- [ ] (Optional) `NPM_TOKEN` – for builds if using private npm.
- [ ] (Optional) AI keys – when ai-service/rpg-service are added (OPENAI*API_KEY, GEMINI_API_KEY, ELEVENLABS*\*).
- [ ] (Optional) WhatsApp/Telegram – when omnichannel-service is added (WHATSAPP*\*, TELEGRAM*\*).
- [ ] Do not commit secrets to git.

---

## Phase 7 – Verification

After deployment, confirm:

- [ ] `https://gaqno.com` loads gaqno-shell.
- [ ] `https://gaqno.com/sso` loads auth UI.
- [ ] `https://gaqno.com/finance` loads finance UI.
- [ ] `https://api.gaqno.com/sso/health` (or equivalent) returns 200.
- [ ] `https://api.gaqno.com/finance/health` (or equivalent) returns 200.
- [ ] Cookies are shared across subpaths of `gaqno.com` (COOKIE_DOMAIN=.gaqno.com).
- [ ] No backend or database ports are reachable from the internet.

---

## Forbidden

- Do not use Kubernetes or Helm.
- Do not use multiple Postgres instances for this plan.
- Do not expose Postgres or Redis publicly.
- Do not use hardcoded localhost URLs in frontend env or Module Federation.

---

## Reference

- Full stack context: `docs/COOLIFY_MCP_REPORT.md`
- **Execution log (Coolify MCP, 2026-01-30):** Redis created (redis-gaqno, uuid `js8840cw0kw0cco8484occgc`). sso-service and finance-service env set to internal Postgres (`gaqno_sso_db` / `gaqno_finance_db`), `CORS_ORIGIN=https://gaqno.com`, cookie/JWT vars. Frontends (shell, gaqno-finance, and other apps) set to `VITE_SERVICE_SSO_URL` / `VITE_SERVICE_FINANCE_URL` = `https://api.gaqno.com/sso` and `/finance`; shell also `SERVICE_URL_SHELL` / `SERVICE_FQDN_SHELL` = gaqno.com. FQDN/routing (gaqno.com, api.gaqno.com) must be set in Coolify UI (MCP does not allow fqdn update). Redeploy apps after env changes.
- Original MCP prompt: section “MCP Coolify – Production Setup Prompt” (this plan is derived from it).

# Coolify Environment Variables Configuration

Complete environment variable configuration for all projects in Coolify.

**Single source of truth:** See [docs/CONFIG_REFERENCE.md](docs/CONFIG_REFERENCE.md) for ports, database names, and paths.

---

## Shared Environment Variables

### Backend Services (All)

- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret for signing JWTs (min 256-bit, required)
- `CORS_ORIGIN` - CORS allowed origins (default: `*`, can be comma-separated)

---

## Frontend Applications

### 1. gaqno-shell (Port 3000)

**Coolify:** The shell app runs on **port 3000** (Vite). The production image serves via nginx on **port 80**; in Coolify set the application **Port** to **80** so Traefik proxies to the container correctly (otherwise 502 Bad Gateway).

**Build Arguments (Coolify):**

- **MFE\_\*** = Module Federation remotes (portal). Where the browser loads `remoteEntry.js` from. Point to `https://portal.gaqno.com.br/<path>`.
- **VITE*SERVICE*\*** = API base URLs (api). Where the frontend sends HTTP requests. Point to `https://api.gaqno.com.br/<service>`.

Set all below as **Build Arguments** for gaqno-shell. If omitted, the build uses Dockerfile defaults (localhost) and production will fail loading remotes.

**MFE\_\* (remotes – portal):**

```
NODE_ENV=production
PORT=3000

MFE_AI_URL=https://portal.gaqno.com.br/ai
MFE_CRM_URL=https://portal.gaqno.com.br/crm
MFE_ERP_URL=https://portal.gaqno.com.br/erp
MFE_FINANCE_URL=https://portal.gaqno.com.br/finance
MFE_PDV_URL=https://portal.gaqno.com.br/pdv
MFE_RPG_URL=https://portal.gaqno.com.br/rpg
MFE_SSO_URL=https://portal.gaqno.com.br/auth
MFE_SAAS_URL=https://portal.gaqno.com.br/saas
MFE_OMNICHANNEL_URL=https://portal.gaqno.com.br/omnichannel
```

**VITE*SERVICE*\* (APIs – api):**

```
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
VITE_SERVICE_AI_URL=https://api.gaqno.com.br/ai
VITE_SERVICE_CRM_URL=https://api.gaqno.com.br/crm
VITE_SERVICE_ERP_URL=https://api.gaqno.com.br/erp
VITE_SERVICE_FINANCE_URL=https://api.gaqno.com.br/finance
VITE_SERVICE_PDV_URL=https://api.gaqno.com.br/pdv
VITE_SERVICE_RPG_URL=https://api.gaqno.com.br/rpg
VITE_SERVICE_OMNICHANNEL_URL=https://api.gaqno.com.br/omnichannel
```

**Optional:**

```
NPM_TOKEN=<github-pat>
NEXT_PUBLIC_IS_SUPER_APP=true
SERVICE_FQDN_SHELL=portal.gaqno.com.br
SERVICE_URL_SHELL=https://portal.gaqno.com.br
```

**Note:**

- **MFE\_\*** = remotes only; **VITE*SERVICE*\*** = API base URLs only. Redeploy (rebuild) the shell after changing any of them.

---

### 2. gaqno-sso (Port 3001)

**Runtime variables (VITE*SERVICE*\*):**

```
NODE_ENV=production
PORT=3001
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
```

---

### 3. gaqno-ai (Port 3002)

**Build Arguments (required for GitHub Packages):**

- `NPM_TOKEN` – GitHub Personal Access Token with **read:packages** scope. Required to install `@gaqno-development/frontcore` during build. In Coolify: **Build Arguments** → add `NPM_TOKEN` with your token (do not use the placeholder).

**Runtime variables (VITE*SERVICE*\*):**

```
NODE_ENV=production
PORT=3002
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
VITE_SERVICE_AI_URL=https://api.gaqno.com.br/ai
```

---

### 4. gaqno-crm (Port 3003)

**Runtime variables (VITE*SERVICE*\*):**

```
NODE_ENV=production
PORT=3003
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
```

---

### 5. gaqno-erp (Port 3004)

**Runtime variables (VITE*SERVICE*\*):**

```
NODE_ENV=production
PORT=3004
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
```

---

### 6. gaqno-finance (Port 3005)

**Runtime variables (VITE*SERVICE*\*):**

```
NODE_ENV=production
PORT=3005
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
VITE_SERVICE_FINANCE_URL=https://api.gaqno.com.br/finance
```

---

### 7. gaqno-pdv (Port 3006)

**Runtime variables (VITE*SERVICE*\*):**

```
NODE_ENV=production
PORT=3006
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
VITE_SERVICE_PDV_URL=https://api.gaqno.com.br/pdv
```

---

### 8. gaqno-rpg (Port 3007)

**Runtime variables (VITE*SERVICE*\*):**

```
NODE_ENV=production
PORT=3007
VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
VITE_SERVICE_RPG_URL=https://api.gaqno.com.br/rpg
```

---

## Backend Services

Todos os backends usam portas na faixa **4000** (4xxx): 4001, 4002, 4005, 4006, 4007. No Coolify, configure cada app com a porta correspondente.

**Important:** Each service must use its **own database**. Never use the default `postgres` database for application tables. See `docs/DATABASE_PER_SERVICE.md`.

| Service                   | Database               |
| ------------------------- | ---------------------- |
| gaqno-sso-service         | `gaqno_sso_db`         |
| gaqno-ai-service          | `gaqno_ai_db`          |
| gaqno-finance-service     | `gaqno_finance_db`     |
| gaqno-pdv-service         | `gaqno_pdv_db`         |
| gaqno-rpg-service         | `gaqno_rpg_db`         |
| gaqno-omnichannel-service | `gaqno_omnichannel_db` |

### 1. gaqno-sso-service (Port 4001)

**Gateway path:** The SSO API expects paths under `/v1/sso`. In Coolify, configure the proxy so that `api.gaqno.com.br/v1/sso` forwards to this service (Path = `/v1/sso`).

**Required:**

```
NODE_ENV=production
PORT=4001
DATABASE_URL=postgresql://user:password@host:5432/gaqno_sso_db
JWT_SECRET=your-256-bit-secret
```

**Optional:**

```
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
COOKIE_DOMAIN=.gaqno.com.br
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
COOKIE_SECRET=optional-cookie-secret
SESSION_COOKIE_NAME=gaqno_session
REFRESH_COOKIE_NAME=gaqno_refresh
SESSION_TTL_SECONDS=3600
REFRESH_TTL_SECONDS=604800
```

---

### 2. gaqno-ai-service (Port 4002)

**Required:**

```
NODE_ENV=production
PORT=4002
DATABASE_URL=postgresql://user:password@host:5432/gaqno_ai_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

**AI Provider API Keys (Optional):**

```
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
AI_PROVIDER=gemini
ELEVENLABS_TOKEN=your-elevenlabs-token
ELEVENLABS_VOICE_ID=your-voice-id
ELEVENLABS_BASE_URL=https://api.elevenlabs.io
```

**Supabase (Optional - for metrics/logging):**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**New Relic (Optional):**

```
NEW_RELIC_AI_MONITORING_ENABLED=true
NEW_RELIC_CUSTOM_INSIGHTS_EVENTS_MAX_SAMPLES_STORED=100k
NEW_RELIC_SPAN_EVENTS_MAX_SAMPLES_STORED=10k
NEW_RELIC_APP_NAME=llm_backend
```

---

### 3. gaqno-finance-service (Port 4005)

**Required:**

```
NODE_ENV=production
PORT=4005
DATABASE_URL=postgresql://user:password@host:5432/gaqno_finance_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
SSO_SERVICE_URL=https://api.gaqno.com.br/sso
```

**Seed on deploy (optional):** Set `SEED_TENANT_ID` to the UUID of `gaqno-development` tenant to seed default categories on each deploy. Get it from SSO: `SELECT id FROM sso_tenants WHERE name = 'gaqno-development'`. If unset, only schema (push-db) runs; seed is skipped. Seeds are idempotent (skip if already exists).

**Note:** Uses `FINANCE_DATABASE_URL` if set, otherwise falls back to `DATABASE_URL`.

---

### 4. gaqno-pdv-service (Port 4006)

**Required:**

```
NODE_ENV=production
PORT=4006
DATABASE_URL=postgresql://user:password@host:5432/gaqno_pdv_db
JWT_SECRET=your-256-bit-secret
SSO_SERVICE_URL=https://api.gaqno.com.br/sso
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

---

### 5. gaqno-rpg-service (Port 4007)

**Required:**

```
NODE_ENV=production
PORT=4007
DATABASE_URL=postgresql://user:password@host:5432/gaqno_rpg_db
JWT_SECRET=your-256-bit-secret
AI_SERVICE_URL=https://api.gaqno.com.br/ai
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

**MCP Integration (Optional):**

```
DND_MCP_PATH=/path/to/uv
DND_MCP_DIR=/path/to/dnd-mcp
```

---

### 6. gaqno-omnichannel-service (Port 4008)

**Required:**

```
NODE_ENV=production
PORT=4008
DATABASE_URL=postgresql://user:password@host:5432/gaqno_omnichannel_db
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

**Seed on deploy (optional):** Set `SEED_TENANT_ID` to the UUID of `gaqno-development` tenant to seed agent channels (tom, gabs) on each deploy. Get it from SSO: `SELECT id FROM sso_tenants WHERE name = 'gaqno-development'`. If unset, only schema (push-db) runs; seed is skipped. Seeds are idempotent.

---

## Seed on Deploy (Idempotent)

On each container startup, services run **push-db** (schema) and optionally **seed**:

| Service                   | Schema  | Seed                       | When seed runs                  |
| ------------------------- | ------- | -------------------------- | ------------------------------- |
| gaqno-sso-service         | push-db | tenant, permissions, user  | Always (skips if tenant exists) |
| gaqno-finance-service     | push-db | default categories         | If `SEED_TENANT_ID` is set      |
| gaqno-omnichannel-service | push-db | agent channels (tom, gabs) | If `SEED_TENANT_ID` is set      |
| gaqno-rpg-service         | push-db | default campaign + session | Always (skips if exists)        |

**First-time setup:** Deploy gaqno-sso-service first. It seeds the tenant. Get the tenant UUID from SSO DB, then add `SEED_TENANT_ID=<uuid>` to gaqno-finance-service and gaqno-omnichannel-service in Coolify. Redeploy those services.

---

## Environment Variable Prefixes

### MFE\_\* (Module Federation remotes)

- **Used in:** `vite.config.ts` (shell) – where the browser loads remoteEntry.js from
- **Points to:** Portal (e.g. `https://portal.gaqno.com.br/ai`)
- **Examples:** `MFE_AI_URL`, `MFE_CRM_URL`, `MFE_SSO_URL`

### VITE*SERVICE*\* (API base URLs)

- **Used in:** Client-side code (browser) – `import.meta.env.VITE_SERVICE_*`
- **Points to:** API (e.g. `https://api.gaqno.com.br/sso`)
- **Examples:** `VITE_SERVICE_SSO_URL`, `VITE_SERVICE_AI_URL`

### No prefix (process.env, backends)

- **Used in:** Backend services, server-side
- **Examples:** `DATABASE_URL`, `JWT_SECRET`, `AI_SERVICE_URL` (in gaqno-rpg-service, etc.)

---

## Quick Reference Table

| Application               | Type     | Port | Key Env Vars                                                   |
| ------------------------- | -------- | ---- | -------------------------------------------------------------- |
| gaqno-shell               | Frontend | 3000 | MFE*\* (build), VITE_SERVICE*\* (build); Coolify container: 80 |
| gaqno-sso                 | Frontend | 3001 | VITE_SERVICE_SSO_URL                                           |
| gaqno-ai                  | Frontend | 3002 | VITE_SERVICE_SSO_URL, VITE_SERVICE_AI_URL                      |
| gaqno-crm                 | Frontend | 3003 | VITE_SERVICE_SSO_URL                                           |
| gaqno-erp                 | Frontend | 3004 | VITE_SERVICE_SSO_URL                                           |
| gaqno-finance             | Frontend | 3005 | VITE_SERVICE_SSO_URL, VITE_SERVICE_FINANCE_URL                 |
| gaqno-pdv                 | Frontend | 3006 | VITE_SERVICE_SSO_URL                                           |
| gaqno-rpg                 | Frontend | 3007 | VITE_SERVICE_SSO_URL, VITE_SERVICE_RPG_URL                     |
| gaqno-omnichannel         | Frontend | 3010 | VITE_SERVICE_SSO_URL, VITE_SERVICE_OMNICHANNEL_URL             |
| gaqno-sso-service         | Backend  | 4001 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN (portas 4xxx)            |
| gaqno-ai-service          | Backend  | 4002 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                          |
| gaqno-finance-service     | Backend  | 4005 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL         |
| gaqno-pdv-service         | Backend  | 4006 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL         |
| gaqno-rpg-service         | Backend  | 4007 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, AI_SERVICE_URL          |
| gaqno-omnichannel-service | Backend  | 4008 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                          |

---

## Coolify Configuration Notes

### Portal path-based routing (MFE remotes – fix “page instead of .js”)

Se `https://portal.gaqno.com.br/erp/assets/remoteEntry.js` retorna **HTML** em vez de **JavaScript**, o request está indo para o **shell**. O Coolify faz o roteamento por path sozinho: basta definir o **Path** de cada aplicação no domínio **portal.gaqno.com.br**.

| Path no Coolify (por app) | Aplicação Coolify | Port (container) |
| ------------------------- | ----------------- | ---------------- |
| `/` (ou vazio)            | gaqno-shell       | 80               |
| `/erp`                    | gaqno-erp         | 3004             |
| `/ai`                     | gaqno-ai          | 3002             |
| `/crm`                    | gaqno-crm         | 3003             |
| `/finance`                | gaqno-finance     | 3005             |
| `/pdv`                    | gaqno-pdv         | 3006             |
| `/rpg`                    | gaqno-rpg         | 3007             |
| `/auth`                   | gaqno-sso         | 3001             |
| `/omnichannel`            | gaqno-omnichannel | 3010             |

- Em cada aplicação no Coolify: **Domínio** = `portal.gaqno.com.br`, **Path** = o valor da tabela (ex.: `/erp` para gaqno-erp). O Coolify/Traefik encaminha o tráfego sozinho para o container correto.
- **Remover prefixo do path:** no Coolify, ao configurar o Path do MFE, ative a opção para **remover o prefixo** ao encaminhar (ex.: request `portal.gaqno.com.br/erp/assets/remoteEntry.js` → o container recebe `/assets/remoteEntry.js`). Assim o nginx de cada MFE fica simples (root + try_files), sem blocos manuais por path.

### "Failed to fetch dynamically imported module: http://localhost:3XXX/assets/remoteEntry.js"

Se o console do navegador mostra esse erro em **https://portal.gaqno.com.br/rpg** (ou outro path de MFE), o **shell** foi buildado **sem** as variáveis `MFE_*_URL` no Coolify. O Vite injeta essas URLs no bundle em **build time**; se não forem passadas, ficam os defaults `http://localhost:3XXX` e o browser tenta carregar do localhost (e falha em produção).

**Solução:**

1. No Coolify, abra a aplicação **gaqno-shell**.
2. Em **Build Arguments** (ou variáveis de build), defina **todas** as `MFE_*_URL` com as URLs públicas do portal (ex.: `MFE_RPG_URL=https://portal.gaqno.com.br/rpg`). Use a lista da seção [gaqno-shell](#1-gaqno-shell-port-3000) acima.
3. Faça um **novo build** do shell (Redeploy com “Build without cache” se quiser garantir que não use cache antigo).
4. Após o deploy, recarregue a página do portal; o `remoteEntry.js` deve ser carregado de `https://portal.gaqno.com.br/rpg/assets/remoteEntry.js` (e não de localhost).

### Wrong env names (e.g. RPG_SERVICE_URL instead of MFE_RPG_URL)

If you used **old names** like `RPG_SERVICE_URL`, `AI_SERVICE_URL`, `CRM_SERVICE_URL`, etc. in gaqno-shell Build Arguments, the shell will **ignore** them. The shell expects `MFE_*_URL` for Module Federation remotes:

| Wrong (old)               | Correct (MFE remotes) |
| ------------------------- | --------------------- |
| `RPG_SERVICE_URL`         | `MFE_RPG_URL`         |
| `AI_SERVICE_URL`          | `MFE_AI_URL`          |
| `CRM_SERVICE_URL`         | `MFE_CRM_URL`         |
| `ERP_SERVICE_URL`         | `MFE_ERP_URL`         |
| `FINANCE_SERVICE_URL`     | `MFE_FINANCE_URL`     |
| `PDV_SERVICE_URL`         | `MFE_PDV_URL`         |
| `SSO_SERVICE_URL`         | `MFE_SSO_URL`         |
| `SAAS_SERVICE_URL`        | `MFE_SAAS_URL`        |
| `OMNICHANNEL_SERVICE_URL` | `MFE_OMNICHANNEL_URL` |

For **API base URLs** (client-side), use `VITE_SERVICE_*_URL` (e.g. `VITE_SERVICE_RPG_URL`), not `VITE_RPG_SERVICE_URL` or `VITE_SSO_SERVICE_URL`.

### Some MFEs work (AI, omnichannel) but others (RPG, CRM, ERP, etc.) return 404 or HTML

If `https://portal.gaqno.com.br/omnichannel/assets/remoteEntry.js` returns JavaScript correctly but `https://portal.gaqno.com.br/rpg/assets/remoteEntry.js` returns HTML (404 page) or fails, the shell was built with **only some** `MFE_*_URL` Build Arguments. Each MFE needs its own URL; missing ones default to localhost.

**Fix:** In Coolify → gaqno-shell → **Build Arguments**, add **all** of these (copy-paste):

```
MFE_AI_URL=https://portal.gaqno.com.br/ai
MFE_CRM_URL=https://portal.gaqno.com.br/crm
MFE_ERP_URL=https://portal.gaqno.com.br/erp
MFE_FINANCE_URL=https://portal.gaqno.com.br/finance
MFE_PDV_URL=https://portal.gaqno.com.br/pdv
MFE_RPG_URL=https://portal.gaqno.com.br/rpg
MFE_SSO_URL=https://portal.gaqno.com.br/auth
MFE_SAAS_URL=https://portal.gaqno.com.br/saas
MFE_OMNICHANNEL_URL=https://portal.gaqno.com.br/omnichannel
```

Then **rebuild** the shell (Redeploy with "Build without cache").

### 502 Bad Gateway or "Failed to fetch" on MFE remoteEntry.js (e.g. /crm/assets/remoteEntry.js)

If `https://portal.gaqno.com.br/omnichannel/assets/remoteEntry.js` returns **200 OK** but `https://portal.gaqno.com.br/crm/assets/remoteEntry.js` returns **502**, **404**, or "Failed to fetch", the proxy cannot reach the MFE container.

**Checklist:**

1. **Is the MFE deployed?** In Coolify, ensure the app (gaqno-crm, gaqno-erp, etc.) exists and is **Running**.
2. **Port:** Each MFE has a specific port. In Coolify → App → Settings → **Port**, set the value from the table above (e.g. gaqno-crm = `3003`, gaqno-rpg = `3007`, gaqno-erp = `3004`). Wrong port → 502.
3. **Path:** Set **Path** = the MFE path (e.g. `/crm`, `/rpg`) with **Strip prefix** enabled so the container receives `/assets/remoteEntry.js`.
4. **Container logs:** If the container restarts or crashes, check **Logs** for errors (e.g. build failure, missing NPM_TOKEN).
5. **Same domain:** All MFEs must be on `portal.gaqno.com.br` with different Paths.

### 500 – relation "omni_conversations" does not exist

If the omnichannel service returns 500 with `relation "omni_conversations" does not exist`, the database migrations did not run or the database is wrong.

**Fix:**

1. **Database exists:** Ensure the `gaqno_omnichannel_db` database exists in Postgres. Run `CREATE DATABASE gaqno_omnichannel_db;` if needed (see `docs/pgadmin/create-databases.sql`).
2. **DATABASE_URL:** In Coolify → gaqno-omnichannel-service → env vars, set `DATABASE_URL=postgresql://user:password@host:5432/gaqno_omnichannel_db` (must point to `gaqno_omnichannel_db`, not `gaqno_sso_db`).
3. **Redeploy:** The Dockerfile runs `push-db.js` before the app. After fixing the database, redeploy gaqno-omnichannel-service. Check **Build/Deploy logs** for any `push-db` errors.

### 500 – database "gaqno_omnichannel" does not exist (but env has gaqno_omnichannel_db)

If the error shows `gaqno_omnichannel` (without `_db`) but your `DATABASE_URL` env var correctly ends with `gaqno_omnichannel_db`:

1. **Linked Database override:** In Coolify → gaqno-omnichannel-service → Configuration, check if there is a **Linked Database** or **Database** section. If the app is linked to postgresql-gaqno, that link may inject a different `DATABASE_URL` (e.g. with `postgres` or `gaqno_omnichannel`). **Unlink** the database and rely only on your manual `DATABASE_URL` env var.
2. **Duplicate env vars:** Ensure there is only **one** `DATABASE_URL` entry. Duplicates can cause the wrong value to override.
3. **Startup log:** After redeploy, check **Logs** for `[DatabaseService] Connecting to database: <name>`. This confirms which database name the container actually receives.
4. **Force redeploy:** Redeploy with **Clear build cache** / **No cache** to ensure fresh env injection.

### "Port is already allocated"

Se o deploy falhar com **Bind for 0.0.0.0:3XXX failed: port is already allocated**, outra aplicação ou processo está usando essa porta no host. No Coolify, cada app deve usar uma **porta única** igual à do Dockerfile:

| App               | Porta (Coolify = container) |
| ----------------- | --------------------------- |
| gaqno-shell       | 80                          |
| gaqno-sso         | 3001                        |
| gaqno-ai          | 3002                        |
| gaqno-crm         | 3003                        |
| gaqno-erp         | 3004                        |
| gaqno-finance     | 3005                        |
| gaqno-pdv         | 3006                        |
| gaqno-rpg         | 3007                        |
| gaqno-omnichannel | 3008                        |

Confira se nenhum outro app está com a mesma porta; se precisar, pare o container antigo ou use outra porta no Coolify (ex.: 3004 para ERP).

### Service URLs

- **Frontend apps:** Use FQDNs (https://portal.gaqno.com.br/...) since accessed from browser
- **Backend services:** Use FQDNs (https://api.gaqno.com.br/...) for external access
- **Internal communication:** Can use service names if on same Docker network

### VITE\_ Prefix

- **Only needed for client-side variables** accessed via `import.meta.env`
- **Build-time variables** (like in vite.config.ts) use `process.env` without prefix
- **Backend services** use `process.env` without prefix

### CORS Configuration

For production, set specific domains:

```
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

### Cookie Configuration

For production with HTTPS:

```
COOKIE_DOMAIN=.gaqno.com.br
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

---

## CORS troubleshooting (portal → api)

If sign-in from `https://portal.gaqno.com.br` to `https://api.gaqno.com.br/v1/sso/sign-in` still returns a CORS error after deploy:

1. **Confirm env on the API app**  
   The app that serves `api.gaqno.com.br/v1/sso` (e.g. gaqno-sso-service) must have:

   ```
   CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br,https://gaqno.com.br
   ```

   No spaces, no quotes. Redeploy after changing.

2. **Check proxy (Coolify/Traefik)**
   - **OPTIONS preflight:** In DevTools → Network, see if the OPTIONS request to the same URL returns 200 with headers `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`. If OPTIONS returns 404/405 or no CORS headers, the proxy may not be forwarding OPTIONS to the backend — enable “Forward OPTIONS” or equivalent in the proxy config.
   - **Origin header:** Some proxies strip the `Origin` header. The backend now uses the first value in `CORS_ORIGIN` when `Origin` is missing; ensure that first value is `https://portal.gaqno.com.br`.

3. **Do not add CORS at the proxy**  
   If the proxy adds its own `Access-Control-*` headers, it can conflict with the backend. Prefer a single place (the Nest app) to set CORS.

4. **Omnichannel (teams, conversations, my) CORS errors**  
   If `https://api.gaqno.com.br/omnichannel/v1/omnichannel/teams` (or `/conversations`, `/teams/my`) returns CORS from `https://portal.gaqno.com.br`:
   - In Coolify → **gaqno-omnichannel-service** → env vars, set `CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br` (no spaces).
   - Redeploy the omnichannel service.
   - In DevTools → Network, check the **OPTIONS** preflight: it must return **200** or **204** with `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`. If OPTIONS returns 404/405, the proxy may not be forwarding OPTIONS to the omnichannel backend — ensure the path `/omnichannel` routes to gaqno-omnichannel-service for all HTTP methods.

---

## Gateway Timeout (504) on portal.gaqno.com.br

If `https://portal.gaqno.com.br/login` (or any portal route) returns **504 Gateway Timeout**, the reverse proxy (Coolify/Traefik) is not getting a response from the portal app (gaqno-shell) in time.

1. **Health check**
   - The shell image now exposes `/health`. In Coolify, set the app’s **Health Check Path** to `/health` so the proxy only sends traffic to healthy containers.
   - Test directly on the container (or via internal URL): `GET /health` should return `200 OK`.

2. **Proxy timeout**
   - Coolify/Traefik has a default backend timeout (often 60–90s). If the shell container is slow (cold start, overload), increase the proxy timeout in the Coolify proxy settings for the portal app (e.g. “Backend timeout” or equivalent).

3. **Container and logs**
   - In Coolify, confirm the **gaqno-shell** (portal) container is **Running** and not restarting.
   - Check **Logs** for nginx/Node errors. If the container exits or hangs, fix the cause (OOM, wrong port, missing env) before relying on timeout/health.

4. **Port**
   - The shell Dockerfile exposes port **80** (nginx). In Coolify, the application’s **Port** must be **80** so the proxy forwards to the correct port.

---

## Deployment stuck “In Progress” or changes not reflecting

If Coolify shows the shell deployment **In Progress** for a long time, or after a new commit the site still shows old behaviour (e.g. 502, wrong port):

1. **Set Port to 80 in Coolify**
   - Open the **gaqno-shell** application in Coolify.
   - In **General** or **Ports**, set **Port** (or “Exposed port” / “Container port”) to **80**, not 3000.
   - Save. Traefik will then forward to `container:80` where nginx listens.

2. **Force rebuild without cache**
   - Start a new deployment and enable **Build without cache** (or “No cache”) so the new Dockerfile and code are used.
   - If you only changed the Dockerfile/nginx (port 80), a cached build may still produce an image that listens on 80, but the **Coolify Port** setting is what Traefik uses; if it’s 3000, you get 502.

3. **Verify branch and commit**
   - For **Manual** deploy, confirm the correct **Branch** and that the latest commit (e.g. `70b74f3`) is the one being built.
   - If Coolify is set to a different branch, switch to `main` (or your deploy branch) and redeploy.

4. **Check build logs**
   - In the deployment view, open **Build logs** and confirm the build finishes (no failed step).
   - If it hangs, look for network timeouts, npm install failures, or OOM; fix and retry with “Build without cache”.

5. **After changing Port to 80**
   - Save the application, then **Redeploy**. The new container will listen on 80; Coolify/Traefik must be configured to use port **80** so the proxy connects to the right port.

---

## Security Notes

- Never commit `.env` files to git
- Use Coolify's secret management for sensitive values
- Rotate `JWT_SECRET` regularly
- Use strong, unique `JWT_SECRET` (min 256-bit)
- Set `COOKIE_SECURE=true` in production
- Configure `CORS_ORIGIN` to specific domains, not `*`

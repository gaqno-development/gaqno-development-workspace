# Environment

Ports, env vars, and deployment configuration.

## Ports

### Frontend (portal.gaqno.com.br)

| App               | Port | Path (Coolify)      |
| ----------------- | ---- | ------------------- |
| gaqno-shell       | 80   | /                   |
| gaqno-sso         | 3001 | /auth/assets        |
| gaqno-ai          | 3002 | /ai/assets          |
| gaqno-crm         | 3003 | /crm/assets         |
| gaqno-erp         | 3004 | /erp/assets         |
| gaqno-finance     | 3005 | /finance/assets     |
| gaqno-pdv         | 3006 | /pdv/assets         |
| gaqno-rpg         | 3007 | /rpg/assets         |
| gaqno-saas        | 3008 | /saas/assets        |
| gaqno-landing     | 3009 | (standalone)        |
| gaqno-admin       | 3010 | /admin/assets       |
| gaqno-omnichannel | 3011 | /omnichannel/assets |
| gaqno-wellness    | 3012 | /wellness/assets    |

### Backend (api.gaqno.com.br)

| App                       | Port |
| ------------------------- | ---- |
| gaqno-sso-service         | 4001 |
| gaqno-ai-service          | 4002 |
| gaqno-finance-service     | 4005 |
| gaqno-pdv-service         | 4006 |
| gaqno-rpg-service         | 4007 |
| gaqno-omnichannel-service | 4008 |

## Quick Reference

| Application               | Type     | Port | Key Env Vars                                                                                                                                                                      |
| ------------------------- | -------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gaqno-shell               | Frontend | 80   | MFE*\* (build), VITE_SERVICE*\* (build)                                                                                                                                           |
| gaqno-sso                 | Frontend | 3001 | VITE_SERVICE_SSO_URL                                                                                                                                                              |
| gaqno-ai                  | Frontend | 3002 | VITE_SERVICE_SSO_URL, VITE_SERVICE_AI_URL                                                                                                                                         |
| gaqno-crm                 | Frontend | 3003 | VITE_SERVICE_SSO_URL                                                                                                                                                              |
| gaqno-erp                 | Frontend | 3004 | VITE_SERVICE_SSO_URL                                                                                                                                                              |
| gaqno-finance             | Frontend | 3005 | VITE_SERVICE_SSO_URL, VITE_SERVICE_FINANCE_URL                                                                                                                                    |
| gaqno-pdv                 | Frontend | 3006 | VITE_SERVICE_SSO_URL, VITE_SERVICE_PDV_URL                                                                                                                                        |
| gaqno-rpg                 | Frontend | 3007 | VITE_SERVICE_SSO_URL, VITE_SERVICE_RPG_URL                                                                                                                                        |
| gaqno-saas                | Frontend | 3008 | VITE_SERVICE_SSO_URL                                                                                                                                                              |
| gaqno-admin               | Frontend | 3010 | VITE_SERVICE_SSO_URL                                                                                                                                                              |
| gaqno-omnichannel         | Frontend | 3011 | VITE_SERVICE_SSO_URL, VITE_SERVICE_OMNICHANNEL_URL                                                                                                                                |
| gaqno-wellness            | Frontend | 3012 | VITE_SERVICE_SSO_URL, VITE_SERVICE_WELLNESS_URL                                                                                                                                   |
| gaqno-sso-service         | Backend  | 4001 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                                                                                                                                             |
| gaqno-ai-service          | Backend  | 4002 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, OPENAI_API_KEY, GEMINI_API_KEY, NEXAI_API_KEY, AI_MULTIMEDIA_PROVIDER, REPLICATE_API_TOKEN, FIREWORKS_API_KEY, IMAGE_PROVIDER, IMAGE_MODEL |
| gaqno-finance-service     | Backend  | 4005 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL                                                                                                                            |
| gaqno-pdv-service         | Backend  | 4006 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL                                                                                                                            |
| gaqno-rpg-service         | Backend  | 4007 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, AI_SERVICE_URL                                                                                                                             |
| gaqno-omnichannel-service | Backend  | 4008 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                                                                                                                                             |

## Service URLs

- **Frontend:** `https://portal.gaqno.com.br/...`
- **Backend:** `https://api.gaqno.com.br/...`
- **Internal:** Service names if on same Docker network

## DATABASE_URL Format

```
postgresql://user:password@host:5432/<database_name>
```

See [database.md](./database.md) for database names per service.

## Troubleshooting: Dashboard ERR_CONNECTION_TIMED_OUT

When widgets, summary, or preferences fail with `net::ERR_CONNECTION_TIMED_OUT`, the browser cannot reach the API.

**Cause:** The shell was built with an API URL that is unreachable from the user's browser (e.g. `localhost`, `sso-service:4001`, or wrong domain).

**Fix for Coolify gaqno-shell:**

1. Open **gaqno-shell** in Coolify → **Build** / **Build Arguments**
2. Set these **Build Arguments** (baked in at build time):

   ```
   VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso
   VITE_SERVICE_AI_URL=https://api.gaqno.com.br/ai
   VITE_SERVICE_FINANCE_URL=https://api.gaqno.com.br/finance
   VITE_SERVICE_PDV_URL=https://api.gaqno.com.br/pdv
   VITE_SERVICE_RPG_URL=https://api.gaqno.com.br/rpg
   VITE_SERVICE_OMNICHANNEL_URL=https://api.gaqno.com.br/omnichannel
   VITE_SERVICE_CRM_URL=https://api.gaqno.com.br/crm
   VITE_SERVICE_ERP_URL=https://api.gaqno.com.br/erp
   ```

3. **Redeploy** gaqno-shell (rebuild required; env vars at runtime do not change these).

**Verify:** Open DevTools → Network, reload the dashboard. Check the request URL for `widgets`/`summary`/`preferences`. It should be `https://api.gaqno.com.br/sso/v1/dashboard/...`, not `http://localhost:4001/...` or an internal hostname.

## Troubleshooting: 401 Unauthorized on api.gaqno.com.br (omnichannel e outros)

**Sintoma:** Requisições autenticadas (ex.: `POST https://api.gaqno.com.br/omnichannel/v1/omnichannel/conversations/start`) retornam **401** mesmo com `Authorization: Bearer <token>` e cookie `gaqno_session` enviados pelo navegador.

**Causa:** O proxy em frente aos backends (Coolify/Traefik ou outro) não está repassando os headers `Authorization` e `Cookie` para o serviço. O Nest então não recebe o JWT e responde 401.

**Como corrigir no Coolify:**

1. **Se api.gaqno.com.br for um único app “Proxy”** que roteia por path (`/sso`, `/omnichannel`, etc.) para os backends:
   - Abra esse app Proxy no Coolify.
   - Verifique se há opção de “Forward Headers” / “Pass Headers” / “Proxy Headers” e garanta que `Authorization` e `Cookie` sejam repassados.
   - Se o proxy for Nginx ou outro, edite a config para **não** remover esses headers (ex.: em Nginx, não use `proxy_set_header Authorization ""`; o default é repassar).

2. **Se cada backend for um app separado** no Coolify (ex.: gaqno-omnichannel-service com domínio api.gaqno.com.br e path `/omnichannel`):
   - O Traefik do Coolify costuma repassar todos os headers por padrão. Confira no **Server** do Coolify se existe alguma middleware global que remova `Authorization` ou `Cookie`.
   - Em **gaqno-omnichannel-service** → **Advanced** / **Custom Labels** (se existir), não adicione nada que descarte esses headers.

3. **Alternativa (backend já suporta):** Se o proxy validar o JWT, pode enviar ao backend os headers `X-Tenant-Id` e `X-User-Id` (sub do token) em vez do Bearer; o omnichannel aceita esses headers. Isso exige configurar validação de JWT no proxy.

4. **Diagnóstico:** No Coolify, em **gaqno-omnichannel-service** → **Environment**, adicione `AUTH_DEBUG_HEADER=true` e faça redeploy. Em seguida chame de novo o endpoint que retorna 401 e inspecione o **header de resposta** `X-Auth-Debug`:
   - `no-token`: o backend não recebeu `Authorization` nem `Cookie` → o proxy (Traefik/Coolify) não está repassando; confira o item 1 ou 2 acima.
   - `token-present-no-tenant`: o token chegou mas o payload não tem `tenantId` ou o parsing falhou → confira o JWT do SSO (claim `tenantId` ou `tenant_id`).  
     Após o diagnóstico, remova `AUTH_DEBUG_HEADER` ou defina como `false`.

**Referência:** [docs/guides/backend.md § Proxy / Gateway](../guides/backend.md).

## Troubleshooting: Omnichannel CORS errors (other backends OK)

**Symptom:** `/sso/v1/*` and other backends return 200, but `/omnichannel/v1/*` fails with **CORS error** in the browser (e.g. teams, channels, conversations, templates, reports/dashboard).

**Cause:** The omnichannel backend allows origins only from env or from `*.gaqno.com` / localhost. If **CORS_ORIGIN** is not set in Coolify for **gaqno-omnichannel-service**, or the proxy does not forward the **Origin** header to that service, the backend rejects the preflight/request.

**Fix in Coolify:**

1. Open **gaqno-omnichannel-service** → **Environment**.
2. Add or set **CORS_ORIGIN** to the allowed origins (comma-separated, no spaces after commas), for example:
   ```
   CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br,https://gaqno.com.br,https://gaqno.com,https://lenin.gaqno.com.br,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
   ```
3. Ensure the reverse proxy (Traefik / Coolify) **forwards the Origin header** to this service. If Origin is stripped, the backend cannot allow the request.
4. **Redeploy** gaqno-omnichannel-service.

**Check:** After redeploy, reload the portal page that loads the omnichannel MFE and open DevTools → Network. Requests to `https://api.gaqno.com.br/omnichannel/v1/...` should return 200, not CORS errors.

## Troubleshooting: Omnichannel startup ENOENT (.cursor/debug.log)

**Symptom:** gaqno-omnichannel-service (or other backcore services) crashes on startup with `ENOENT: no such file or directory, open '.../.cursor/debug.log'`.

**Cause:** Older @gaqno-development/backcore tried to write CORS debug log to `process.cwd() + "/.cursor/debug.log"` when `CORS_DEBUG_LOG` was unset; that path does not exist in containers.

**Workaround in Coolify (until backcore is updated):** In **gaqno-omnichannel-service** → **Environment**, add:
   ```
   CORS_DEBUG_LOG=/tmp/cors-debug.log
   ```
   Then **Redeploy**. After upgrading to backcore 1.1.19+, this env var can be removed.

## Troubleshooting: AI module CORS (models endpoint)

**Symptom:** In the AI module (portal), requests to `https://api.gaqno.com.br/ai/v1/models` (or `/v1/models/registry`, `/v1/videos/models`, etc.) fail with **CORS error** in the browser; other api.gaqno.com.br endpoints (e.g. widgets, me, preferences) return 200 or 304.

**Cause:** The AI backend (gaqno-ai-service) must allow the portal origin. Backcore allows `https://portal.gaqno.com.br` and `*.gaqno.com.br` by default. If the reverse proxy in front of api.gaqno.com.br does **not forward the Origin header** to gaqno-ai-service, or answers **OPTIONS preflight** itself without CORS headers, the browser blocks the request.

**Fix in Coolify:**

1. Open **gaqno-ai-service** → **Environment**.
2. Ensure **CORS_ORIGIN** is either unset (so backcore uses regex and always-allowed origins), or includes the portal, e.g.:
   ```
   CORS_ORIGIN=https://portal.gaqno.com.br,https://portal.dev.gaqno.com.br,https://api.gaqno.com.br
   ```
3. Ensure the reverse proxy **forwards the Origin header** to gaqno-ai-service (same as for SSO/Omnichannel). OPTIONS requests must be proxied to the app so Nest can respond with CORS headers.
4. **Redeploy** gaqno-ai-service.

**Check:** Reload the AI module in the portal and open DevTools → Network. Requests to `https://api.gaqno.com.br/ai/v1/models` should return 200 with `Access-Control-Allow-Origin: https://portal.gaqno.com.br` (or the request origin) in the response headers.

## Coolify: SSO vs Omnichannel (backend) comparison

Use this to align **gaqno-omnichannel-service** with **gaqno-sso-service** in Coolify when SSO works and Omnichannel does not.

| Aspect                     | gaqno-sso-service                                                                            | gaqno-omnichannel-service                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Port**                   | 4001                                                                                         | 4008                                                                                  |
| **API path (proxy)**       | `/sso`                                                                                       | `/omnichannel`                                                                        |
| **URL strip**              | `stripSsoPrefix`: `/sso` → ``                                                                | `stripOmnichannelPrefix`: `/omnichannel` → ``                                         |
| **Global prefix**          | `v1` → `/sso/v1/*`                                                                           | `v1` → `/omnichannel/v1/*`                                                            |
| **Required env (Coolify)** | DATABASE_URL, JWT_SECRET, **CORS_ORIGIN**                                                    | DATABASE_URL, JWT_SECRET, **CORS_ORIGIN**                                             |
| **CORS**                   | Same logic: CORS_ORIGIN / ALLOWED_ORIGINS, regex `*.gaqno.com` + localhost, normalize origin | Same                                                                                  |
| **Extra env**              | COOKIE_SECRET (cookie-parser)                                                                | SSO*SERVICE_URL (internal), DEBUGGER_HEADER (optional), REDIS*_ (BullMQ), WHATSAPP\__ |
| **Middleware**             | stripSsoPrefix → cookieParser → helmet → CORS → …                                            | stripOmnichannelPrefix → requestLogger → CORS → express.json (rawBody) → …            |
| **Body parser**            | Default Nest                                                                                 | `bodyParser: false` + express.json (for rawBody)                                      |
| **WebSocket**              | No                                                                                           | Yes (OmnichannelIoAdapter)                                                            |
| **Health**                 | `/v1/health` (see [Coolify health check for SSO](#coolify-health-check-for-sso))             | `/v1/health` (HEALTHCHECK in Dockerfile)                                              |

### Coolify health check for SSO

Coolify runs the health check; you can configure it in the **application** settings (path, port, interval). The container must have **curl** or **wget** (gaqno-sso-service Dockerfile adds curl). If health check is configured in both the Coolify UI and the Dockerfile and both are enabled, the **Dockerfile takes precedence**.

**In Coolify UI (gaqno-sso-service):**

1. Open the application → **Health Check** (or **Advanced**).
2. **Path:** `/v1/health` (Coolify checks the container directly; no `/sso` prefix).
3. **Port:** `4001` (if the UI has a port field).
4. **Expected status:** `200`.
5. **Start period / grace period:** Set to **90** seconds so Coolify does not mark the container unhealthy before `push-db.js` and Nest finish starting.

Alternatively, **disable** the health check in the Coolify UI for this app and rely only on the Dockerfile `HEALTHCHECK` (image includes curl and `start-period=90s`).

**Coolify checklist for Omnichannel (match SSO):**

1. **Domain / path:** Same host as SSO (e.g. `api.gaqno.com.br`) with path **/omnichannel** (SSO uses `/sso`).
2. **Environment:** Set **CORS_ORIGIN** to the same value as on gaqno-sso-service (see [Omnichannel CORS](#troubleshooting-omnichannel-cors-errors-other-backends-ok)).
3. **Headers:** Proxy must forward **Origin**, **Authorization**, and **Cookie** (same as SSO).
4. **Port:** Container exposes **4008**; Coolify/Traefik should route `/omnichannel` to this service on 4008.

## gaqno-ai-service Model List

Text and image model lists are fetched from the [Vercel AI Gateway](https://ai-gateway.vercel.sh/v1/models) (no auth, cached 5 min). Models are filtered by configured API keys (OPENAI_API_KEY, GEMINI_API_KEY). Local/self-hosted models remain in config.

## gaqno-ai-service Multimedia provider toggle (NEX AI vs Gateway)

Multimodal capabilities (image, video, audio) can use **NEX AI** (xskill API) or **Vercel AI Gateway**–style providers. The toggle is controlled by:

- **`AI_MULTIMEDIA_PROVIDER`** — `nexai` (default) or `gateway`.

When **`nexai`** (default): if `NEXAI_API_KEY` is set, the registry and generation use NEX AI for image, video, and audio; otherwise the registry falls back to the Vercel Gateway model list for image.

When **`gateway`**: the registry uses the Vercel AI Gateway list for image (filtered by OPENAI_API_KEY, GEMINI_API_KEY); NEX AI is not offered. Video and audio generation are only available when using NEX AI, so with `gateway` they are unavailable (endpoints return a clear error). Image generation via NEX AI is disabled when `gateway` is set; gateway-backed image generation may be added in a follow-up.

## gaqno-ai-service Image Generation

Image generation supports multiple providers. Configure at least one:

| Provider        | Env Vars                                                                                                                             | Models                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| OpenAI          | `OPENAI_API_KEY`                                                                                                                     | DALL-E 2, DALL-E 3       |
| Gemini          | `GEMINI_API_KEY`                                                                                                                     | Gemini 2.5 Flash Image   |
| Replicate       | `REPLICATE_API_TOKEN`                                                                                                                | Flux Schnell, Recraft V3 |
| Fireworks       | `FIREWORKS_API_KEY`                                                                                                                  | Flux 1 Dev               |
| Vertex (Imagen) | `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_VERTEX_PROJECT`, `GOOGLE_VERTEX_LOCATION` (or `GOOGLE_APPLICATION_CREDENTIALS`) | Imagen 3.0, Imagen 4.0   |

Optional: `IMAGE_PROVIDER` (openai, gemini, replicate, fireworks), `IMAGE_MODEL` (default model id), `IMAGE_GENERATION_TIMEOUT`, `IMAGE_GENERATION_MAX_RETRIES`.

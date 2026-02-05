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
| gaqno-omnichannel | 3010 | /omnichannel/assets |

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

| Application               | Type     | Port | Key Env Vars                                                                                                                               |
| ------------------------- | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| gaqno-shell               | Frontend | 80   | MFE*\* (build), VITE_SERVICE*\* (build)                                                                                                    |
| gaqno-sso                 | Frontend | 3001 | VITE_SERVICE_SSO_URL                                                                                                                       |
| gaqno-ai                  | Frontend | 3002 | VITE_SERVICE_SSO_URL, VITE_SERVICE_AI_URL                                                                                                  |
| gaqno-crm                 | Frontend | 3003 | VITE_SERVICE_SSO_URL                                                                                                                       |
| gaqno-erp                 | Frontend | 3004 | VITE_SERVICE_SSO_URL                                                                                                                       |
| gaqno-finance             | Frontend | 3005 | VITE_SERVICE_SSO_URL, VITE_SERVICE_FINANCE_URL                                                                                             |
| gaqno-pdv                 | Frontend | 3006 | VITE_SERVICE_SSO_URL, VITE_SERVICE_PDV_URL                                                                                                 |
| gaqno-rpg                 | Frontend | 3007 | VITE_SERVICE_SSO_URL, VITE_SERVICE_RPG_URL                                                                                                 |
| gaqno-omnichannel         | Frontend | 3010 | VITE_SERVICE_SSO_URL, VITE_SERVICE_OMNICHANNEL_URL                                                                                         |
| gaqno-sso-service         | Backend  | 4001 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                                                                                                      |
| gaqno-ai-service          | Backend  | 4002 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, OPENAI_API_KEY, GEMINI_API_KEY, REPLICATE_API_TOKEN, FIREWORKS_API_KEY, IMAGE_PROVIDER, IMAGE_MODEL |
| gaqno-finance-service     | Backend  | 4005 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL                                                                                     |
| gaqno-pdv-service         | Backend  | 4006 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL                                                                                     |
| gaqno-rpg-service         | Backend  | 4007 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, AI_SERVICE_URL                                                                                      |
| gaqno-omnichannel-service | Backend  | 4008 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                                                                                                      |

## Service URLs

- **Frontend:** `https://portal.gaqno.com.br/...`
- **Backend:** `https://api.gaqno.com.br/...`
- **Internal:** Service names if on same Docker network

## DATABASE_URL Format

```
postgresql://user:password@host:5432/<database_name>
```

See [DATABASE.md](DATABASE.md) for database names per service.

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

## gaqno-ai-service Model List

Text and image model lists are fetched from the [Vercel AI Gateway](https://ai-gateway.vercel.sh/v1/models) (no auth, cached 5 min). Models are filtered by configured API keys (OPENAI_API_KEY, GEMINI_API_KEY). Local/self-hosted models remain in config.

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

# Frontend

Rules, patterns, env vars, and Vite configs for Module Federation.

## Env Prefixes

| Prefix           | Used in                | Points to                    |
| ---------------- | ---------------------- | ---------------------------- |
| `MFE_*`          | vite.config.ts (shell) | Portal (remoteEntry.js URLs) |
| `VITE_SERVICE_*` | Client code            | API base URLs                |

## Module Federation (Shell)

Shell loads MFEs via `@originjs/vite-plugin-federation`. Build-time args:

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
MFE_ADMIN_URL=https://portal.gaqno.com.br/admin
```

Defaults: `http://localhost:3XXX`. Production must override with portal URLs. In Coolify, set **MFE_ADMIN_URL** (gaqno-admin) and **MFE_SAAS_URL** the same way as MFE_AI_URL and MFE_OMNICHANNEL_URL (e.g. `https://portal.gaqno.com.br/admin`, `https://portal.gaqno.com.br/saas`) so /admin/users and saas load.

## API URLs (VITE*SERVICE*\*)

Client-side API base URLs (build-time):

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

## MFE Env Vars (per app)

Each MFE needs at least:

- `NODE_ENV=production`
- `PORT=<port>` (see [../runbooks/environment.md](../runbooks/environment.md))
- `VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso`
- `VITE_SERVICE_<MODULE>_URL` (e.g. `VITE_SERVICE_AI_URL` for gaqno-ai)

Apps using `@gaqno-development/frontcore` need `NPM_TOKEN` in Build Arguments.

## MFE Nginx Pattern

All MFEs serve assets only; document requests redirect to shell. Use `absolute_redirect off` to avoid backend port leaking into redirect URLs:

```nginx
server { ... absolute_redirect off;
  location /<path>/assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; }
  location /assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; }
  location / { return 302 /; }
}
```

Replace `<path>` with: ai, crm, erp, finance, pdv, rpg, auth (sso), omnichannel.

## Routing

- Shell (Path `/`) catches all app routes (e.g. `/rpg`, `/rpg/wiki`, `/rpg/campaigns`).
- Each MFE (Path `/<mfe>/assets`) serves static assets only (e.g. `/rpg/assets/remoteEntry.js`).

### Coolify Domain Configuration (MFEs)

**Critical:** MFE domains must use `/<mfe>/assets` so only asset requests are routed to the MFE container. App routes stay with the shell.

| MFE               | Wrong (causes redirect)                   | Correct                                          |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| gaqno-sso         | `https://portal.gaqno.com.br/auth`        | `https://portal.gaqno.com.br/auth/assets`        |
| gaqno-ai          | `https://portal.gaqno.com.br/ai`          | `https://portal.gaqno.com.br/ai/assets`          |
| gaqno-crm         | `https://portal.gaqno.com.br/crm`         | `https://portal.gaqno.com.br/crm/assets`         |
| gaqno-erp         | `https://portal.gaqno.com.br/erp`         | `https://portal.gaqno.com.br/erp/assets`         |
| gaqno-finance     | `https://portal.gaqno.com.br/finance`     | `https://portal.gaqno.com.br/finance/assets`     |
| gaqno-pdv         | `https://portal.gaqno.com.br/pdv`         | `https://portal.gaqno.com.br/pdv/assets`         |
| gaqno-rpg         | `https://portal.gaqno.com.br/rpg`         | `https://portal.gaqno.com.br/rpg/assets`         |
| gaqno-omnichannel | `https://portal.gaqno.com.br/omnichannel` | `https://portal.gaqno.com.br/omnichannel/assets` |
| gaqno-saas        | `https://portal.gaqno.com.br/saas`        | `https://portal.gaqno.com.br/saas/assets`        |
| gaqno-admin       | `https://portal.gaqno.com.br/admin`         | `https://portal.gaqno.com.br/admin/assets`        |

**Why:** With `/omnichannel`, Traefik routes ALL `/omnichannel/*` to the MFE container. The MFE nginx only serves assets; non-asset paths hit `location /` which returns `302 /`. With nginx's default `absolute_redirect on`, that becomes `http://portal.gaqno.com.br:3010/` (backend port leaks into the redirect). With `/omnichannel/assets`, only asset requests hit the MFE; routes like `/omnichannel/overview` go to the shell.

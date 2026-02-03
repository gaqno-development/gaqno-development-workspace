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
```

Defaults: `http://localhost:3XXX`. Production must override with portal URLs.

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
- `PORT=<port>` (see ENVIRONMENT.md)
- `VITE_SERVICE_SSO_URL=https://api.gaqno.com.br/sso`
- `VITE_SERVICE_<MODULE>_URL` (e.g. `VITE_SERVICE_AI_URL` for gaqno-ai)

Apps using `@gaqno-development/frontcore` need `NPM_TOKEN` in Build Arguments.

## MFE Nginx Pattern

All MFEs serve assets only; document requests redirect to shell:

```nginx
location /<path>/assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; }
location /assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; }
location / { return 302 /; }
```

Replace `<path>` with: ai, crm, erp, finance, pdv, rpg, auth (sso), omnichannel.

## Routing

- Shell (Path `/`) catches all app routes (e.g. `/rpg`, `/rpg/wiki`, `/rpg/campaigns`).
- Each MFE (Path `/<mfe>/assets`) serves static assets only (e.g. `/rpg/assets/remoteEntry.js`).

### Coolify Domain Configuration (gaqno-rpg)

**Critical:** gaqno-rpg domain must be `https://portal.gaqno.com.br/rpg/assets` (not `/rpg`).

- With `/rpg`: Traefik routes ALL `/rpg/*` to the RPG container. The RPG nginx only serves assets and redirects `/rpg/wiki` etc. to `/`—breaking the SPA.
- With `/rpg/assets`: Only `/rpg/assets/*` (e.g. `remoteEntry.js`) goes to RPG. Routes like `/rpg/wiki` go to the shell, which serves the SPA.

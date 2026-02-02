# Config Reference – Single Source of Truth

Ports, database names, and paths. Use this when configuring Coolify, docker-compose, or env vars.

## Database Names (gaqno\_\*\_db)

| Service                   | Database             |
| ------------------------- | -------------------- |
| gaqno-sso-service         | gaqno_sso_db         |
| gaqno-finance-service     | gaqno_finance_db     |
| gaqno-pdv-service         | gaqno_pdv_db         |
| gaqno-rpg-service         | gaqno_rpg_db         |
| gaqno-ai-service          | gaqno_ai_db          |
| gaqno-omnichannel-service | gaqno_omnichannel_db |

## Ports

### Frontend MFEs (portal.gaqno.com.br)

All routes through shell: shell (Path `/`) catches app routes; each MFE (Path `/<mfe>/assets`) serves only assets.

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

### Backend Services (api.gaqno.com.br)

| App                       | Port |
| ------------------------- | ---- |
| gaqno-sso-service         | 4001 |
| gaqno-ai-service          | 4002 |
| gaqno-finance-service     | 4005 |
| gaqno-pdv-service         | 4006 |
| gaqno-rpg-service         | 4007 |
| gaqno-omnichannel-service | 4008 |

## MFE Nginx Config Pattern

All MFEs serve assets only and redirect document requests to the shell dashboard (microfrontends need the shell to load first):

```nginx
location /<path>/assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; }
location /assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; }
location / { return 302 /dashboard; }
```

Replace `<path>` with: ai, crm, erp, finance, pdv, rpg, auth (sso), omnichannel.

## DATABASE_URL Format

```
postgresql://user:password@host:5432/<database_name>
```

Use the database name from the table above. **Avoid duplicate env vars** in Coolify (e.g. two `DATABASE_URL` or `PORT` entries); the wrong one may override and cause "database does not exist" or health check failures. If you see `database "gaqno_omnichannel" does not exist` but your env has `gaqno_omnichannel_db`, check for a **Linked Database** in the app config—unlink it and use only the manual `DATABASE_URL`.

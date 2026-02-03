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

| Application               | Type     | Port | Key Env Vars                                           |
| ------------------------- | -------- | ---- | ------------------------------------------------------ |
| gaqno-shell               | Frontend | 80   | MFE*\* (build), VITE_SERVICE*\* (build)                |
| gaqno-sso                 | Frontend | 3001 | VITE_SERVICE_SSO_URL                                   |
| gaqno-ai                  | Frontend | 3002 | VITE_SERVICE_SSO_URL, VITE_SERVICE_AI_URL              |
| gaqno-crm                 | Frontend | 3003 | VITE_SERVICE_SSO_URL                                   |
| gaqno-erp                 | Frontend | 3004 | VITE_SERVICE_SSO_URL                                   |
| gaqno-finance             | Frontend | 3005 | VITE_SERVICE_SSO_URL, VITE_SERVICE_FINANCE_URL         |
| gaqno-pdv                 | Frontend | 3006 | VITE_SERVICE_SSO_URL, VITE_SERVICE_PDV_URL             |
| gaqno-rpg                 | Frontend | 3007 | VITE_SERVICE_SSO_URL, VITE_SERVICE_RPG_URL             |
| gaqno-omnichannel         | Frontend | 3010 | VITE_SERVICE_SSO_URL, VITE_SERVICE_OMNICHANNEL_URL     |
| gaqno-sso-service         | Backend  | 4001 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                  |
| gaqno-ai-service          | Backend  | 4002 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                  |
| gaqno-finance-service     | Backend  | 4005 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL |
| gaqno-pdv-service         | Backend  | 4006 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL |
| gaqno-rpg-service         | Backend  | 4007 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, AI_SERVICE_URL  |
| gaqno-omnichannel-service | Backend  | 4008 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN                  |

## Service URLs

- **Frontend:** `https://portal.gaqno.com.br/...`
- **Backend:** `https://api.gaqno.com.br/...`
- **Internal:** Service names if on same Docker network

## DATABASE_URL Format

```
postgresql://user:password@host:5432/<database_name>
```

See [DATABASE.md](DATABASE.md) for database names per service.

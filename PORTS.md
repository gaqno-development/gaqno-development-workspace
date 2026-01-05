# Port Mapping - Frontend ↔ Backend

## Frontend Ports (30XX)

| Frontend | Port | Backend Service | Backend Port | Status |
|----------|------|-----------------|--------------|--------|
| **shell** | 3000 | sso-service | 4001 | ✅ |
| **sso** | 3001 | sso-service | 4001 | ✅ |
| **ai** | 3002 | ai-service | 4002 | ✅ |
| **crm** | 3003 | - | - | ⚠️ No backend |
| **erp** | 3004 | - | - | ⚠️ No backend |
| **finance** | 3005 | finance-service | 4005 | ✅ |
| **pdv** | 3006 | pdv-service | 4006 | ✅ |
| **rpg** | 3007 | rpg-service | 4007 | ✅ |

## Backend Ports (40XX)

| Backend Service | Port | Frontend(s) | Status |
|-----------------|------|-------------|--------|
| **sso-service** | 4001 | shell (3000), sso (3001) | ✅ |
| **ai-service** | 4002 | ai (3002) | ✅ |
| **finance-service** | 4005 | finance (3005) | ✅ |
| **pdv-service** | 4006 | pdv (3006) | ✅ |
| **rpg-service** | 4007 | rpg (3007) | ✅ |

## Environment Variables Mapping

### Frontend → Backend URLs

```env
# Shell
VITE_SSO_SERVICE_URL=http://localhost:4001

# SSO
VITE_SSO_SERVICE_URL=http://localhost:4001

# AI
VITE_SSO_SERVICE_URL=http://localhost:4001
VITE_AI_SERVICE_URL=http://localhost:4002

# Finance
VITE_SSO_SERVICE_URL=http://localhost:4001
VITE_FINANCE_SERVICE_URL=http://localhost:4005

# PDV
VITE_SSO_SERVICE_URL=http://localhost:4001
VITE_PDV_SERVICE_URL=http://localhost:4006

# RPG
VITE_SSO_SERVICE_URL=http://localhost:4001
VITE_RPG_SERVICE_URL=http://localhost:4007
```

## Verification

✅ All frontend ports (30XX) match correctly with backend ports (40XX)
✅ PM2 ecosystem.config.js updated with RPG services
✅ Docker-compose.yml includes all services


# Coolify Environment Variables Configuration

Complete environment variable configuration for all projects in Coolify.

---

## Shared Environment Variables

### Backend Services (All)
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret for signing JWTs (min 256-bit, required)
- `CORS_ORIGIN` - CORS allowed origins (default: `*`, can be comma-separated)

---

## Frontend Applications

### 1. gaqno-shell (Port 3000)

**Build-time variables (process.env - used in vite.config.ts):**
```
NODE_ENV=production
PORT=3000
AI_SERVICE_URL=https://portal.gaqno.com.br/ai
CRM_SERVICE_URL=https://portal.gaqno.com.br/crm
ERP_SERVICE_URL=https://portal.gaqno.com.br/erp
FINANCE_SERVICE_URL=https://portal.gaqno.com.br/finance
PDV_SERVICE_URL=https://portal.gaqno.com.br/pdv
RPG_SERVICE_URL=https://portal.gaqno.com.br/rpg
SSO_SERVICE_URL=https://portal.gaqno.com.br/auth
```

**Runtime variables (VITE_ prefix - used in browser):**
```
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
```

**Optional:**
```
NEXT_PUBLIC_IS_SUPER_APP=true
SERVICE_FQDN_SHELL=portal.gaqno.com.br
SERVICE_URL_SHELL=https://portal.gaqno.com.br
```

**Note:** 
- Build-time variables are used for module federation remotes
- `VITE_SSO_SERVICE_URL` points to backend API (sso-service)
- Other service URLs are for routing to micro-frontends

---

### 2. gaqno-sso (Port 3001)

**Runtime variables (VITE_ prefix):**
```
NODE_ENV=production
PORT=3001
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
```

---

### 3. gaqno-ai (Port 3002)

**Runtime variables (VITE_ prefix):**
```
NODE_ENV=production
PORT=3002
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
VITE_AI_SERVICE_URL=https://api.gaqno.com.br/ai
```

**Note:** Previously used Supabase edge functions, but no longer needed.

---

### 4. gaqno-crm (Port 3003)

**Runtime variables (VITE_ prefix):**
```
NODE_ENV=production
PORT=3003
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
```

---

### 5. gaqno-erp (Port 3004)

**Runtime variables (VITE_ prefix):**
```
NODE_ENV=production
PORT=3004
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
```

---

### 6. gaqno-finance (Port 3005)

**Runtime variables (VITE_ prefix):**
```
NODE_ENV=production
PORT=3005
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
VITE_FINANCE_SERVICE_URL=https://api.gaqno.com.br/finance
```

---

### 7. gaqno-pdv (Port 3006)

**Runtime variables (VITE_ prefix):**
```
NODE_ENV=production
PORT=3006
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
VITE_PDV_SERVICE_URL=https://api.gaqno.com.br/pdv
```

---

### 8. gaqno-rpg (Port 3007)

**Runtime variables (VITE_ prefix):**
```
NODE_ENV=production
PORT=3007
VITE_SSO_SERVICE_URL=https://api.gaqno.com.br/auth
VITE_RPG_SERVICE_URL=https://api.gaqno.com.br/rpg
```

---

## Backend Services

### 1. gaqno-sso-service (Port 4001)

**Required:**
```
NODE_ENV=production
PORT=4001
DATABASE_URL=postgresql://user:password@host:5432/database
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
DATABASE_URL=postgresql://user:password@host:5432/database
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
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-256-bit-secret
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
SSO_SERVICE_URL=https://api.gaqno.com.br/auth
```

**Note:** Uses `FINANCE_DATABASE_URL` if set, otherwise falls back to `DATABASE_URL`.

---

### 4. gaqno-pdv-service (Port 4006)

**Required:**
```
NODE_ENV=production
PORT=4006
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-256-bit-secret
SSO_SERVICE_URL=https://api.gaqno.com.br/auth
CORS_ORIGIN=https://portal.gaqno.com.br,https://api.gaqno.com.br
```

---

### 5. gaqno-rpg-service (Port 4007)

**Required:**
```
NODE_ENV=production
PORT=4007
DATABASE_URL=postgresql://user:password@host:5432/database
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

## Environment Variable Prefixes

### VITE_ Prefix
- **Required for:** Client-side code (browser)
- **Used in:** `import.meta.env.VITE_*`
- **When:** Runtime in browser
- **Examples:** `VITE_SSO_SERVICE_URL`, `VITE_AI_SERVICE_URL`

### No Prefix (process.env)
- **Required for:** Build-time and server-side code
- **Used in:** `process.env.*` or `vite.config.ts`
- **When:** Build time or server-side rendering
- **Examples:** `DATABASE_URL`, `JWT_SECRET`, `AI_SERVICE_URL` (in vite.config.ts)

---

## Quick Reference Table

| Application | Type | Port | Key Env Vars |
|------------|------|------|--------------|
| gaqno-shell | Frontend | 3000 | VITE_SSO_SERVICE_URL, AI_SERVICE_URL (build), CRM_SERVICE_URL (build), etc. |
| gaqno-sso | Frontend | 3001 | VITE_SSO_SERVICE_URL |
| gaqno-ai | Frontend | 3002 | VITE_SSO_SERVICE_URL, VITE_AI_SERVICE_URL |
| gaqno-crm | Frontend | 3003 | VITE_SSO_SERVICE_URL |
| gaqno-erp | Frontend | 3004 | VITE_SSO_SERVICE_URL |
| gaqno-finance | Frontend | 3005 | VITE_SSO_SERVICE_URL, VITE_FINANCE_SERVICE_URL |
| gaqno-pdv | Frontend | 3006 | VITE_SSO_SERVICE_URL, VITE_PDV_SERVICE_URL |
| gaqno-rpg | Frontend | 3007 | VITE_SSO_SERVICE_URL, VITE_RPG_SERVICE_URL |
| gaqno-sso-service | Backend | 4001 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN |
| gaqno-ai-service | Backend | 4002 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN |
| gaqno-finance-service | Backend | 4005 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL |
| gaqno-pdv-service | Backend | 4006 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, SSO_SERVICE_URL |
| gaqno-rpg-service | Backend | 4007 | DATABASE_URL, JWT_SECRET, CORS_ORIGIN, AI_SERVICE_URL |

---

## Coolify Configuration Notes

### Service URLs
- **Frontend apps:** Use FQDNs (https://portal.gaqno.com.br/...) since accessed from browser
- **Backend services:** Use FQDNs (https://api.gaqno.com.br/...) for external access
- **Internal communication:** Can use service names if on same Docker network

### VITE_ Prefix
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

## Security Notes

- Never commit `.env` files to git
- Use Coolify's secret management for sensitive values
- Rotate `JWT_SECRET` regularly
- Use strong, unique `JWT_SECRET` (min 256-bit)
- Set `COOKIE_SECURE=true` in production
- Configure `CORS_ORIGIN` to specific domains, not `*`

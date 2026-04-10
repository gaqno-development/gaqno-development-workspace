# Environment Variables Reference

All environment variables required by each project in the gaqno workspace.

---

## Workspace Root (`.env`)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `3000` |
| `SERVICE_FQDN_SHELL` | `localhost` |
| `SERVICE_URL_SHELL` | `http://localhost:3000` |
| `NEXT_PUBLIC_IS_SUPER_APP` | `true` |
| `VITE_APP_ORIGIN` | `http://localhost:3000` |
| `MFE_SSO_URL` | `http://localhost:3001` |
| `MFE_AI_URL` | `http://localhost:3002` |
| `MFE_CRM_URL` | `http://localhost:3003` |
| `MFE_FINANCE_URL` | `http://localhost:3005` |
| `MFE_PDV_URL` | `http://localhost:3006` |
| `MFE_RPG_URL` | `http://localhost:3007` |
| `MFE_ADMIN_URL` | `http://localhost:3010` |
| `MFE_ERP_URL` | `http://localhost:3004/erp` |
| `MFE_OMNICHANNEL_URL` | `http://localhost:3011/omnichannel` |
| `MFE_WELLNESS_URL` | `http://localhost:3012/wellness` |
| `ADMIN_SERVICE_URL` | `http://localhost:3010` |
| `AUTH_SERVICE_URL` | `http://localhost:4001` |
| `VITE_SERVICE_SSO_URL` | `http://localhost:4001` |
| `VITE_SERVICE_AI_URL` | `http://localhost:4002` |
| `VITE_SERVICE_CRM_URL` | `http://localhost:4003` |
| `VITE_SERVICE_ERP_URL` | `http://localhost:4004` |
| `VITE_SERVICE_FINANCE_URL` | `http://localhost:4005` |
| `VITE_SERVICE_PDV_URL` | `http://localhost:4006` |
| `VITE_SERVICE_RPG_URL` | `http://localhost:4007` |
| `VITE_SERVICE_OMNICHANNEL_URL` | `http://localhost:4008` |
| `VITE_SERVICE_WELLNESS_URL` | `http://localhost:4011` |
| `VITE_SERVICE_ADMIN_URL` | `http://localhost:4010` |
| `REDIS_URL` | `redis://localhost:6379` |
| `NPM_TOKEN` | *(GitHub PAT)* |
| `DOKPLOY_BASE_URL` | `http://<host>:3000/api` |
| `DOKPLOY_API_KEY` | *(secret)* |
| `R2_ACCESS_KEY_ID` | *(secret)* |
| `R2_SECRET_ACCESS_KEY` | *(secret)* |
| `R2_TOKEN` | *(secret)* |
| `SSH_KEY` | *(secret)* |

---

## Production (`.env.production.example`)

| Variable | Example / Default |
|----------|-------------------|
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | *(secret)* |
| `JWT_SECRET` | *(secret, 64 chars)* |
| `COOKIE_SECRET` | *(secret, 32 chars)* |
| `JWT_ACCESS_EXPIRATION` | `15m` |
| `JWT_REFRESH_EXPIRATION` | `7d` |
| `COOKIE_DOMAIN` | `.gaqno.com.br` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAME_SITE` | `lax` |
| `CORS_ORIGIN` | `https://portal.gaqno.com.br` |
| `N8N_WEBHOOK_URL` | `https://n8n.gaqno.com.br` |
| `OMNICHANNEL_API_BASE_URL` | `https://api.gaqno.com.br/omnichannel/v1` |
| `SSO_TENANT_BY_HOST_URL` | `https://api.gaqno.com.br/sso/v1/public/tenant-by-host` |
| `VITE_APP_ORIGIN` | `https://portal.gaqno.com.br` |
| `NPM_TOKEN` | *(GitHub PAT)* |
| `CLOUDFLARE_TUNNEL_TOKEN` | *(secret)* |
| `CLOUDFLARE_API_TOKEN` | *(secret)* |
| `CLOUDFLARE_ZONE_ID` | *(zone id)* |
| `CLOUDFLARED_EDGE_NETWORK` | `dokploy-network` |
| `ADMIN_SERVICE_URL` | `http://admin-service:4010` |
| `AI_SERVICE_URL` | `http://ai-service:4002` |
| `GRAFANA_ADMIN_PASSWORD` | *(secret)* |
| `GRAFANA_ROOT_URL` | `https://grafana.gaqno.com.br` |
| `VITE_GRAFANA_URL` | `https://grafana.gaqno.com.br` |
| `VITE_GRAFANA_API_KEY` | *(secret)* |
| `POSTGRES_EXPORTER_URI` | `postgres:5432/gaqno_sso_db?sslmode=disable` |
| `POSTGRES_EXPORTER_USER` | `postgres` |
| `POSTGRES_EXPORTER_PASS` | *(secret)* |
| `WHATSAPP_VERIFY_TOKEN` | *(secret)* |
| `WHATSAPP_APP_SECRET` | *(secret)* |
| `META_ACCESS_TOKEN` | *(secret)* |
| `OPENAI_API_KEY` | *(secret)* |
| `NEW_RELIC_APP_NAME` | *(string)* |
| `NEW_RELIC_LICENSE_KEY` | *(secret)* |
| `PIPEDRIVE_CLIENT_ID` | *(secret)* |
| `PIPEDRIVE_CLIENT_SECRET` | *(secret)* |
| `SEED_TENANT_ID` | *(uuid)* |
| `FINANCE_SYSTEM_USER_ID` | *(uuid)* |

---

## AI Platform (`.env.ai-platform.example`)

| Variable | Service | Example / Default |
|----------|---------|-------------------|
| `PORT` | API Gateway | `3000` |
| `COMMAND_SERVICE_URL` | API Gateway | `http://localhost:3001` |
| `PORT` | Command Service | `3001` |
| `DATABASE_URL` | Command Service | `postgres://...` |
| `MASTER_KEY` | Command Service | *(secret, 32+ bytes)* |
| `REDIS_URL` | Command Service | `redis://localhost:6379` |
| `PORT` | AI Processor | `3002` |
| `MASTER_KEY` | AI Processor | *(secret)* |
| `REDIS_URL` | AI Processor | `redis://localhost:6379` |
| `XSKILL_BASE_URL` | AI Processor | `https://api.xskill.ai` |
| `XSKILL_API_KEY` | AI Processor | *(secret)* |
| `PORT` | Projection Service | `3003` |
| `DATABASE_URL` | Projection Service | `postgres://...` |
| `MASTER_KEY` | Projection Service | *(secret)* |
| `REDIS_URL` | Projection Service | `redis://localhost:6379` |

---

## gaqno-sso-service (port 4001)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4001` |
| `DATABASE_URL` | `postgres://...gaqno_sso_db` |
| `JWT_SECRET` | *(secret)* |
| `JWT_EXPIRATION` | `15m` |
| `JWT_REFRESH_EXPIRATION` | `7d` |
| `COOKIE_SECRET` | *(secret)* |
| `SESSION_COOKIE_NAME` | `gaqno_session` |
| `REFRESH_COOKIE_NAME` | `gaqno_refresh` |
| `COOKIE_DOMAIN` | `localhost` |
| `COOKIE_SECURE` | `false` |
| `COOKIE_SAME_SITE` | `lax` |
| `SESSION_TTL_SECONDS` | `3600` |
| `REFRESH_TTL_SECONDS` | `604800` |
| `CORS_ORIGIN` | `*` |
| `ADMIN_SERVICE_URL` | `http://localhost:4010` |
| `AI_SERVICE_URL` | `http://localhost:4002` |
| `CRM_SERVICE_URL` | `http://localhost:4003` |
| `FINANCE_SERVICE_URL` | `http://localhost:4005` |
| `PDV_SERVICE_URL` | `http://localhost:4006` |
| `ERP_SERVICE_URL` | `http://localhost:4004` |

---

## gaqno-ai-service (port 4002)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4002` |
| `DATABASE_URL` | `postgresql://...gaqno_ai_db` |
| `JWT_SECRET` | *(secret)* |
| `CORS_ORIGIN` | `*` |
| `PDV_SERVICE_URL` | `http://localhost:4006` |
| `PDV_INTERNAL_API_KEY` | *(secret)* |
| `OMNICHANNEL_SERVICE_URL` | `http://localhost:4008` |
| `ATTRIBUTION_CONFIDENCE_BASE` | `0.5` |
| `ATTRIBUTION_CONFIDENCE_TRANSACTION_FACTOR` | `0.5` |
| `ATTRIBUTION_CONFIDENCE_CAP` | `1` |
| `ATTRIBUTION_REPORT_CACHE_TTL_SECONDS` | `0` |
| `BILLING_FEE_RATE_PERCENT` | `1` |
| `BILLING_CURRENCY` | `BRL` |
| `BILLING_SUMMARY_CACHE_TTL_SECONDS` | `0` |
| `AI_GATEWAY_API_KEY` | *(secret)* |
| `NEXAI_API_KEY` | *(secret)* |
| `NEXAI_FAL_TOKEN` | *(secret)* |
| `TIKTOK_CLIENT_KEY` | *(secret)* |
| `TIKTOK_CLIENT_SECRET` | *(secret)* |
| `R2_ACCESS_KEY` | *(secret)* |
| `R2_SECRET_KEY` | *(secret)* |
| `R2_TOKEN` | *(secret)* |
| `R2_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | `gaqno-media` |
| `R2_ACCOUNT_ID` | *(id)* |
| `R2_PUBLIC_URL` | `https://media.gaqno.com.br` |

---

## gaqno-crm-service (port 4003)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4003` |
| `DATABASE_URL` | `postgres://...gaqno_crm_db` |
| `CORS_ORIGIN` | `*` |

---

## gaqno-erp-service (port 4004)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4004` |
| `DATABASE_URL` | `postgres://...gaqno_erp_db` |
| `CORS_ORIGIN` | `*` |

---

## gaqno-finance-service (port 4005)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4005` |
| `DATABASE_URL` | `postgresql://...gaqno_finance_db` |
| `TEST_DATABASE_URL` | `postgres://...` |
| `JWT_SECRET` | *(secret)* |
| `COOKIE_SECRET` | *(secret)* |
| `SESSION_COOKIE_NAME` | `gaqno_session` |
| `REFRESH_COOKIE_NAME` | `gaqno_refresh` |
| `COOKIE_DOMAIN` | `localhost` |
| `COOKIE_SECURE` | `false` |
| `COOKIE_SAME_SITE` | `lax` |
| `SESSION_TTL_SECONDS` | `3600` |
| `REFRESH_TTL_SECONDS` | `604800` |
| `CORS_ORIGIN` | `*` |
| `FINANCE_SYSTEM_USER_ID` | *(uuid)* |

---

## gaqno-pdv-service (port 4006)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4006` |
| `DATABASE_URL` | `postgres://...gaqno_pdv_db` |
| `COOKIE_SECRET` | *(secret)* |
| `CORS_ORIGIN` | `*` |
| `SSO_INTROSPECTION_URL` | `http://localhost:4001` |

---

## gaqno-rpg-service (port 4007)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4007` |
| `DATABASE_URL` | `postgres://...gaqno_rpg_db` |
| `JWT_SECRET` | *(secret)* |
| `COOKIE_SECRET` | *(secret)* |
| `SESSION_COOKIE_NAME` | `gaqno_session` |
| `REFRESH_COOKIE_NAME` | `gaqno_refresh` |
| `COOKIE_DOMAIN` | `localhost` |
| `COOKIE_SECURE` | `false` |
| `COOKIE_SAME_SITE` | `lax` |
| `SESSION_TTL_SECONDS` | `3600` |
| `REFRESH_TTL_SECONDS` | `604800` |
| `CORS_ORIGIN` | `*` |
| `OPENAI_API_KEY` | *(secret)* |
| `ELEVENLABS_BASE_URL` | `https://api.elevenlabs.io` |
| `ELEVENLABS_TOKEN` | *(secret)* |
| `ELEVENLABS_VOICE_ID` | *(id)* |
| `GEMINI_API_KEY` | *(secret)* |
| `AI_MODEL` | `google/gemma-3-1b` |

---

## gaqno-omnichannel-service (port 4008)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4008` |
| `DATABASE_URL` | `postgres://...gaqno_omnichannel_db` |
| `CORS_ORIGIN` | `*` |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | *(secret)* |
| `AI_SERVICE_URL` | `http://localhost:4002` |

---

## gaqno-admin-service (port 4010)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4010` |
| `CORS_ORIGIN` | `*` |

---

## gaqno-wellness-service (port 4011)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4011` |
| `DATABASE_URL` | `postgres://...gaqno_wellness_db` |
| `CORS_ORIGIN` | `*` |
| `AI_SERVICE_URL` | `http://localhost:4002` |

---

## gaqno-lead-enrichment-service (port 4012)

| Variable | Example / Default |
|----------|-------------------|
| `NODE_ENV` | `development` |
| `PORT` | `4012` |
| `DATABASE_URL` | `postgres://...gaqno_lead_enrichment` |
| `CORS_ORIGIN` | `*` |

---

## gaqno-dropshipping (Next.js storefront, port 3014)

| Variable | Example / Default |
|----------|-------------------|
| `DROPSHIPPING_SERVICE_URL` | `http://localhost:4016` |
| `NEXT_PUBLIC_TENANT_NAME` | `Gaqno Shop` |
| `NEXT_PUBLIC_TENANT_TAGLINE` | `Seu destino de compras` |
| `TENANT_DESCRIPTION` | `Loja virtual` |
| `TENANT_PRIMARY_COLOR` | `#3b82f6` |
| `TENANT_SECONDARY_COLOR` | `#6366f1` |
| `TENANT_BG_COLOR` | `#ffffff` |
| `FEATURE_PIX` | `true` |
| `FEATURE_CHECKOUT_PRO` | `true` |
| `AUTH_SECRET` | *(secret)* |
| `AUTH_GOOGLE_ID` | *(OAuth)* |
| `AUTH_GOOGLE_SECRET` | *(OAuth)* |
| `AUTH_FACEBOOK_ID` | *(OAuth)* |
| `AUTH_FACEBOOK_SECRET` | *(OAuth)* |
| `AUTH_APPLE_ID` | *(OAuth)* |
| `AUTH_APPLE_SECRET` | *(OAuth)* |

---

## gaqno-dropshipping-service (port 4016)

| Variable | Example / Default |
|----------|-------------------|
| `DATABASE_URL` | `postgresql://...gaqno_dropshipping` |
| `REDIS_URL` | `redis://localhost:6379` |
| `PORT` | `4016` |
| `JWT_SECRET` | *(secret)* |
| `CORS_ORIGIN` | `http://localhost:3014` |
| `ALIEXPRESS_APP_KEY` | *(secret)* |
| `ALIEXPRESS_APP_SECRET` | *(secret)* |
| `ALIEXPRESS_ACCESS_TOKEN` | *(secret)* |
| `ALIEXPRESS_API_URL` | `https://api-sg.aliexpress.com/sync` |
| `SHOPEE_PARTNER_ID` | *(secret)* |
| `SHOPEE_PARTNER_KEY` | *(secret)* |
| `SHOPEE_SHOP_ID` | *(secret)* |
| `SHOPEE_ACCESS_TOKEN` | *(secret)* |
| `SHOPEE_REFRESH_TOKEN` | *(secret)* |
| `SHOPEE_API_URL` | `https://partner.shopeemobile.com` |
| `MERCADO_PAGO_ACCESS_TOKEN` | *(secret)* |
| `MERCADO_PAGO_WEBHOOK_SECRET` | *(secret)* |
| `MERCADO_PAGO_NOTIFICATION_URL` | *(url)* |
| `STOREFRONT_BASE_URL` | `http://localhost:3014` |
| `TENANT_NAME` | `Gaqno Shop` |
| `SSO_INTROSPECTION_URL` | `http://localhost:4001` |
| `EXCHANGE_RATE_USD_BRL` | `5.50` |
| `SHOPEE_FEE_PERCENT` | `40` |
| `PROFIT_MARGIN_PERCENT` | `50` |

---

## gaqno-sherlock-service (port 4016)

| Variable | Example / Default |
|----------|-------------------|
| `PORT` | `4016` |
| `JWT_SECRET` | *(secret)* |
| `DATAJUD_API_KEY` | *(secret)* |
| `CORS_ORIGIN` | `*` |
| `TRANSPARENCIA_API_KEY` | *(secret)* |
| `CONECTA_CLIENT_ID` | *(secret)* |
| `CONECTA_CLIENT_SECRET` | *(secret)* |
| `CONECTA_ENV` | `production` |
| `CADSUS_SYSTEM_CODE` | *(secret)* |
| `EHR_AUTH_URL` | *(url)* |

---

## gaqno-landing-ui (Next.js, port 3009)

| Variable | Example / Default |
|----------|-------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://gaqno.com.br` |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | *(string)* |

---

## dokploy-mcp

| Variable | Example / Default |
|----------|-------------------|
| `DOKPLOY_API_KEY` | *(secret)* |
| `DOKPLOY_BASE_URL` | `http://localhost:3000/api` |
| `MCP_TRANSPORT` | `stdio` |
| `MCP_HTTP_PORT` | `3001` |
| `MCP_HTTP_AUTH_TOKEN` | *(secret)* |
| `LOG_LEVEL` | `info` |

# Coverage Gaps Plan — Min 80% Everywhere

Threshold: **80%** for statements, branches, functions, and lines. No file exclusions; add tests for all.

## Summary

| Project | Stmts | Branch | Funcs | Lines | Tests | Status |
|---------|-------|--------|-------|-------|-------|--------|
| **gaqno-erp-service** | 95 | 96.42 | 80 | 96.85 | 54 | ✅ Passes 80% |
| **gaqno-crm-service** | 98.08 | 93.10 | 91.39 | 98.59 | 151 | ✅ Passes 80% |
| **gaqno-sso-service** | 86.07 | 80.09 | 82.94 | 87.89 | 489 | ✅ Passes 80% |
| **gaqno-finance-service** | 82.39 | 80.59 | 85.18 | 83.67 | 107 | ✅ Passes 80% |
| **gaqno-lead-enrichment-service** | 98.18 | 85.71 | 93.33 | 98.01 | 18 | ✅ Passes 80% |
| **gaqno-ai-service** | 94.91 | 80.30 | 94.38 | 95.06 | 340 | ✅ Passes 80% |
| **gaqno-pdv-service** | 95.51 | 80.67 | 97.33 | 99.49 | 100 | ✅ Passes 80% |
| **gaqno-rpg-service** | 75.78 | 59.68 | 75.73 | 76.02 | 789 | ⬆️ 29→76%; complex AI/WS/D&D logic |
| **gaqno-omnichannel-service** | 79.65 | 57.91 | 65.62 | 80.59 | 469 | ⬆️ 42→80% lines; branch coverage WIP |

**7 of 9 backend services pass 80% on all metrics.** The remaining 2 (RPG, Omnichannel) have complex AI, WebSocket, and messaging integrations that need more unit tests.

---

## Services Passing 80% (7/9)

### gaqno-erp-service ✅
95/96.42/80/96.85. 54 tests. Tests for: health, http-exception.filter, db.service (init/destroy), schema (exports + getSchemaTableNames), products.dto (validation).

### gaqno-crm-service ✅
98.08/93.10/91.39/98.59. 151 tests. Tests for: contacts (controller+service), deals (controller+service), leads (controller+service), interactions (controller+service+sync), customer-context (controller+service), health, kafka module, db.service, schema, http-exception.filter.

### gaqno-sso-service ✅
86.07/80.09/82.94/87.89. 489 tests. Tests for: auth (controller+service+guard+pipe), users (controller+service), tenants (controller+service+saas-integration), branches (controller+service), permissions (controller+service+guard+feature-flags+abac), dashboard (controller+service+overview+activity), domains (controller+service+ssl-checker), menu (controller+service+crud), metrics (controller+service+interceptor), orgs (controller+service), whitelabel (controller+service), health, audit (controller+service), db.service, jwt, common (logger+filter).

### gaqno-finance-service ✅
82.39/80.59/85.18/83.67. 107 tests. Tests for: transactions (controller+service), categories (controller+service), subcategories (controller+service), credit-cards (controller+service), dashboard (controller+service), db.service, http-exception.filter.

### gaqno-lead-enrichment-service ✅
98.18/85.71/93.33/98.01. 18 tests. Tests for: enrichment-consumer, pipedrive-api.service, db.service, health.

### gaqno-ai-service ✅
94.91/80.30/94.38/95.06. 340 tests. Tests for: health, metrics, models, tenant-config, guards, attribution, nexai, AI controllers, utilities, exceptions.

### gaqno-pdv-service ✅
95.51/80.67/97.33/99.49. 100 tests. Tests for: sales (controller+service), products (controller+service), customers (controller+service), dashboard (controller+service), internal, auth guard, db.service, health, app.module.

---

## Services Needing More Work (2/9)

### gaqno-rpg-service — 75.78/59.68/75.73/76.02 (789 tests)
Started at 29%. Massive AI-powered RPG platform with WebSocket handlers, D&D mechanics, narration AI, campaign management.

**Remaining gaps:**
- `websocket.gateway.ts` (~50%) — complex event handling
- `campaigns.service.ts` (~60%) — streaming AI responses
- `dnd5e*.service.ts` files (~23-60%) — D&D API integration
- Narrator services — AI prompt building, response parsing

### gaqno-omnichannel-service — 79.65/57.91/65.62/80.59 (469 tests)
Started at 42%. Multi-channel messaging (WhatsApp, Telegram) with routing, distribution, AI classification.

**Remaining gaps:**
- `templates.service.ts` (~40% branch) — WhatsApp template building
- `whatsapp.service.ts` (~40% branch) — media handling, webhooks
- `messages.service.ts` (~52% branch) — AI reply, agent routing
- `conversations.service.ts` — deep branching logic
- `routing.service.ts` — rule matching

---

## Validation

Run `npm run test:cov` (or `test:coverage`) in each service. 7 services pass 80% thresholds. RPG and Omnichannel need continued test development.

**Total tests added across all services: ~2000+**

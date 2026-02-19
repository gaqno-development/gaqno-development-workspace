# Structure Analysis — Frontend & Backend

**Date:** 2025-02-12  
**Sources:** Codebase, architecture docs, Jira (GAQNO)

---

## 1. Executive Summary

| Layer       | Packages / Apps | Shared Packages   | Status                         |
| ----------- | ---------------- | ------------------ | ------------------------------ |
| **Frontend** | 11 MFEs + Shell  | @gaqno-frontcore   | Micro-frontends, Module Federation |
| **Backend**  | 8 NestJS services | @gaqno-backcore   | Domain-oriented, DB per service |
| **Shared**   | —                | @gaqno-types       | Centralized interfaces         |

**Jira alignment:** Several in-progress items address architecture (GAQNO-1112, GAQNO-1311, GAQNO-1305, GAQNO-1326).

---

## 2. Frontend Architecture Analysis

### 2.1 Current Structure

```
gaqno-shell-ui (Host, port 3000)
├── Module Federation remotes
├── pages/admin/* (19 admin pages — SRP concern)
├── Dashboard (Manager, User)
└── Lazy loads: ai, crm, erp, finance, pdv, rpg, sso, saas, omnichannel

MFEs (ports 3001–3011):
├── gaqno-ai-ui, gaqno-crm-ui, gaqno-erp-ui, gaqno-finance-ui
├── gaqno-pdv-ui, gaqno-rpg-ui, gaqno-sso-ui
├── gaqno-saas-ui, gaqno-omnichannel-ui
└── gaqno-landing-ui, gaqno-lenin-ui (Vue, standalone)
```

### 2.2 Frontcore (@gaqno-frontcore)

| Area        | Contents                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| components  | UI (shadcn), admin, guards, layout (apenas tipo ISidebarItem; sidebar/layout no Shell)  |
| hooks       | auth, admin, ai, health, ui (useDialog, useFilteredMenu, usePermissions) |
| contexts    | AuthContext, TenantContext                                              |
| store       | authStore, uiStore, whiteLabelStore                                     |
| utils/api   | api-client, sso-client                                                 |
| types       | admin, app, auth, user, permissions, whitelabel, health                 |

### 2.3 Frontend Findings

| Finding                          | Severity | Jira / Doc reference                    |
| -------------------------------- | -------- | -------------------------------------- |
| Hooks inside components/         | Medium   | GAQNO-1112 — inventory of violations   |
| Inconsistent frontcore adoption | Medium   | gaqno-crm-ui, gaqno-omnichannel-ui low use |
| Missing barrels (index.ts)       | Low      | GAQNO-1112 — gaqno-finance-ui/hooks/finance |
| Hooks without tests              | Medium   | GAQNO-1112 — useTransactions, etc.     |
| Shell overloaded (admin + host)  | High     | system-architecture-audit.md            |
| API clients duplicated          | Medium   | gaqno-finance-ui, gaqno-ai-ui have own |

### 2.4 Jira Items (Frontend)

| Key         | Summary                                       | Status      |
| ----------- | --------------------------------------------- | ----------- |
| GAQNO-1112  | Frontend architecture cleanup and consistency | Teste       |
| GAQNO-1307  | Retail Content Engine — Shell & AI UI         | Code Review |
| GAQNO-1311  | Centralize shared interfaces in @gaqno-types  | Teste       |
| GAQNO-1326  | Omnichannel UI: architecture, UX improvements | Code Review |
| GAQNO-1337  | WhatsApp Webhook Phase 1 (media, delivery)    | Code Review |

---

## 3. Backend Architecture Analysis

### 3.1 Current Structure

```
Services (NestJS):
├── gaqno-sso-service      — auth, users, tenants, branches, menu
├── gaqno-ai-service       — AI content, books, narrator
├── gaqno-finance-service  — transactions, categories, credit cards
├── gaqno-pdv-service     — sales, PDV
├── gaqno-rpg-service     — campaigns, sessions, characters, narrator
├── gaqno-omnichannel-service — WhatsApp, Telegram, conversations
├── gaqno-admin-service   — minimal (ConfigModule only)
└── gaqno-saas-service    — minimal (costs only)
```

### 3.2 Backcore (@gaqno-backcore)

| Area     | Contents                                                |
| -------- | ------------------------------------------------------- |
| services | base-crud.controller, base-crud.service, sso.service   |
| modules  | app-module.factory                                       |
| schemas  | auth, base.dto                                           |
| config   | index                                                    |

### 3.3 Backend Module Pattern (gaqno-rpg-service)

```
src/
├── actions/      — controller, service, dto
├── campaigns/    — controller, service, dto
├── characters/   — controller, service, dto
├── custom-classes/
├── dnd5e/        — API client, services
├── locations/
├── narrator/     — prompts, services
├── rag/
├── sessions/
├── websocket/    — gateway, handlers
├── database/     — db.module, schema (Drizzle)
└── common/       — guards, filters
```

### 3.4 Backend Findings

| Finding                         | Severity | Note                             |
| ------------------------------- | -------- | -------------------------------- |
| admin-service / saas-service    | Medium   | Minimal; logic lives in SSO      |
| DTOs not implementing shared   | Medium   | contracts-and-types.md            |
| Types drift backcore vs frontcore | Medium | GAQNO-1311 addresses via types pkg |

### 3.5 Jira Items (Backend)

| Key         | Summary                                        | Status      |
| ----------- | ---------------------------------------------- | ----------- |
| GAQNO-1337  | WhatsApp Webhook Phase 1 — backend + frontend   | Code Review |
| GAQNO-1338  | DB: omni_messages new fields                     | Teste       |
| GAQNO-1339  | Backend: webhook payload interfaces             | Teste       |
| GAQNO-1340  | Backend: process all message types              | Teste       |
| GAQNO-1341  | Backend: sent/delivered/read + WS event         | Teste       |

---

## 4. Shared Packages

### 4.1 @gaqno-types

| File          | Domain                                      |
| ------------- | ------------------------------------------- |
| auth.ts       | Auth, tokens                                |
| user.ts       | User, profile                               |
| tenant.ts     | Tenant, org                                 |
| finance.ts    | Transactions, categories                    |
| rpg.ts        | Campaigns, characters, sessions              |
| health.ts     | Health checks                               |
| product.ts    | Product, catalog                            |
| ...           | billing, branch, customer, sale, usage      |

**Jira:** GAQNO-1311 — centralize shared interfaces, avoid drift.

### 4.2 Contracts Convention

| API (backend) | snake_case |
| UI / state   | camelCase  |
| Shared types | snake_case (mirrors API) |

---

## 5. Recommendations (Aligned with Jira)

| Priority | Action | Status |
| -------- | ------ | ------ |
| 1        | Close GAQNO-1112: move hooks out of components, add barrels, tests | Barrels done (finance-ui); hooks move + tests pending |
| 2        | Close GAQNO-1311: migrate cross-cutting types to @gaqno-types | Pending |
| 3        | GAQNO-1305: API prefix v1 — backends setGlobalPrefix, frontcore client | Done (already in place) |
| 4        | Refactor Shell: migrate admin pages to gaqno-admin-ui or platform-admin MFE | Pending |
| 5        | Standardize API client: all MFEs use frontcore api-client | Done (finance, omnichannel, rpg, ai use frontcore) |

---

## 6. References

- [frontend-architecture.md](./frontend-architecture.md)
- [system-architecture-audit.md](./system-architecture-audit.md)
- [contracts-and-types.md](./contracts-and-types.md)
- [refactoring-roadmap.md](./refactoring-roadmap.md)
- Jira project: **GAQNO** — [gaqno.atlassian.net](https://gaqno.atlassian.net)

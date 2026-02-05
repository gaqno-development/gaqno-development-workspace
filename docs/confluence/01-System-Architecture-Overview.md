# System Architecture Overview

**Document Type:** Confluence Page  
**Last Updated:** 2025-02-05  
**Source:** Derived from gaqno-development-workspace codebase

---

## 1. Monorepo Vision

The gaqno platform is a **Turborepo monorepo** containing:

| Layer                | Purpose                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Shared packages**  | `@gaqno-backcore`, `@gaqno-frontcore` — abstractions, types, base services                                             |
| **Frontend MFEs**    | 12+ micro-frontends (shell, sso, ai, crm, erp, finance, pdv, rpg, saas, admin, omnichannel, warehouse, landing, lenin) |
| **Backend services** | 8 NestJS services (sso, ai, finance, pdv, rpg, omnichannel, admin, saas, warehouse)                                    |

**Build orchestration:** Turbo with `dependsOn: ["^build"]` for packages; `build` outputs to `dist/**`.

---

## 2. Frontend vs Backend Responsibilities

### Frontend (Shell + MFEs)

| Responsibility                           | Owner                                             |
| ---------------------------------------- | ------------------------------------------------- |
| Module Federation host                   | gaqno-shell-ui                                    |
| Auth UI, login, register                 | gaqno-sso-ui                                      |
| Domain-specific UIs                      | gaqno-ai-ui, gaqno-finance-ui, gaqno-rpg-ui, etc. |
| Platform admin (domains, tenants, users) | Shell pages + gaqno-admin-ui                      |
| Shared UI components, hooks, providers   | @gaqno-frontcore                                  |

### Backend (NestJS Services)

| Responsibility                                    | Owner                                   |
| ------------------------------------------------- | --------------------------------------- |
| Auth, users, tenants, branches, menu, permissions | gaqno-sso-service                       |
| RPG sessions, campaigns, narrator, DnD5e          | gaqno-rpg-service                       |
| Transactions, categories, credit cards            | gaqno-finance-service                   |
| Sales, products, PDV                              | gaqno-pdv-service                       |
| AI, videos                                        | gaqno-ai-service                        |
| Omnichannel, messaging                            | gaqno-omnichannel-service               |
| Admin, SaaS (stubs)                               | gaqno-admin-service, gaqno-saas-service |

---

## 3. Shared Packages Purpose

### @gaqno-backcore

- **BaseCrudController**, **BaseCrudService** — CRUD abstractions
- **SsoService** — SSO client for cross-service auth
- **Schemas** — auth.ts, base.dto.ts
- **Types** — `types/shared`: auth, user, org, tenant, branch, permission, customer, product, sale, transaction, audit

### @gaqno-frontcore

- **Providers** — QueryProvider, AuthProvider, TenantProvider
- **API client** — createAxiosClient, registerServiceConfig (401 handling)
- **Hooks** — useAuth, useTenants, useDomains, useUsers, useApiQuery, useApiMutation
- **Components** — UI primitives, admin (DomainsList, TenantForm, etc.), layout (AppSidebar, Header)
- **Types** — shared types (auth, user, org, audit, product, customer, sale)

---

## 4. High-Level Textual Diagrams

### Monorepo Structure

```
gaqno-development-workspace/
├── @gaqno-backcore/     # Shared backend types, base services
├── @gaqno-frontcore/    # Shared frontend components, hooks, API client
├── gaqno-shell-ui/      # Module Federation host (port 3000)
├── gaqno-*-ui/          # MFEs (sso, ai, crm, erp, finance, pdv, rpg, saas, admin, omnichannel, warehouse)
├── gaqno-*-service/     # NestJS services (sso, ai, finance, pdv, rpg, omnichannel, admin, saas, warehouse)
└── docs/
```

### Request Flow (Frontend → Backend)

```
[MFE] → createAxiosClient(baseURL) → [NestJS Service]
         ↑
         @gaqno-frontcore/utils/api/api-client.ts
         registerServiceConfig(serviceName, { on401Reject })
```

### Module Federation

```
[Shell] loads remotes at build time:
  MFE_AI_URL, MFE_CRM_URL, MFE_FINANCE_URL, MFE_RPG_URL, ...
  → lazy(() => import("mfe/App"))
```

---

## 5. Known Architectural Debt

| Item                                                 | Status                            |
| ---------------------------------------------------- | --------------------------------- |
| Shell overloaded (host + 19 admin pages + dashboard) | Documented; migration planned     |
| admin-service, saas-service minimal (stubs)          | Documented; logic in sso-service  |
| Types duplicated (backcore vs frontcore)             | Drift risk; consolidation planned |
| DTOs not implementing shared interfaces              | In progress                       |
| API client duplication (finance-ui has own)          | Standardization planned           |

---

## References

- [Frontend Architecture Guide](./02-Frontend-Architecture-Guide.md)
- [Backend Architecture Guide](./03-Backend-Architecture-Guide.md)
- [Contracts & Types Guide](./04-Contracts-Types-Guide.md)
- [Architectural Rules & Guardrails](./05-Architectural-Rules-Guardrails.md)

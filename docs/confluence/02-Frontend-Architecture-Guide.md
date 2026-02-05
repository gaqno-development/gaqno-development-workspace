# Frontend Architecture Guide

**Document Type:** Confluence Page  
**Last Updated:** 2025-02-05  
**Source:** Derived from gaqno-development-workspace frontend codebase

---

## 1. MFE Structure and Rules

### Shell (gaqno-shell-ui)

- **Port:** 3000
- **Role:** Module Federation host; loads all MFEs via `@originjs/vite-plugin-federation`
- **Routes:** Catches all app routes (e.g. `/rpg`, `/finance`, `/organization`)
- **Layout:** ShellLayoutWrapper — auth, menu, layout

### MFE Inventory

| MFE                  | Base Path     | Port | Primary Domain        |
| -------------------- | ------------- | ---- | --------------------- |
| gaqno-sso-ui         | /auth         | 3001 | Auth, login, register |
| gaqno-ai-ui          | /ai           | 3002 | AI features           |
| gaqno-crm-ui         | /crm          | 3003 | CRM                   |
| gaqno-erp-ui         | /erp          | 3004 | ERP                   |
| gaqno-finance-ui     | /finance      | 3005 | Finance               |
| gaqno-pdv-ui         | /pdv          | 3006 | Point of sale         |
| gaqno-rpg-ui         | /rpg          | 3007 | RPG campaigns         |
| gaqno-saas-ui        | /sass         | 3008 | SaaS costing          |
| gaqno-admin-ui       | /organization | 3009 | Tenant admin          |
| gaqno-omnichannel-ui | /omnichannel  | 3010 | Omnichannel           |
| gaqno-warehouse-ui   | /warehouse    | —    | Warehouse             |
| gaqno-landing-ui     | —             | —    | Landing               |
| gaqno-lenin-ui       | —             | —    | Lenin (Vue)           |

### MFE Build-Time Env Vars

```
MFE_<NAME>_URL  → remoteEntry.js URL (production: portal.gaqno.com.br/<path>)
VITE_SERVICE_<NAME>_URL → API base URL (production: api.gaqno.com.br/<service>)
```

---

## 2. Shell Responsibilities

### DO

- Host Module Federation
- Provide layout, auth guard, menu
- Lazy-load MFEs
- Handle fallbacks when MFE fails to load

### DO NOT

- Accumulate domain-specific pages (admin, costing) — migrate to MFEs
- Hardcode MFE-specific logic in shared code

### Current Shell Pages (Target: Reduce)

| Location     | Pages                                                                                                              | Migration Target |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------- |
| pages/admin/ | DomainsPage, TenantsPage, BranchesPage, UsersPage, RolesPage, MenuPage, SettingsPage, UsagePage, CostingPage, etc. | gaqno-admin-ui   |
| pages/       | DashboardPage, ManagerDashboardPage, UserDashboardPage                                                             | Keep or split    |

---

## 3. Hooks, Pages, Components Conventions

### Hooks

| Rule               | Description                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Logic in hooks** | Components are UI-only; business logic lives in hooks                                    |
| **Naming**         | camelCase, prefix `use` (e.g. useTenants, useCostingData)                                |
| **Location**       | `hooks/` at MFE root; `hooks/index.ts` barrel                                            |
| **Per-page hooks** | When page has non-trivial logic: `pages/[feature]/hooks/` or `hooks/use[Feature]Page.ts` |

### Pages

| Rule         | Description                                 |
| ------------ | ------------------------------------------- |
| **Naming**   | PascalCase, suffix `Page` or `View`         |
| **Location** | `pages/` directory                          |
| **Content**  | Compose components; delegate logic to hooks |

### Components

| Rule          | Description                                       |
| ------------- | ------------------------------------------------- |
| **Naming**    | PascalCase                                        |
| **Structure** | Prefer `components/[domain]/` for domain-specific |
| **Shared**    | Use @gaqno-frontcore for reusable UI              |

---

## 4. Shared Frontend Package Usage

### @gaqno-frontcore Exports

| Category   | Examples                                                               |
| ---------- | ---------------------------------------------------------------------- |
| Providers  | QueryProvider, AuthProvider, TenantProvider                            |
| API        | createAxiosClient, registerServiceConfig                               |
| Hooks      | useAuth, useTenants, useDomains, useUsers, useApiQuery, useApiMutation |
| Components | Button, Card, DataTable, admin (DomainsList, TenantForm)               |
| Layout     | AppSidebar, Header, DashboardLayout                                    |

### API Client Usage

```ts
// In MFE main.tsx (before any API usage)
import { registerServiceConfig } from "@gaqno-development/frontcore";

registerServiceConfig("rpg", {
  on401Reject: (_, path) => path.startsWith("/rpg"),
});

// In hooks/services
import { createAxiosClient } from "@gaqno-development/frontcore";
const client = createAxiosClient({
  baseURL: import.meta.env.VITE_SERVICE_RPG_URL,
});
```

---

## 5. Testing and TDD Expectations

| MFE              | Current Coverage              | Target              |
| ---------------- | ----------------------------- | ------------------- |
| gaqno-rpg-ui     | High (hooks, components, e2e) | Maintain            |
| gaqno-shell-ui   | Login, menu, AI               | Maintain            |
| gaqno-ai-ui      | useVideoQueries.spec          | Extend              |
| gaqno-admin-ui   | Low                           | Hooks with spec     |
| gaqno-saas-ui    | Low                           | useCostingData.spec |
| gaqno-finance-ui | Partial                       | Hooks finance       |
| gaqno-pdv-ui     | Partial                       | Hooks pdv           |

**Rule:** New features require tests. Hooks with logic must have `*.spec.ts`.

---

## 6. DO / DO NOT

### DO

- Use `createAxiosClient` or `coreAxiosClient` from frontcore
- Put logic in hooks; components render UI
- Use `registerServiceConfig` for 401 behavior per service
- Follow snake_case (API) vs camelCase (UI) per [API-CONTRACTS-CONVENTION](../../API-CONTRACTS-CONVENTION.md)
- Add `hooks/index.ts` barrel in every MFE with hooks

### DO NOT

- Create local API clients (e.g. lib/api-client.ts) — use frontcore
- Put business logic in components
- Use `any` in production code; use `Record<string, unknown>` if needed
- Hardcode service URLs — use `VITE_SERVICE_*` env vars

---

## References

- [System Architecture Overview](./01-System-Architecture-Overview.md)
- [API Contracts Convention](../../API-CONTRACTS-CONVENTION.md)
- [FRONTEND.md](../../FRONTEND.md)

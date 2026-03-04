# Certification Tests

Tests that certify Phase 4 (Intelligence) and Phase 5 (ERP expansion) implementation.

## Logout clears all necessary storage

**Certified in code** (no separate test): the logout action clears everything required for a clean sign-out.

| Cleared on logout | Where |
|-------------------|--------|
| Backend session / cookies | SSO `POST /sign-out` (Set-Cookie clear) |
| All `localStorage` keys starting with `gaqno_` | `@gaqno-frontcore` `clearAllStorage()` |
| `gaqno_auth_state`, `gaqno_menu_items`, `auth-storage` | Same; see `LOGOUT_LOCAL_STORAGE_KEYS` |
| Full `sessionStorage` | `clearAllStorage()` |
| Zustand auth store (in-memory + persisted) | `clearAuth()` + removal of `auth-storage` key |
| React Query cache | `queryClient.clear()` in `AuthContext.handleSignOut` (in `finally`) |

Flow: shell `signOut` → `authStorage.clear()` → frontcore `signOut()` → backend mutation → `finally`: `clearAllStorage()`, `clearAuth()`, `queryClient.clear()`. Theme and language preferences are intentionally **not** cleared.

## Where tests live

| Package | Runner | Location | What is certified |
|--------|--------|----------|--------------------|
| **gaqno-erp-service** | Jest | `src/**/*.spec.ts` | Orders, Suppliers, Inventory, Purchasing, Logistics, Products services; schema table names; health |
| **gaqno-intelligence-service** | Jest | `src/**/*.spec.ts` | InsightsService (event log, dashboard metrics, insights, metrics); HealthController |
| **gaqno-intelligence-ui** | Vitest | `src/pages/*.spec.tsx` | Analytics, Forecasts, Insights, EventLog pages render expected content |
| **gaqno-shell-ui** | Playwright | `tests/production-modules.spec.ts` | Intelligence and ERP Orders routes load without service error (requires `LOGIN_EMAIL` + `LOGIN_PASSWORD`) |

## How to run

```bash
# ERP service (unit)
cd gaqno-erp-service && npm test

# Intelligence service (unit)
cd gaqno-intelligence-service && npm test

# Intelligence UI (unit)
cd gaqno-intelligence-ui && npm test

# Shell production modules (E2E, optional; skips if no credentials)
LOGIN_EMAIL=... LOGIN_PASSWORD=... npx playwright test tests/production-modules.spec.ts
```

From workspace root (if turbo is configured for test):

```bash
npm test
```

## Coverage

- **ERP**: OrdersService, SuppliersService, InventoryService, PurchasingService, LogisticsService CRUD and tenant scoping; ProductsService with event publisher mock; schema table list.
- **Intelligence service**: InsightsService getEventLog, getEventCountByType/Source, getDashboardMetrics, getInsights, getMetrics; HealthController.
- **Intelligence UI**: Each MFE page (Analytics, Forecasts, Insights, EventLog) renders main heading and key content.
- **Shell**: `/intelligence` and `/erp/orders` load without "Serviço Indisponível" when logged in.

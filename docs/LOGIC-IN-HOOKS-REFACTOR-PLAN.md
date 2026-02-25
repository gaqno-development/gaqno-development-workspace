# Plan: Logic in Hooks (separate view from logic)

Per workspace rules: **components = presentational; hooks = all business logic**. Components should not hold `useState`/`useEffect`/`useRef` for domain logic; that belongs in hooks so it is testable and reusable.

This plan applies to **all frontend apps** in the workspace (gaqno-shell-ui, gaqno-landing-ui, gaqno-omnichannel-ui, gaqno-ai-ui, gaqno-crm-ui, etc.). Each app should maintain its own refactor checklist as it moves logic into hooks.

**Per-app checklists:** gaqno-omnichannel-ui has a completed example in `gaqno-omnichannel-ui/docs/LOGIC-IN-HOOKS-REFACTOR-PLAN.md`.

## How to find candidates

Search for `useState` (and optionally `useEffect` / `useRef`) in page/component `.tsx` files from **each app's `src`** (exclude `*.test.*`, `*.spec.*`, and context/hook files):

```bash
rg "useState" --type-add 'tsx:*.tsx' -t tsx src \
  -g '!*.test.*' -g '!*.spec.*' \
  -g '!**/context/*' -g '!**/hooks/*'
```

## Refactor checklist (by file)

For each app, add rows for components/pages that still hold state or effects. Example columns:

| File | Current state | Action | Priority |
|------|---------------|--------|----------|
| _PageOrComponent.tsx_ | _e.g. form state, modal state, useEffect_ | Extract to `useX` hook; page/view only renders | High / Medium / Low |

Track progress in the app’s own `docs/` or in this workspace doc as you complete refactors.

## Excluded (correct by design)

- **Contexts**: Global state lives in context providers; no refactor.
- **Hooks**: Files under `hooks/` or `*.ts` hook modules — `useState`/`useEffect` there is correct.

## Order of work

1. **High priority**: Pages with forms or multi-step UI (form state, modal state, sync effects).
2. **Medium**: Reusable UI with local state (e.g. players, panels) — extract to hooks for testability.
3. **Low**: Pure UI state (e.g. expanded, scroll position) — optional; move to hook only if logic grows.

## Other apps – candidates (from grep)

| App | File | State / notes | Priority |
|-----|------|----------------|----------|
| **gaqno-admin-ui** | TenantForm.tsx | formData, useEffect | High |
| **gaqno-admin-ui** | DomainForm.tsx | formData | High |
| **gaqno-admin-ui** | SSLChecker.tsx | checkingIds | Medium |
| **gaqno-admin-ui** | UsageByUserView.tsx | period | Medium |
| **gaqno-saas-ui** | App.tsx | tenantId, activeTab | Medium |
| **gaqno-saas-ui** | BudgetAlerts.tsx | alerts, newAlert, showAddForm | Medium |
| **gaqno-saas-ui** | TenantCostsSummary.tsx | dateRange | Medium |
| **gaqno-saas-ui** | CodemapView.tsx | activeTab, searchTerm, filterType | Low (UI state) |
| **gaqno-omnichannel-ui** | SavedViewsPage.tsx | dialogOpen, name, status, assigneeId, queueId | High |
| **gaqno-omnichannel-ui** | CustomersPage.tsx | notesDraft | Medium |
| **gaqno-omnichannel-ui** | LiveMetricsPage.tsx | seconds (timer) | Medium |

Excluded: contexts, hooks, mocks, shell-ui demo blocks (dropdown-language, datatable-transaction).

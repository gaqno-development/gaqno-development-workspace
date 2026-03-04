# Shell Menu vs Routes — Analysis

This document compares the **official menu structure** (from `gaqno-sso-service` menu seed) with the **actual routes** defined in `gaqno-shell-ui` and each MFE. It identifies routes that are **not implemented**, **wrong** (menu href does not match app route), or **delegated** (shell passes to MFE; MFE may or may not handle the path).

**Sources**: `gaqno-shell-ui/src/App.tsx`, `gaqno-sso-service/src/menu/menu.seed.ts`, and each MFE `App.tsx` / route configs.

---

## 0) Status atual (resumo)

| Item | Status |
|------|--------|
| **Visão Geral** (tasks, calendar, notifications) | ✅ Shell define as rotas; todas renderizam `DashboardPage` (mesmo conteúdo que `/dashboard`). |
| **Inteligência** | ✅ Shell define `/intelligence` e `*` → `IntelligencePlaceholder`. |
| **Plataforma (SaaS)** tenants, usage, branches | ✅ Shell define `/saas/tenants`, `/saas/usage`, `/saas/branches` → redirect para `/admin/tenants`, `/admin/usage`, `/admin/branches`. |
| **Propostas (CRM)** | ✅ Menu seed já usa `/crm/sales/quotes`. |
| **Admin** organization, integrations, audit | ✅ Admin MFE (`renderContent`) tem `organization`, `integrations`, `audit` → páginas dedicadas. |
| **ERP** purchasing, suppliers, logistics, catalog/categories | ❌ ERP MFE só tem dashboard, catalog, inventory, orders, ai-content; catch-all redireciona para dashboard. |
| **Omnichannel** automation/*, reports/* | ⚠️ Doc original: segmentos mostram dashboard; confirmar se há views dedicadas. |
| **Finance** deep link ?view= | ⚠️ Confirmar sincronização URL ↔ view. |
| **PDV** sub-rotas | ⚠️ MFE único; sem sub-rotas distintas ainda. |

---

## 1) Rotas que já foram cobertas no shell (referência)

As seguintes entradas do menu **já possuem rota no shell** (implementação atual):

- **Visão Geral > Tarefas, Agenda, Notificações**: `/dashboard/tasks`, `/dashboard/calendar`, `/dashboard/notifications` → todas renderizam `DashboardPage`.
- **Inteligência**: `/intelligence` e `/intelligence/*` → `IntelligencePlaceholder`.
- **Plataforma > Tenants, Uso, Filiais**: `/saas/tenants`, `/saas/usage`, `/saas/branches` → redirect para `/admin/tenants`, `/admin/usage`, `/admin/branches`.

---

## 2) Rotas erradas ou desalinhadas (menu vs app)

| Menu item | Menu href | Estado | Observação |
|-----------|-----------|--------|------------|
| **Comercial > Propostas** | `/crm/sales/quotes` | ✅ Resolvido | Menu seed já usa `/crm/sales/quotes`. |
| **Administração > Organização** | `/admin/organization` | ✅ Resolvido | Admin MFE `renderContent` trata `path === "organization"` → `OrganizationPage`. |
| **Administração > Integrações** | `/admin/integrations` | ✅ Resolvido | Admin MFE trata `path === "integrations"` → `IntegrationsPage`. |
| **Administração > Auditoria** | `/admin/audit` | ✅ Resolvido | Admin MFE trata `path === "audit"` → `AuditPage`. |

---

## 3) ERP — menu beyond implemented routes

Shell defines `/erp` with children: `dashboard`, `catalog`, `inventory`, `orders`, `ai-content`. Any other path (e.g. `purchasing`, `suppliers`, `logistics`, `catalog/categories`) hits the catch-all and is handled by **ERPPage** (generic ERP app). The **ERP MFE** (`gaqno-erp-ui`) only defines:

- `/erp/dashboard`
- `/erp/catalog`
- `/erp/orders`
- `/erp/inventory`
- `/erp/ai-content`
- `/erp/*` → redirect to `/erp/dashboard`

So these menu hrefs are **not implemented** in the ERP MFE; they will redirect to dashboard or show the generic ERP app without a dedicated view:

| Menu item | Menu href | ERP MFE |
|-----------|-----------|---------|
| Operações > Compras (Ordens, Fornecedores, Recebimentos) | `/erp/purchasing`, `/erp/suppliers`, `/erp/purchasing/receipts` | No route; `/erp/*` → dashboard. |
| Operações > Catálogo > Categorias | `/erp/catalog/categories` | No route; only `/erp/catalog`. |
| Operações > Logística (Envios, Transportadoras) | `/erp/logistics`, `/erp/logistics/carriers` | No route. |

**Recommendation**: Either add these routes in the ERP MFE (with placeholder or real pages) or remove/adjust the menu entries until the features exist.

---

## 4) Omnichannel — automation and reports

Omnichannel MFE uses a route table with **prefix** matches: `inbox`, `customers`, `agents`, and **exact** matches for dashboard segments (`overview`, `live-metrics`, `sla-status`, `settings`, `automation`, `reports`). Paths like `automation/routing` and `reports/conversations` have first segment `automation` or `reports`; both are in `DASHBOARD_SEGMENTS`, so they render the **dashboard** section, not a dedicated automation or reports sub-view.

| Menu item | Menu href | Omnichannel MFE behavior |
|-----------|-----------|---------------------------|
| **Automação > Bots, Regras, Roteamento** | `/omnichannel/automation/routing`, `/omnichannel/automation/sla` | Renders dashboard (segment `automation`), not a dedicated automation page. |
| **Métricas > SLA, Volume, CSAT** | `/omnichannel/reports/conversations`, `/omnichannel/reports/agents` | Renders dashboard (segment `reports`), not a dedicated reports sub-route. |

So the **path is accepted** but the **content is wrong** (dashboard instead of automation/reports views). Either add real routes/views for `automation/*` and `reports/*` in the Omnichannel MFE or adjust the menu to point to the dashboard with the right tab/query.

---

## 5) Finance — path vs view state

Shell sends all `/finance` and `/finance/*` to the same **FinancePage** component. The Finance MFE has **no path-based router**; it uses **tabs** (dashboard, transactions, accounts, reports, investments, settings) and likely **query params** for views like receivables/payables (menu uses `?view=receivables`, etc.). If the Finance app does not read `view` (and sub-params) from the URL, then deep links from the menu may not open the correct tab/view.

**Recommendation**: Confirm that Finance MFE syncs `?view=` (and status/tab) with the active view; if not, add URL sync so menu hrefs like `/finance?view=receivables&status=pending` work.

---

## 6) PDV — single page

PDV MFE has a single **App** with one tab (“PDV”) and placeholder content (“PDV functionality coming soon…”). Shell delegates all `/pdv/*` to this app. So:

- `/pdv`, `/pdv/sales`, `/pdv/history`, `/pdv/closing` all load the same PDV app.
- There are **no distinct routes** for Caixa, Nova Venda, Histórico, Fechamento inside the MFE.

Menu links are **valid** (shell resolves them), but the MFE does not yet differentiate by path. When PDV is implemented, add internal routes or query params for `/pdv/sales`, `/pdv/history`, `/pdv/closing`.

---

## 7) SaaS — estado atual

O shell **já define** rotas para tenants, usage e branches: `/saas/tenants`, `/saas/usage`, `/saas/branches` fazem **redirect** para `/admin/tenants`, `/admin/usage`, `/admin/branches`. O Admin MFE trata esses paths e exibe o conteúdo correto. Nada pendente nesta seção.

---

## 8) Resumo — OK vs Pendente

| Categoria | Status | Ação |
|-----------|--------|------|
| **Shell** (dashboard/tasks, calendar, notifications; intelligence; saas→admin) | ✅ Feito | — |
| **Menu/SSO** (Propostas → quotes; Admin org/integrations/audit) | ✅ Feito | — |
| **Admin MFE** (organization, integrations, audit) | ✅ Feito | — |
| **ERP MFE** (purchasing, suppliers, logistics, catalog/categories) | ❌ Pendente | Adicionar rotas ou placeholders; ou reduzir menu. |
| **Omnichannel** (automation/*, reports/*) | ⚠️ A confirmar | Verificar se há views dedicadas; senão, ajustar menu ou doc. |
| **Finance** (?view= sync) | ⚠️ A confirmar | Garantir que deep links do menu abrem a aba/view correta. |
| **PDV** (sub-rotas) | ⚠️ Futuro | OK por enquanto; implementar quando houver feature. |

---

## 9) Próximos passos (apenas pendências)

1. **ERP MFE**
   - Change “Propostas” href from `/crm/sales/proposals` to `/crm/sales/quotes` (or add `proposals` in CRM).
   - Point “Filiais” to `/admin/branches` if shell does not add `/saas/branches`.
   - Point “Tenants” and “Uso” to `/admin/tenants` and `/admin/usage` if shell does not add `/saas/*` routes.

3. **Admin MFE**
   - Add routes (or redirects) for `organization`, `integrations`, `audit` so menu hrefs resolve to the correct pages.

4. **ERP MFE**
   - Add routes for `purchasing`, `suppliers`, `logistics`, `catalog/categories` (or temporary redirect to dashboard) and align menu.

5. **Omnichannel MFE**
   - Add dedicated views/routes for `automation/*` and `reports/*` (or document that they are dashboard tabs and align menu labels/links).

6. **Finance MFE**
   - Ensure `?view=` and related query params drive the active tab/view so menu deep links work.

This analysis is based on the current shell and MFE code and the provided menu JSON.

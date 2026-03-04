# Gaqno — DDD Architecture Reference

This document captures the bounded context map, event flows, responsibility matrix, and migration strategy derived from the DDD architecture analysis.

## Bounded Context Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GAQNO PLATFORM                                     │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Comercial   │  │ Atendimento  │  │  Operações   │  │   PDV        │        │
│  │   (CRM)      │  │(Omnichannel) │  │    (ERP)     │  │  (channel)   │        │
│  │              │  │              │  │              │  │              │        │
│  │ Leads        │  │ Conversations│  │ Products     │  │ Sales        │        │
│  │ Contacts     │  │ Messages     │  │ Orders       │  │ Cashier      │        │
│  │ Deals        │  │ Channels     │  │ Catalog      │  │ ref:Product  │        │
│  │ Workflows    │  │ Customers*   │  │ Inventory    │  │ ref:Customer │        │
│  │ Interactions │  │ Routing/SLA  │  │              │  │              │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │                │
│         ├─ opportunity_won ──────────────────┼─────────────────┤                │
│         │                 │                 │   sale_completed │                │
│         │      message_received             │                 │                │
│         ▼                 ▼                 ▼                 ▼                │
│  ┌──────────────────────────────────────────────────────────────┐              │
│  │                     Financeiro                               │              │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐      │              │
│  │  │ Pessoal (user-based)│  │ Empresarial (tenant-based)│      │              │
│  │  │ Transactions        │  │ Receivables               │      │              │
│  │  │ Categories          │  │ Payables                  │      │              │
│  │  │ Credit Cards        │  │ Business Cashflow         │      │              │
│  │  │ Cashflow            │  │ ← comercial.events        │      │              │
│  │  │ (no events)         │  │ ← pdv.events              │      │              │
│  │  └─────────────────────┘  └──────────────────────────┘      │              │
│  └──────────────────────────────────────────────────────────────┘              │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  AI Studio   │  │ Inteligência │  │    RPG       │  │  Wellness    │        │
│  │              │  │ (consumer)   │  │              │  │ (user-based) │        │
│  │ Agents       │  │ Analytics    │  │ Campaigns    │  │ Habits       │        │
│  │ Content      │  │ Forecasts    │  │ Sessions     │  │ Daily Logs   │        │
│  │ Video        │  │ Insights     │  │ Characters   │  │ Stats        │        │
│  │ Usage/Billing│  │ Automation   │  │              │  │ AI Insights  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────┐              │
│  │                     Identity & Platform                      │              │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐      │              │
│  │  │ SSO (Identity)      │  │ SaaS (Platform)          │      │              │
│  │  │ Tenants, Users      │  │ Costing, Usage           │      │              │
│  │  │ Roles, Permissions  │  │ Codemap, AI Models       │      │              │
│  │  │ Menu, Branches      │  │ Tenant Plans             │      │              │
│  │  │ Domains, Audit      │  │                          │      │              │
│  │  └─────────────────────┘  └──────────────────────────┘      │              │
│  └──────────────────────────────────────────────────────────────┘              │
│                                                                                 │
│  * Customers in Atendimento = messaging identity only                          │
│  * ref: = reference to another context's entity (no local copy)                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Event Flows

### Current (implemented)

| Producer | Event | Consumers | Status |
|----------|-------|-----------|--------|
| Comercial (CRM) | `comercial.opportunity_won` | Financeiro, Inteligência | Active |
| Comercial (CRM) | `comercial.proposta_aprovada` | Financeiro, Inteligência | Active (legacy) |
| Atendimento (Omnichannel) | `atendimento.message_received` | Inteligência | Active |
| Atendimento (Omnichannel) | `omnichannel.message.*` | CRM (sync contacts/interactions) | Active |
| Lead Enrichment | `crm.lead.enriched` | CRM | Active |
| PDV | `pdv.sale_completed` | Financeiro, Operações, Inteligência | Cataloged |
| Operações (ERP) | `operacoes.order_created` | Financeiro, Inteligência | Cataloged |

### Planned (per migration strategy)

| Producer | Event | Consumers | Phase |
|----------|-------|-----------|-------|
| Operações | `operacoes.product_created` | PDV (cache/sync) | Phase 2 |
| PDV | `pdv.sale_completed` | Financeiro Empresarial | Phase 2 |
| Customer (new) | `customer.created/updated` | CRM, Omnichannel, PDV | Phase 3 |
| Inteligência | `inteligencia.insight_generated` | (dashboard) | Phase 4 |
| Wellness | `wellness.daily_log_created` | — | Active (cataloged) |
| SaaS | `saas.tenant_plan_changed` | Admin | Active (cataloged) |

## Responsibility Matrix

| Context | Owns | Consumes (events) | Publishes (events) | UI |
|---------|------|-------------------|-------------------|----|
| **SSO** | Tenants, users, roles, permissions, menu, branches, domains | — | org/user/audit events | SSO UI; Admin (identity part) |
| **Comercial** | Leads, contacts, deals, workflows, interactions | omnichannel.messages | comercial.* (opportunity_won, etc.) | CRM MFE |
| **Atendimento** | Conversations, messages, channels, customers (messaging), routing, SLA | — | atendimento.* (message_received/sent, ticket_*) | Omnichannel MFE |
| **Operações** | Products, orders, (future: inventory, suppliers, logistics) | — | operacoes.* (order_*, product_*, stock_*) | ERP MFE |
| **Financeiro Pessoal** | User-scoped transactions, categories, credit cards, cashflow | — | — (optional) | Finance MFE (personal views) |
| **Financeiro Empresarial** | Tenant-scoped receivables, payables, business cashflow | comercial.events, pdv.events (future) | financeiro.* (payment_*, revenue_*) | Finance MFE (business views) |
| **Inteligência** | (None; or insights/forecasts cache) | comercial, atendimento, operacoes, financeiro, pdv | inteligencia.insight_*, forecast_* | Intelligence MFE (placeholder) |
| **AI Studio** | Agents, content, video, usage, billing | — | ai_studio.* | AI MFE |
| **PDV (channel)** | Sales session, cashier; **references** product + customer | operacoes.product (or shared catalog API) | pdv.sale_completed, cashier_* | PDV MFE |
| **RPG** | Campaigns, sessions, characters | — | rpg.* | RPG MFE |
| **Platform (SaaS)** | Tenants (billing), usage, costing, codemap | — | saas.* | Admin/SaaS MFE |
| **Wellness** | Habits, daily logs, stats, AI insights (user-scoped) | — | wellness.* | Wellness MFE |
| **Customer (new — future)** | Master customer identity, 360 view | atendimento, comercial, pdv (optional) | customer.* | — or CRM/Admin |

## Data Isolation Model

| Context | Isolation | Key |
|---------|-----------|-----|
| SSO | Tenant | `tenantId` |
| Comercial | Tenant | `tenantId` |
| Atendimento | Tenant | `tenantId` |
| Operações | Tenant | `tenantId` |
| Financeiro Pessoal | **User** | `userId` (no tenant) |
| Financeiro Empresarial | Tenant | `tenantId` |
| AI Studio | Tenant | `tenantId` |
| PDV | Tenant | `tenantId` |
| RPG | Tenant | `tenantId` |
| Wellness | **User** | `userId` (no tenant) |
| SaaS | Platform-wide | `tenantId` for billing |

## Known Duplications

| Concept | Where duplicated | Resolution |
|---------|-----------------|------------|
| **Customer** | Omnichannel (`omni_customers`), CRM (`crm_contacts` + `customerId`), PDV (`pdv_customers`), ERP (denormalized on order) | Phase 3: introduce Customer context or designate Omnichannel as master, sync via events |
| **Product** | ERP (`erp_products`), PDV (`pdv_products`) | Phase 2: ERP as source of truth; PDV consumes via API/events |

## Migration Phases

### Phase 1 — Menu & Routes (current)

- [x] Add wellness to `BoundedContext` type and event catalog
- [x] Add saas to `BoundedContext` type and event catalog
- [x] Fix shell routes: dashboard sub-items, intelligence placeholder
- [x] Fix shell routes: saas/tenants, saas/usage, saas/branches redirects
- [x] Fix menu seed: CRM proposals→quotes href
- [x] Add wellness to menu seed, menu-config, shell-menu
- [x] Add Admin MFE pages for organization, integrations, audit

### Phase 2 — PDV as Channel + Product Ownership

- [ ] Publish `operacoes.product_created` events from ERP
- [ ] PDV reads product catalog from Operações (API or event sync)
- [ ] PDV publishes `pdv.sale_completed` to Financeiro Empresarial / Operações
- [ ] Remove product duplication in PDV (migrate to references)

### Phase 3 — Customer Context

- [ ] Introduce Customer bounded context (new service or module)
- [ ] Migrate Omnichannel/CRM/PDV to reference customer ID
- [ ] Sync via domain events (`customer.created`, `customer.updated`)

### Phase 4 — Intelligence Service

- [ ] Create `gaqno-intelligence-service` as event-driven consumer
- [ ] Create Intelligence MFE with analytics, forecasts, insights
- [ ] Wire consumers for inteligência events from the catalog

### Phase 5 — Operações Expansion

- [ ] Add inventory, purchasing, suppliers, logistics tables to ERP
- [ ] Align ERP menu with actual capabilities

## Topic Registry

All Kafka topics follow the `{bounded_context}.events` convention:

| Topic | Bounded Context |
|-------|----------------|
| `comercial.events` | Comercial (CRM) |
| `atendimento.events` | Atendimento (Omnichannel) |
| `operacoes.events` | Operações (ERP) |
| `financeiro.events` | Financeiro |
| `inteligencia.events` | Inteligência |
| `ai_studio.events` | AI Studio |
| `pdv.events` | PDV |
| `rpg.events` | RPG |
| `admin.events` | Admin |
| `sso.events` | SSO |
| `wellness.events` | Wellness |
| `saas.events` | SaaS (Platform) |
| `dlq.events` | Dead-letter queue |

## Service ↔ Bounded Context Map

| Service | Bounded Context(s) | Database |
|---------|-------------------|----------|
| `gaqno-sso-service` | SSO (Identity) | Own DB |
| `gaqno-crm-service` | Comercial | Own DB |
| `gaqno-omnichannel-service` | Atendimento | Own DB |
| `gaqno-erp-service` | Operações | Own DB |
| `gaqno-finance-service` | Financeiro Pessoal + Financeiro Empresarial | Own DB |
| `gaqno-ai-service` | AI Studio | Own DB |
| `gaqno-pdv-service` | PDV (channel) | Own DB |
| `gaqno-rpg-service` | RPG | Own DB |
| `gaqno-wellness-service` | Wellness | Own DB |
| `gaqno-saas-service` | SaaS (Platform) | Own DB |
| `gaqno-admin-service` | Admin (thin shell) | — |
| `gaqno-lead-enrichment-service` | Cross-cutting (Comercial ↔ Atendimento) | Own DB |

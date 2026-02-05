# Backend Architecture Guide

**Document Type:** Confluence Page  
**Last Updated:** 2025-02-05  
**Source:** Derived from gaqno-development-workspace backend codebase

---

## 1. NestJS Service Structure

### Service Inventory

| Service                   | Port | Database             | Primary Modules                                             |
| ------------------------- | ---- | -------------------- | ----------------------------------------------------------- |
| gaqno-sso-service         | 4001 | gaqno_sso_db         | Auth, Users, Tenants, Branches, Menu, Permissions, Domains  |
| gaqno-ai-service          | 4002 | gaqno_ai_db          | AI, Videos                                                  |
| gaqno-finance-service     | 4005 | gaqno_finance_db     | Transactions, Categories, CreditCards, Subcategories        |
| gaqno-pdv-service         | 4006 | gaqno_pdv_db         | Sales, Products, Customers, PDV                             |
| gaqno-rpg-service         | 4007 | gaqno_rpg_db         | Sessions, Characters, Campaigns, Narrator, Dnd5e, WebSocket |
| gaqno-omnichannel-service | 4008 | gaqno_omnichannel_db | Channels, Conversations, Messages, Messaging                |
| gaqno-admin-service       | —    | —                    | ConfigModule only (stub)                                    |
| gaqno-saas-service        | —    | —                    | ConfigModule only (stub)                                    |
| gaqno-warehouse-service   | —    | —                    | Minimal (stub)                                              |

---

## 2. Feature/Module Pattern

### Standard Structure

```
[feature]/
├── [feature].module.ts
├── [feature].controller.ts
├── [feature].service.ts
├── dto/
│   ├── create-[feature].dto.ts
│   └── update-[feature].dto.ts
└── (entities, sub-services as needed)
```

### Naming Conventions

| Artifact | Convention       | Example                   |
| -------- | ---------------- | ------------------------- |
| Modules  | PascalCase       | CampaignsModule           |
| Folders  | kebab-case       | credit-cards/             |
| DTOs     | create-\*.dto.ts | create-transaction.dto.ts |

---

## 3. Controllers vs Services

### Controllers (Thin)

- Orchestrate request/response
- Validate input (class-validator)
- Delegate to services
- Return HTTP status and body

### Services (Dense)

- Business logic
- Database access
- Cross-service calls (SsoService)
- No HTTP concerns

---

## 4. DTOs, Validation, Schemas

### DTOs

- Use `class-validator` decorators
- Implement interfaces from `@gaqno-backcore/types/shared` when available
- API contract: **snake_case** (transaction_date, category_id)

### Shared Schemas (@gaqno-backcore)

- `auth.ts` — JWT, session
- `base.dto.ts` — base DTO patterns

---

## 5. Shared Backend Abstractions

### @gaqno-backcore

| Export             | Purpose                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------- |
| BaseCrudController | CRUD endpoints boilerplate                                                               |
| BaseCrudService    | CRUD service boilerplate                                                                 |
| SsoService         | SSO API client for auth/tenant resolution                                                |
| types/shared       | auth, user, org, tenant, branch, permission, customer, product, sale, transaction, audit |

---

## 6. Error Handling and Cross-Cutting Concerns

### Auth

- `AuthMiddleware.forRoutes('*')` — finance, rpg, pdv
- JWT validation via shared secret
- Tenant resolution from token

### Database

- Each service: `database/db.module.ts`
- TypeORM or Prisma per service

### CORS

- `CORS_ORIGIN` env: `https://portal.gaqno.com.br,https://api.gaqno.com.br`

### Cross-Service

- finance-service: `SSO_SERVICE_URL` for tenant/user resolution
- rpg-service: `AI_SERVICE_URL` for narrator

---

## 7. Admin and SaaS Services (Stubs)

**Decision (documented):** admin-service and saas-service are stubs. Logic (Users, Tenants, Branches, etc.) remains in gaqno-sso-service. No migration until there is a clear requirement (e.g. multi-tenant data isolation).

---

## References

- [System Architecture Overview](./01-System-Architecture-Overview.md)
- [Contracts & Types Guide](./04-Contracts-Types-Guide.md)
- [BACKEND.md](../../BACKEND.md)

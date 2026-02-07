# Product data inventory (AI Content Engine – discovery)

Inventory of product-related fields across CRM, ERP, and PDV for AI content generation. Source: codebase and schemas as of discovery date.

## PDV (gaqno-pdv-service)

**Source of truth for sales.** Product entity and API available.

| Field        | Type     | Required | Notes                    |
| ------------ | -------- | -------- | ------------------------ |
| id           | UUID     | yes      | PK                       |
| tenantId     | UUID     | yes      | Multi-tenant             |
| name         | string   | yes      | 255                      |
| description  | text     | no       |                          |
| price        | numeric  | yes      | 10,2                     |
| stock        | integer  | yes      |                          |
| sku          | string   | no       | 255                      |
| createdAt    | timestamp| yes      |                          |
| updatedAt    | timestamp| yes      |                          |

**API:** `GET/POST/PATCH/DELETE /products`, `GET /products/sku/:sku`, `GET /products/:id`. Session/tenant-scoped.

**Gaps for AI:** No category, no images, no long-form marketing copy, no tags.

---

## ERP

**Status:** No dedicated ERP backend in workspace. gaqno-erp-ui exists (frontend only). Product/catalog API not implemented.

| Field | Status |
| ----- | ------ |
| name, price, category | Not available |
| product images       | Not available |
| API endpoint         | Not exposed   |

**Gap:** Full product foundation for AI content is missing; depends on ERP Product Foundation story.

---

## CRM

**Status:** No dedicated CRM backend in workspace. gaqno-crm-ui exists (frontend only). No product entity or product–customer link.

| Field / capability     | Status |
| --------------------- | ------ |
| Customer segments     | Not available |
| Buyer persona mapping | Not defined   |
| CRM data linked to product ID | Not available |

**Gap:** CRM Enrichment Foundation story required before persona-based AI content.

---

## MVP product data contract (draft)

Minimum set for AI text/video generation from current state:

- **Required:** `id`, `name`, `price`, `tenantId` (from PDV).
- **Optional but recommended:** `description`, `sku`, `stock` (from PDV).
- **Not yet available:** `category`, `images[]`, `customerSegments`, `personaId`. To be added via ERP Product Foundation and CRM Enrichment Foundation.

Schema version and validation rules: see story "Define Product Data Contract (MVP)".

# Shop Platform Consolidation & Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove dropshipping projects, consolidate into gaqno-shop, and build comprehensive admin capabilities per tenant with complete storefront UI/UX matching fifia-doces patterns.

**Architecture:** Multi-tenant e-commerce with NestJS backend, Next.js frontend, Module Federation admin MFE, and full feature parity with fifia-doces including admin management tools.

**Tech Stack:** NestJS, Next.js 15, Drizzle ORM, PostgreSQL, TailwindCSS, shadcn/ui, React Query, Module Federation

---

## Overview

This plan addresses three key objectives:
1. **Remove dropshipping projects** from Dokploy (3 applications)
2. **Build comprehensive shop admin** with tenant-scoped management
3. **Complete storefront pages** matching fifia-doces UI/UX patterns

---

## Part 1: Remove Dropshipping Projects

### Files to Delete/Modify

**Dokploy Applications to Remove:**
- `pWCPRH4MiDSCY1j8OjkXt` - dropshipping-ui (status: error)
- `b297O2GbhkQfE94iIGdai` - dropshipping-service (status: done)
- `JJvsG9hKs6KqqehSHH2d9` - dropshipping-admin-ui (status: done)

**Local Directories (to be removed from git submodules):**
- `gaqno-dropshipping/`
- `gaqno-dropshipping-admin-ui/`
- `gaqno-dropshipping-service/`

**Shell UI Configuration Updates:**
- `gaqno-shell-ui/src/config/menu-config.ts` - Remove dropshipping routes
- `gaqno-shell-ui/src/config/mfe-route-config.tsx` - Remove dropshipping MFE config
- `gaqno-shell-ui/vite.config.ts` - Remove dropshipping remote
- `gaqno-shell-ui/src/App.tsx` - Remove dropshipping routes

**SSO Permissions Cleanup:**
- `gaqno-sso-service/src/permissions/constants/default-permissions.ts` - Remove dropshipping.* permissions
- `gaqno-sso-service/src/permissions/constants/default-roles.ts` - Remove from roles
- `gaqno-sso-service/src/permissions/route-permissions.seed.ts` - Remove dropshipping routes

---

## Part 2: Shop Admin Requirements

### Admin Feature Matrix

| Feature | Scope | Description |
|---------|-------|-------------|
| **Products Management** | Per Tenant | CRUD products, images, pricing, inventory, variations |
| **Orders Management** | Per Tenant | View orders, update status, customer communication |
| **Categories** | Per Tenant | Manage product categories, hierarchy |
| **Customers** | Per Tenant | View customer list, order history, profiles |
| **Feature Toggles** | Per Tenant | Enable/disable: shipping, coupons, recipes, inventory, dropshipping mode |
| **Styling & Branding** | Per Tenant | Colors, logo, favicon, custom CSS |
| **Templates** | Per Tenant | Email templates, invoice templates, page layouts |
| **Admin Users** | Per Tenant | Manage tenant admins, roles, permissions |
| **AI Integrations** | Per Tenant | Toggle AI features, view consumption/billing |
| **Dropshipping Admin** | Platform | Manage dropshipping tenants, global features |
| **Reports** | Per Tenant | Sales, inventory, customer analytics |

### Admin Pages Structure

```
/shop-admin
├── /produtos                    # Products list
│   ├── /novo                    # Create product
│   └── /[id]/editar             # Edit product
├── /pedidos                     # Orders list
│   └── /[id]                    # Order detail
├── /categorias                  # Categories
├── /clientes                    # Customers
├── /configuracoes               # Settings
│   ├── /aparencia               # Styling/branding
│   ├── /funcionalidades         # Feature toggles
│   ├── /templates               # Email/page templates
│   ├── /usuarios                # Admin users
│   └── /ia                      # AI integrations
├── /relatorios                  # Reports
└── /dropshipping                # Dropshipping admin (if enabled)
```

---

## Part 3: Storefront Pages (fifia-doces Parity)

### Required Pages

| Page | Route | Features |
|------|-------|----------|
| **Home** | `/` | Hero, categories showcase, product catalog grid, SEO |
| **Product Listing** | `/produtos` | Filter by category, pagination, sorting |
| **Product Detail** | `/produto/[slug]` | Images gallery, variations, add to cart, related products, SEO |
| **Cart** | `/carrinho` | Items list, quantity update, remove, checkout button |
| **Checkout** | `/checkout` | Customer info, shipping, payment (Mercado Pago), order summary |
| **My Orders** | `/meus-pedidos` | Order history, status tracking |
| **Order Detail** | `/pedido/[id]` | Order details, status, tracking |

### UI/UX Components (from fifia-doces)

- `StorefrontHero` - Hero section with background image
- `CatalogGrid` - Product grid with pagination
- `ProductCard` - Product display card
- `ProductDetailClient` - Product detail with variations
- `CategoryShowcase` - Category feature sections
- `IntroSection` - Text intro blocks
- `Reveal` - Animation wrapper
- Breadcrumb navigation
- JSON-LD structured data for SEO

---

## File Structure

### Backend (gaqno-shop-service)

```
src/
├── product/
│   ├── product.controller.ts      # HTTP routes
│   ├── product.service.ts         # Business logic
│   ├── product.module.ts
│   └── dto/
│       ├── create-product.dto.ts
│       └── update-product.dto.ts
├── order/
│   ├── order.controller.ts
│   ├── order.service.ts
│   └── dto/
├── category/
│   ├── category.controller.ts
│   └── category.service.ts
├── customer/
│   ├── customer.controller.ts
│   └── customer.service.ts
├── tenant-config/
│   ├── tenant-config.controller.ts
│   └── tenant-config.service.ts   # Feature flags, styling
├── admin/
│   ├── admin.controller.ts        # Admin-only routes
│   └── admin.service.ts           # User management, reports
└── database/schema.ts             # Add admin configs
```

### Frontend (gaqno-shop)

```
src/app/
├── page.tsx                       # Home (fifia-doces style)
├── layout.tsx
├── globals.css
├── produtos/
│   └── page.tsx                   # Product listing
├── produto/
│   └── [slug]/
│       └── page.tsx               # Product detail
├── carrinho/
│   └── page.tsx                   # Cart
├── checkout/
│   └── page.tsx                   # Checkout
├── meus-pedidos/
│   └── page.tsx                   # My orders
└── pedido/
    └── [id]/
        └── page.tsx               # Order detail

src/components/
├── storefront-hero.tsx
├── catalog-grid.tsx
├── product-card.tsx
├── product-detail-client.tsx
├── category-showcase.tsx
├── intro-section.tsx
├── reveal.tsx
└── ui/                            # shadcn components

src/contexts/
├── tenant-context.tsx
└── cart-context.tsx

src/lib/
├── api.ts                         # API client
└── utils.ts
```

### Admin MFE (gaqno-shop-admin)

```
src/
├── pages/
│   ├── products/
│   │   ├── ProductsPage.tsx
│   │   ├── ProductForm.tsx
│   │   └── hooks/
│   ├── orders/
│   │   ├── OrdersPage.tsx
│   │   └── OrderDetail.tsx
│   ├── categories/
│   │   └── CategoriesPage.tsx
│   ├── customers/
│   │   └── CustomersPage.tsx
│   ├── settings/
│   │   ├── SettingsPage.tsx
│   │   ├── AppearanceSettings.tsx
│   │   ├── FeatureToggles.tsx
│   │   ├── TemplatesSettings.tsx
│   │   ├── UsersManagement.tsx
│   │   └── AIIntegrations.tsx
│   └── reports/
│       └── ReportsPage.tsx
├── components/
│   └── ui/                        # Reusable components
├── hooks/
│   ├── useProducts.ts
│   ├── useOrders.ts
│   ├── useCategories.ts
│   ├── useCustomers.ts
│   ├── useTenantConfig.ts
│   └── useAdminUsers.ts
└── App.tsx                        # Updated with all routes
```

---

## Database Schema Updates

### Add to gaqno-shop-service schema.ts:

```typescript
// Admin user assignments per tenant
export const tenantAdmins = pgTable(
  "tenant_admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(), // Reference to SSO user
    role: varchar("role", { length: 50 }).default("admin"), // admin, manager, viewer
    permissions: jsonb("permissions").default("[]"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

// AI consumption tracking
export const aiConsumption = pgTable(
  "ai_consumption",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    feature: varchar("feature", { length: 100 }).notNull(), // image_gen, content_gen, etc
    tokensUsed: integer("tokens_used").default(0),
    cost: decimal("cost", { precision: 10, scale: 4 }).default("0"),
    metadata: jsonb("metadata").default("{}"),
    createdAt: timestamp("created_at").defaultNow(),
  }
);

// Email templates per tenant
export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // order_confirmation, shipping, etc
    subject: varchar("subject", { length: 255 }).notNull(),
    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);
```

---

## API Endpoints Required

### Product Management
```
GET    /shop/admin/products              # List products (with pagination, filters)
POST   /shop/admin/products              # Create product
GET    /shop/admin/products/:id          # Get product detail
PUT    /shop/admin/products/:id          # Update product
DELETE /shop/admin/products/:id          # Delete product
POST   /shop/admin/products/:id/images   # Upload images
```

### Order Management
```
GET    /shop/admin/orders                # List orders
GET    /shop/admin/orders/:id            # Order detail
PUT    /shop/admin/orders/:id/status     # Update order status
POST   /shop/admin/orders/:id/notes      # Add admin notes
```

### Category Management
```
GET    /shop/admin/categories            # List categories
POST   /shop/admin/categories            # Create category
PUT    /shop/admin/categories/:id        # Update category
DELETE /shop/admin/categories/:id        # Delete category
```

### Customer Management
```
GET    /shop/admin/customers             # List customers
GET    /shop/admin/customers/:id         # Customer detail
GET    /shop/admin/customers/:id/orders  # Customer orders
```

### Tenant Configuration
```
GET    /shop/admin/config                # Get tenant config
PUT    /shop/admin/config                # Update config
PUT    /shop/admin/config/features       # Update feature toggles
PUT    /shop/admin/config/styling        # Update branding
```

### Admin User Management
```
GET    /shop/admin/users                 # List admin users
POST   /shop/admin/users                 # Add admin user
PUT    /shop/admin/users/:id             # Update admin user
DELETE /shop/admin/users/:id             # Remove admin user
```

### AI Integration
```
GET    /shop/admin/ai/config             # AI configuration
PUT    /shop/admin/ai/config             # Update AI config
GET    /shop/admin/ai/consumption        # Usage reports
```

### Reports
```
GET    /shop/admin/reports/sales         # Sales report
GET    /shop/admin/reports/inventory     # Inventory report
GET    /shop/admin/reports/customers     # Customer analytics
```

---

## Implementation Phases

### Phase 1: Cleanup (Priority: HIGH)
1. Remove dropshipping applications from Dokploy
2. Remove dropshipping from shell-ui configuration
3. Remove dropshipping permissions from SSO
4. Update parent workspace submodules

### Phase 2: Backend API Expansion (Priority: HIGH)
1. Add admin endpoints to shop-service
2. Add tenant config management
3. Add admin user management
4. Add AI consumption tracking
5. Add reports aggregation
6. Run database migrations

### Phase 3: Admin MFE Pages (Priority: HIGH)
1. Products management page
2. Orders management page
3. Categories page
4. Customers page
5. Settings (appearance, features, templates)
6. Admin users management
7. AI integrations page
8. Reports dashboard

### Phase 4: Storefront Enhancement (Priority: MEDIUM)
1. Refactor home page (fifia-doces style)
2. Create product listing page
3. Create product detail page
4. Create cart page
5. Create checkout page
6. Create my orders page
7. Create order detail page
8. Add SEO components

---

## Testing Checklist

- [ ] All dropshipping routes removed from menu
- [ ] Shop admin accessible with proper permissions
- [ ] Products CRUD working per tenant
- [ ] Orders management functional
- [ ] Feature toggles persist correctly
- [ ] Styling changes reflect on storefront
- [ ] Admin users can be managed
- [ ] Storefront pages match fifia-doces UX
- [ ] Cart functionality works
- [ ] Checkout process complete
- [ ] Orders visible in "My Orders"
- [ ] Multi-tenant isolation enforced

---

## Notes

- All admin routes should check `shop.admin.access` permission
- Tenant context must be enforced on all admin endpoints
- Storefront should be public (no auth required)
- Use existing `@gaqno-development/frontcore` components
- Follow fifia-doces patterns for animations (Reveal component)
- Implement JSON-LD structured data for SEO
- Mobile-first responsive design

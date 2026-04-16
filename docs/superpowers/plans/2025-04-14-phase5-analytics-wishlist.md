# gaqno-shop Production Readiness - Phase 5: Analytics & Wishlist

> **For agentic workers:** Use superpowers:subagent-driven-development to implement tasks in this phase.

**Goal:** Implement wishlist functionality for customers and advanced analytics dashboard for admin.

**Estimated Duration:** 2 weeks

---

## Phase 5 Tasks

### Task 5.1: Create Analytics Database Schema

**File:** `gaqno-shop-service/src/database/schema.ts`

Add analytics tables to the existing schema file.

**Generate migration:**
```bash
cd gaqno-shop-service
npx drizzle-kit generate
npm run migrate
```

### Task 5.2: Create Analytics Service

**File:** `gaqno-shop-service/src/analytics/analytics.service.ts`

Create service for tracking events and generating reports.

### Task 5.3: Create Analytics Controller

**File:** `gaqno-shop-service/src/analytics/analytics.controller.ts`

API endpoints for analytics data.

### Task 5.4: Create Analytics Dashboard (Admin)

**File:** `gaqno-shop-admin/src/pages/Analytics/AnalyticsPage.tsx`

Visual dashboard with charts and KPIs.

### Task 5.5: Create Wishlist Service

**File:** `gaqno-shop-service/src/wishlist/wishlist.service.ts`

CRUD operations for wishlist items.

### Task 5.6: Create Wishlist Controller

**File:** `gaqno-shop-service/src/wishlist/wishlist.controller.ts`

API endpoints for wishlist management.

### Task 5.7: Create Customer Wishlist Page

**File:** `gaqno-shop/src/app/conta/lista-desejos/page.tsx`

Customer wishlist management UI.

### Task 5.8: Add Wishlist Button to Products

**File:** `gaqno-shop/src/components/wishlist-button.tsx`

Heart icon button for adding/removing from wishlist.

---

## Phase 5 Completion Checklist

- [ ] Analytics database schema
- [ ] Event tracking service
- [ ] Sales analytics API
- [ ] Conversion funnel API
- [ ] Analytics dashboard with charts
- [ ] Wishlist database schema
- [ ] Wishlist CRUD operations
- [ ] Customer wishlist page
- [ ] Wishlist buttons on products
- [ ] Move to cart functionality

---

**Next:** Continue to Phase 6 - i18n & Production Polish

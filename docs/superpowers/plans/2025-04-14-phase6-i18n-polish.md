# gaqno-shop Production Readiness - Phase 6: i18n & Production Polish

> **For agentic workers:** Use superpowers:subagent-driven-development to implement tasks in this phase.

**Goal:** Implement multi-language support (PT/EN) and production-ready optimizations.

**Estimated Duration:** 2 weeks

---

## Phase 6 Tasks

### Task 6.1: Set Up i18n Infrastructure

**Frontend dependencies:**
```bash
cd gaqno-shop
npm install react-i18next i18next i18next-http-backend
```

**File:** `gaqno-shop/src/lib/i18n.ts`

Configure i18n with Portuguese and English support.

### Task 6.2: Create Translation Files

**Files:**
- `gaqno-shop/public/locales/pt/common.json`
- `gaqno-shop/public/locales/en/common.json`

Extract all user-facing strings to translation files.

### Task 6.3: Implement Language Switcher

**File:** `gaqno-shop/src/components/language-switcher.tsx`

Dropdown to switch between PT and EN.

### Task 6.4: Set Up Redis Caching

**Backend:**
```bash
cd gaqno-shop-service
npm install ioredis
```

**File:** `gaqno-shop-service/src/cache/cache.service.ts`

Implement caching for products, shipping rates, etc.

### Task 6.5: Implement Rate Limiting

**File:** `gaqno-shop-service/src/common/middleware/rate-limit.middleware.ts`

Protect APIs from abuse.

### Task 6.6: Add Performance Optimizations

**Frontend:**
- Image optimization with next/image
- Lazy loading for components
- Code splitting
- Prefetch critical data

**Backend:**
- Database query optimization
- Connection pooling
- Response compression

### Task 6.7: Security Hardening

- CORS configuration
- Input sanitization
- SQL injection prevention
- XSS protection
- Security headers

### Task 6.8: End-to-End Testing

**File:** `gaqno-shop/playwright.config.ts`

Create E2E tests for critical user flows:
- Registration and login
- Browse and purchase
- Order tracking
- Loyalty program

### Task 6.9: Documentation

- API documentation
- Deployment guide
- Environment setup

---

## Phase 6 Completion Checklist

- [ ] i18n infrastructure set up
- [ ] Portuguese translations complete
- [ ] English translations complete
- [ ] Language switcher implemented
- [ ] Redis caching configured
- [ ] Rate limiting implemented
- [ ] Performance optimizations applied
- [ ] Security hardening complete
- [ ] E2E tests passing
- [ ] Documentation complete

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Redis server accessible
- [ ] Email service configured
- [ ] Correios/Jadlog credentials valid
- [ ] SSL certificates installed

### Deployment Steps
1. Build all Docker images
2. Push to registry
3. Update Dokploy configuration
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Monitor metrics

### Post-Deployment
- [ ] Verify all services running
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Test critical user flows
- [ ] Enable monitoring alerts

---

**CONGRATULATIONS!** gaqno-shop is now production-ready!

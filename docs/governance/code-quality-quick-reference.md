# Code Quality Epic - Quick Reference Guide

**Quick access guide for Jira story creation and sprint planning**

---

## Quick Links

- **Full Document:** [code-quality-epic-stories.md](./code-quality-epic-stories.md)
- **Jira Project:** [GAQNO Board](https://gaqno.atlassian.net/browse/GAQNO)
- **Workflow Guide:** [workspace-workflow.md](./workspace-workflow.md)

---

## Story Point Scale

| Points | Complexity | Time Estimate | Examples |
|--------|-----------|---------------|----------|
| 1 | Trivial | 1-2 hours | Simple config, documentation update |
| 2 | Simple | 2-4 hours | Small feature, straightforward fix |
| 3 | Medium | 4-8 hours | Medium feature, multiple files |
| 5 | Complex | 1-2 days | Large feature, requires design |
| 8 | Very Complex | 2-3 days | Major refactor, architectural change |
| 13 | Huge | 3-5 days | Epic-level work, multiple components |
| 21 | Massive | 1-2 weeks | Major epic, cross-cutting changes |

---

## Priority Quick Reference

### 🔴 Critical (Do Immediately)

**Epic 1: Security Fixes (21 points)**
- ⚠️ **BLOCKING PRODUCTION DEPLOYMENT**
- JWT authentication vulnerability (anyone can forge tokens)
- Missing rate limiting (API abuse, DDoS)
- **Start:** Immediately
- **Complete:** Before any production release

---

### 🟠 High Priority (Next 2-3 Sprints)

**Epic 2: Frontend Code Quality (34 points)**
- 0-8% test coverage → 80%+
- Fix type safety issues (remove `any`)
- Add accessibility features
- **Start:** Sprint 2
- **Complete:** Sprint 4

**Epic 3: Backend Code Quality (55 points)**
- ~5% test coverage → 80%+
- Extract common code to @gaqno-backcore
- Refactor fat services (>300 lines)
- Add API documentation (Swagger)
- **Start:** Sprint 2
- **Complete:** Sprint 6

---

### 🟡 Medium Priority (Following 2-3 Sprints)

**Epic 4: Performance Optimization (21 points)**
- Code splitting (reduce bundle 50%)
- React optimization (memo, callbacks)
- List virtualization
- **Start:** Sprint 6
- **Complete:** Sprint 7

**Epic 5: Code Refactoring (13 points)**
- Split InboxPage (817 lines → <300)
- Split useInboxPage (548 lines → <150)
- **Start:** Sprint 7
- **Complete:** Sprint 8

---

## Sprint Planning Suggestions

### Sprint 1 - Emergency Security Sprint (21 points)

**Focus:** Critical Security Vulnerabilities

**Stories:**
1. GAQNO-[TBD] - Fix JWT Authentication (8 points)
   - Replace base64 decode with proper JWT verification
   - Add token expiration and refresh
   - 4 subtasks

2. GAQNO-[TBD] - Add Rate Limiting (5 points)
   - Protect AI endpoints
   - Protect authentication endpoints
   - 4 subtasks

**Outcome:** Production-safe authentication and API protection

---

### Sprint 2 - Frontend Testing Foundation (17 points)

**Stories:**
1. GAQNO-[TBD] - Unit Tests for Hooks (13 points)
   - Setup testing infrastructure
   - Test API hooks
   - Test auth hooks
   - Test form hooks
   - 5 subtasks

2. GAQNO-[TBD] - Fix Type Safety (8 points) - START ONLY
   - Audit `any` types
   - Begin fixing high-priority hooks
   - 2 of 4 subtasks

**Outcome:** Testing infrastructure ready, most hooks tested

---

### Sprint 3 - Frontend Testing Complete (17 points)

**Stories:**
1. GAQNO-[TBD] - Fix Type Safety (remaining 4 points)
   - Complete type fixes
   - Enable strict mode

2. GAQNO-[TBD] - Component Tests (8 points)
   - Setup component testing
   - Test InboxPage
   - Test templates
   - 4 subtasks

3. GAQNO-[TBD] - E2E Tests (5 points)
   - Setup Playwright
   - Test critical flows
   - 3 subtasks

**Outcome:** 80%+ test coverage, zero `any` types, E2E tests running

---

### Sprint 4 - Backend Testing Foundation (21 points)

**Stories:**
1. GAQNO-[TBD] - Service Unit Tests (21 points)
   - Setup testing infrastructure
   - Test ConversationsService
   - Test TransactionsService
   - Test AIService
   - Integration tests
   - 6 subtasks

**Outcome:** 80%+ backend test coverage

---

### Sprint 5 - Backend Architecture (13 points)

**Stories:**
1. GAQNO-[TBD] - Extract to @gaqno-backcore (13 points)
   - Audit duplicated code
   - Extract HttpExceptionFilter
   - Extract auth middleware
   - Extract configs
   - 5 subtasks

**Outcome:** Common code centralized, reduced duplication

---

### Sprint 6 - Backend Optimization (21 points)

**Stories:**
1. GAQNO-[TBD] - Refactor Services (13 points)
   - Split ConversationsService
   - Split AIService
   - 5 subtasks

2. GAQNO-[TBD] - Database Optimization (8 points)
   - Fix N+1 queries
   - Add indexes
   - Cursor pagination
   - 4 subtasks

**Outcome:** Clean service architecture, optimized queries

---

### Sprint 7 - Performance & Documentation (13 points)

**Stories:**
1. GAQNO-[TBD] - Code Splitting (8 points)
   - Setup infrastructure
   - Split routes
   - Lazy load components
   - 4 subtasks

2. GAQNO-[TBD] - API Documentation (5 points) - START ONLY
   - Setup Swagger
   - Begin documenting controllers
   - 2 of 4 subtasks

**Outcome:** Reduced bundle size 50%, faster load times

---

### Sprint 8 - Polish (21 points)

**Stories:**
1. GAQNO-[TBD] - API Documentation (remaining 3 points)
   - Complete controller documentation
   - Add examples

2. GAQNO-[TBD] - React Optimization (8 points)
   - Add React.memo
   - Add useMemo/useCallback
   - 4 subtasks

3. GAQNO-[TBD] - Accessibility (8 points)
   - Add aria-labels
   - Keyboard navigation
   - Focus management
   - 4 subtasks

4. GAQNO-[TBD] - Refactor InboxPage (2 points) - START ONLY
   - Analysis and planning

**Outcome:** Optimized performance, accessible UI, complete documentation

---

### Sprint 9 - Final Polish (13 points)

**Stories:**
1. GAQNO-[TBD] - Split InboxPage (8 points)
   - Extract components
   - Update tests
   - 4 subtasks

2. GAQNO-[TBD] - Split useInboxPage (5 points)
   - Extract hooks
   - Update tests
   - 3 subtasks

**Outcome:** Clean, maintainable codebase

---

## Epic Status Tracking

| Epic | Status | Points | Completed | Remaining | Progress |
|------|--------|--------|-----------|-----------|----------|
| Epic 1: Security | ⏳ Not Started | 21 | 0 | 21 | 0% |
| Epic 2: Frontend Quality | ⏳ Not Started | 34 | 0 | 34 | 0% |
| Epic 3: Backend Quality | ⏳ Not Started | 55 | 0 | 55 | 0% |
| Epic 4: Performance | ⏳ Not Started | 21 | 0 | 21 | 0% |
| Epic 5: Refactoring | ⏳ Not Started | 13 | 0 | 13 | 0% |
| **TOTAL** | | **144** | **0** | **144** | **0%** |

**Update this table as stories are completed**

---

## Creating Stories in Jira - Quick Steps

### 1. Create Epic

```
Project: GAQNO
Issue Type: Epic
Epic Name: [Copy from full document]
Priority: [Critical/High/Medium]
Labels: [Add relevant labels]
Story Points: [Total from document]
Description: [Copy full description]
```

### 2. Create Story

```
Project: GAQNO
Issue Type: Story
Parent Epic: GAQNO-XXXX
Summary: [Copy from document]
Priority: [Critical/High/Medium]
Labels: [Add relevant labels]
Story Points: [From document]
Description: [Include acceptance criteria]
```

### 3. Create Subtasks

```
Project: GAQNO
Issue Type: Sub-task
Parent Story: GAQNO-XXXX
Summary: [Copy from document]
Priority: [Same as parent]
Story Points: [From document]
Description: [Include tasks and acceptance criteria]
```

### 4. Create Branch

```bash
# For Epic
git checkout main
git checkout -b epic/GAQNO-XXXX-short-description

# For Story (branch from Epic)
git checkout epic/GAQNO-XXXX-parent-epic
git checkout -b feature/GAQNO-YYYY-story-description

# Commits use subtask keys
git commit -m "[GAQNO-ZZZZ] Subtask description

Detailed changes...

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Labels to Use

### Component Labels
- `frontend`
- `backend`
- `@gaqno-frontcore`
- `@gaqno-backcore`
- `gaqno-omnichannel-ui`
- `gaqno-omnichannel-service`

### Type Labels
- `security`
- `testing`
- `refactoring`
- `performance`
- `documentation`
- `accessibility`

### Category Labels
- `authentication`
- `rate-limiting`
- `api`
- `hooks`
- `components`
- `services`
- `database`

### Priority Labels
- `critical`
- `high-priority`
- `tech-debt`
- `code-quality`

---

## Acceptance Criteria Checklist

### For All Stories

- [ ] Code implements all acceptance criteria
- [ ] Tests written and passing (unit + integration)
- [ ] Code coverage meets target (80%+)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] CI pipeline passing
- [ ] No performance regressions

### For Security Stories

- [ ] Security audit passed
- [ ] Penetration testing completed
- [ ] No known vulnerabilities
- [ ] Error handling secure (no info leakage)
- [ ] Logging does not expose sensitive data

### For Frontend Stories

- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Responsive design verified
- [ ] Browser compatibility tested
- [ ] Performance budget met
- [ ] Lighthouse score maintained/improved

### For Backend Stories

- [ ] API documentation updated (Swagger)
- [ ] Database migrations created (if needed)
- [ ] Error handling comprehensive
- [ ] Logging added for debugging
- [ ] Performance benchmarks met

---

## Useful JQL Queries

### View All Code Quality Stories

```jql
project = GAQNO AND labels IN (code-quality, tech-debt) ORDER BY priority DESC, created DESC
```

### View Critical Security Stories

```jql
project = GAQNO AND labels = security AND priority = Critical ORDER BY created DESC
```

### View Stories Ready for Development

```jql
project = GAQNO AND status = "To Do" AND labels IN (code-quality) ORDER BY priority DESC
```

### View Stories In Progress

```jql
project = GAQNO AND status = "Fazendo" AND labels IN (code-quality) ORDER BY updated DESC
```

### View Completed Code Quality Stories

```jql
project = GAQNO AND status = Done AND labels IN (code-quality) ORDER BY resolved DESC
```

---

## Resource Estimates

### Team Size Recommendations

**Minimum Team:**
- 1 Senior Frontend Developer
- 1 Senior Backend Developer
- QA/Testing time allocation

**Optimal Team:**
- 2 Frontend Developers
- 2 Backend Developers
- 1 QA Engineer
- 1 Tech Lead (part-time oversight)

### Time Estimates

**Minimum (Full-time team):**
- Epic 1 (Security): 1 week
- Epics 2-3 (Quality): 4 weeks
- Epics 4-5 (Optimization): 3 weeks
- **Total: 8 weeks (2 months)**

**Realistic (Part-time or smaller team):**
- Epic 1 (Security): 1-2 weeks
- Epics 2-3 (Quality): 6-8 weeks
- Epics 4-5 (Optimization): 4-5 weeks
- **Total: 12-15 weeks (3-4 months)**

---

## Success Metrics

### Code Quality Metrics

| Metric | Current | Target | Epic |
|--------|---------|--------|------|
| Frontend Test Coverage | 0-8% | 80%+ | Epic 2 |
| Backend Test Coverage | ~5% | 80%+ | Epic 3 |
| TypeScript `any` Count | 7+ | 0 | Epic 2 |
| Files >300 Lines | 4+ | 0 | Epic 5 |
| Bundle Size | Baseline | -50% | Epic 4 |
| Lighthouse Performance | Unknown | >90 | Epic 4 |
| API Documentation | 0% | 100% | Epic 3 |
| Security Vulnerabilities | 2 Critical | 0 | Epic 1 |

### Business Impact Metrics

| Metric | Expected Impact |
|--------|----------------|
| Production Incidents | -70% (fewer bugs) |
| Development Speed | +30% (better DX, testing) |
| Onboarding Time | -50% (better docs, tests) |
| Page Load Time | -40% (code splitting) |
| API Response Time | -30% (query optimization) |
| Security Confidence | +100% (proper auth) |

---

## Next Actions

### Immediate (This Week)

1. [ ] Review full document with team
2. [ ] Create Epic 1 (Security) in Jira
3. [ ] Create Stories 1.1 and 1.2 in Jira
4. [ ] Create all Subtasks for Epic 1
5. [ ] Assign Story 1.1 (JWT) to senior backend dev
6. [ ] Create epic branch: `epic/GAQNO-XXXX-security-fixes`
7. [ ] Start work on Subtask 1.1.1 (Install jsonwebtoken)

### This Sprint (Sprint 1)

1. [ ] Complete Epic 1 (Security Fixes)
2. [ ] Deploy security fixes to production
3. [ ] Create Epic 2 (Frontend Quality) in Jira
4. [ ] Create Stories for Sprint 2
5. [ ] Plan Sprint 2 (Frontend Testing Foundation)

### Next Sprint (Sprint 2)

1. [ ] Start Epic 2 (Frontend Quality)
2. [ ] Setup testing infrastructure
3. [ ] Begin writing hook tests
4. [ ] Create Epic 3 (Backend Quality) in Jira

---

## Questions or Issues?

- **Jira Access:** Contact gabriel.aquino@outlook.com
- **Technical Questions:** Review [code-quality-epic-stories.md](./code-quality-epic-stories.md)
- **Workflow Questions:** Review [workspace-workflow.md](./workspace-workflow.md)
- **GitHub Integration:** Review [GITHUB-JIRA-INTEGRATION.md](../GITHUB-JIRA-INTEGRATION.md)

---

**Last Updated:** 2026-02-12
**Document Version:** 1.0
**Status:** Ready for Implementation

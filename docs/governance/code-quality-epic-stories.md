# GAQNO Code Quality & Technical Debt Epic - Jira Stories

**Document Purpose:** Comprehensive Jira story structure for Frontend and Backend code quality improvements based on recent code analysis.

**Date:** 2026-02-12
**Project:** GAQNO
**Context:** Frontend (gaqno-omnichannel-ui, @gaqno-frontcore) and Backend (gaqno-omnichannel-service, @gaqno-backcore) analysis revealed critical issues requiring immediate attention.

---

## Table of Contents

1. [Epic Structure Overview](#epic-structure-overview)
2. [Epic 1: CRITICAL Security Fixes](#epic-1-critical-security-fixes)
3. [Epic 2: Frontend Code Quality & Testing](#epic-2-frontend-code-quality--testing)
4. [Epic 3: Backend Code Quality & Testing](#epic-3-backend-code-quality--testing)
5. [Epic 4: Performance Optimization](#epic-4-performance-optimization)
6. [Epic 5: Code Refactoring & Architecture](#epic-5-code-refactoring--architecture)

---

## Epic Structure Overview

```
EPIC (Parent)
  ├── STORY 1 (Child of Epic)
  │     ├── SUBTASK 1.1 (Child of Story 1)
  │     ├── SUBTASK 1.2 (Child of Story 1)
  │     ├── SUBTASK 1.3 (Child of Story 1)
  │     └── SUBTASK 1.4 (Child of Story 1)
  ├── STORY 2 (Child of Epic)
  │     ├── SUBTASK 2.1 (Child of Story 2)
  │     └── ...
  └── ...
```

**Branch Convention:**
- Epic: `epic/GAQNO-XXXX-description`
- Story: `feature/GAQNO-XXXX-description` (branches from Epic branch)
- Subtask: commits in Story branch with message `[GAQNO-XXXX] description`

---

## Epic 1: CRITICAL Security Fixes

### Epic Details

**Epic Title:** CRITICAL: Security Vulnerabilities in Authentication & API Protection

**Epic Key:** GAQNO-[TBD] (assign next available)

**Priority:** Critical 🔴

**Labels:** `security`, `critical`, `backend`, `authentication`, `rate-limiting`

**Description:**
Critical security vulnerabilities discovered in backend services that expose the platform to unauthorized access and abuse. These issues must be addressed immediately before any production deployment.

**Business Value:**
- Prevents unauthorized access to tenant data
- Protects against token forgery attacks
- Prevents API abuse and DDoS attacks
- Ensures compliance with security standards

**Acceptance Criteria:**
- All JWT tokens properly verified with signature validation
- Rate limiting implemented on all public endpoints
- Security audit passed with no critical vulnerabilities
- Penetration testing completed successfully

**Story Points:** 21

**Sprint:** ASAP / Emergency Sprint

**Dependencies:** None (highest priority)

---

### Story 1.1: Fix JWT Authentication Vulnerability

**Story Title:** Fix Critical JWT Authentication - Implement Proper Token Verification

**Story Key:** GAQNO-[TBD]

**Priority:** Critical 🔴

**Labels:** `security`, `critical`, `authentication`, `jwt`, `backend`

**Description:**
The current JWT authentication middleware only base64 decodes tokens without signature verification. This is a CRITICAL security vulnerability that allows anyone to forge valid tokens and impersonate any user.

**Current Issue:**
```typescript
// File: gaqno-omnichannel-service/src/common/middleware/auth.middleware.ts
// Currently only base64 decodes - NO SIGNATURE VERIFICATION
const [, payload] = token.split('.');
const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
```

**Required Fix:**
- Implement proper JWT signature verification using `jsonwebtoken` library
- Add token expiration checking
- Add token refresh mechanism
- Validate token claims (issuer, audience, etc.)
- Add proper error handling for invalid/expired tokens

**Affected Files:**
- `gaqno-omnichannel-service/src/common/middleware/auth.middleware.ts`
- All services using the same pattern (scan codebase)
- Environment configuration for JWT secrets

**Security Impact:** HIGH - Anyone can forge tokens and access any tenant's data

**Acceptance Criteria:**
- [ ] JWT tokens verified with proper signature validation using jsonwebtoken
- [ ] Token expiration properly checked and enforced
- [ ] Invalid tokens rejected with proper error messages
- [ ] Expired tokens trigger refresh flow
- [ ] Token claims validated (iss, aud, exp, nbf)
- [ ] JWT secret properly configured via environment variables
- [ ] Unit tests cover all edge cases (invalid signature, expired, malformed)
- [ ] Integration tests verify end-to-end authentication flow
- [ ] Security audit confirms vulnerability is fixed

**Story Points:** 8

**Technical Notes:**
```bash
# Install jsonwebtoken
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken

# Environment variables needed
JWT_SECRET=<strong-secret-key>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

#### Subtask 1.1.1: Install and Configure jsonwebtoken Library

**Subtask Title:** Install jsonwebtoken and setup environment configuration

**Priority:** Critical 🔴

**Description:**
Install the jsonwebtoken library and configure environment variables for JWT secret management.

**Tasks:**
1. Install jsonwebtoken and types
2. Add JWT_SECRET to environment variables
3. Add JWT_EXPIRES_IN and JWT_REFRESH_EXPIRES_IN
4. Update .env.example with new variables
5. Document configuration in README

**Acceptance Criteria:**
- [ ] jsonwebtoken installed in package.json
- [ ] Environment variables configured
- [ ] .env.example updated
- [ ] No hardcoded secrets in code

**Story Points:** 1

---

#### Subtask 1.1.2: Implement JWT Signature Verification

**Subtask Title:** Replace base64 decode with proper JWT verification

**Priority:** Critical 🔴

**Description:**
Replace the insecure base64 decode with proper JWT signature verification using jsonwebtoken.verify().

**Tasks:**
1. Import jsonwebtoken
2. Replace base64 decode with jwt.verify()
3. Add proper error handling for verification failures
4. Handle expired tokens separately
5. Validate token claims

**Acceptance Criteria:**
- [ ] jwt.verify() used instead of base64 decode
- [ ] Signature verification enforced
- [ ] Expiration checked automatically
- [ ] Proper error types returned
- [ ] Claims validated (userId, tenantId, roles)

**Story Points:** 2

---

#### Subtask 1.1.3: Add Token Expiration and Refresh Logic

**Subtask Title:** Implement token expiration checking and refresh mechanism

**Priority:** Critical 🔴

**Description:**
Add proper token expiration handling and implement refresh token mechanism.

**Tasks:**
1. Configure token expiration times
2. Add refresh token generation
3. Create refresh endpoint
4. Add refresh token storage/validation
5. Handle token rotation

**Acceptance Criteria:**
- [ ] Access tokens expire after configured time (15m)
- [ ] Refresh tokens generated with longer expiration (7d)
- [ ] Refresh endpoint implemented and secured
- [ ] Token rotation prevents replay attacks
- [ ] Client receives new tokens before expiration

**Story Points:** 3

---

#### Subtask 1.1.4: Add Comprehensive JWT Tests

**Subtask Title:** Write unit and integration tests for JWT authentication

**Priority:** High 🟠

**Description:**
Add comprehensive test coverage for all JWT authentication scenarios including edge cases and attack vectors.

**Tasks:**
1. Unit tests for token verification
2. Tests for expired tokens
3. Tests for invalid signatures
4. Tests for malformed tokens
5. Integration tests for full auth flow
6. Tests for refresh token mechanism

**Acceptance Criteria:**
- [ ] All edge cases covered
- [ ] Attack scenarios tested (forged tokens, replay attacks)
- [ ] 100% code coverage for auth middleware
- [ ] Integration tests verify end-to-end flow
- [ ] Performance tests ensure no degradation

**Story Points:** 2

---

### Story 1.2: Implement Rate Limiting on Public Endpoints

**Story Title:** Add Rate Limiting to Protect Against API Abuse

**Story Key:** GAQNO-[TBD]

**Priority:** Critical 🔴

**Labels:** `security`, `rate-limiting`, `backend`, `api-protection`

**Description:**
Implement rate limiting on all public endpoints to protect against abuse, DDoS attacks, and excessive resource consumption. This is especially critical for AI generation endpoints that consume significant resources.

**Critical Endpoints:**
- `/v1/ai/chat` - AI chat generation
- `/v1/ai/generate` - AI content generation
- `/auth/*` - Authentication endpoints
- `/v1/conversations/*` - Conversation API
- `/v1/transactions/*` - Transaction API

**Technical Approach:**
Use `@nestjs/throttler` with Redis backend for distributed rate limiting.

**Acceptance Criteria:**
- [ ] Rate limiting implemented on all public endpoints
- [ ] Different limits for authenticated vs unauthenticated users
- [ ] AI endpoints have stricter limits
- [ ] Rate limit headers returned (X-RateLimit-*)
- [ ] Proper 429 Too Many Requests responses
- [ ] Redis-based rate limiting for multi-instance support
- [ ] Rate limits configurable via environment
- [ ] Monitoring and alerting for rate limit hits

**Story Points:** 5

---

#### Subtask 1.2.1: Install and Configure @nestjs/throttler

**Subtask Title:** Setup rate limiting infrastructure with @nestjs/throttler and Redis

**Priority:** Critical 🔴

**Description:**
Install and configure the rate limiting infrastructure using @nestjs/throttler with Redis backend for distributed rate limiting across multiple service instances.

**Tasks:**
1. Install @nestjs/throttler and redis dependencies
2. Configure ThrottlerModule with Redis storage
3. Add rate limit configuration to environment
4. Setup different tiers (public, authenticated, premium)
5. Configure monitoring for rate limit hits

**Acceptance Criteria:**
- [ ] @nestjs/throttler installed and configured
- [ ] Redis connection configured for rate limiting
- [ ] Environment variables for rate limits added
- [ ] Multiple rate limit tiers defined
- [ ] Health check includes rate limiter status

**Story Points:** 2

---

#### Subtask 1.2.2: Apply Rate Limiting to AI Endpoints

**Subtask Title:** Protect AI generation endpoints with strict rate limits

**Priority:** Critical 🔴

**Description:**
Apply strict rate limiting to AI generation endpoints (/v1/ai/chat, /v1/ai/generate) to prevent abuse and control resource consumption.

**Tasks:**
1. Add @Throttle() decorator to AI endpoints
2. Configure stricter limits for AI endpoints
3. Add per-user limits for AI requests
4. Add per-tenant limits for AI requests
5. Return proper error messages with retry-after

**Acceptance Criteria:**
- [ ] AI endpoints rate limited
- [ ] Public: 5 requests/min
- [ ] Authenticated: 20 requests/min
- [ ] Premium: 100 requests/min
- [ ] 429 responses include Retry-After header
- [ ] Clear error messages for users

**Story Points:** 2

---

#### Subtask 1.2.3: Apply Rate Limiting to Auth and Public APIs

**Subtask Title:** Protect authentication and conversation endpoints

**Priority:** High 🟠

**Description:**
Apply appropriate rate limiting to authentication endpoints and public APIs to prevent brute force attacks and API abuse.

**Tasks:**
1. Rate limit /auth/login (prevent brute force)
2. Rate limit /auth/register (prevent spam)
3. Rate limit conversation listing endpoints
4. Rate limit transaction endpoints
5. Configure per-IP and per-user limits

**Acceptance Criteria:**
- [ ] Auth endpoints: 5 attempts/min per IP
- [ ] Registration: 3 attempts/hour per IP
- [ ] API endpoints: 100 requests/min authenticated
- [ ] API endpoints: 20 requests/min unauthenticated
- [ ] Proper headers returned (X-RateLimit-*)

**Story Points:** 1

---

#### Subtask 1.2.4: Add Rate Limiting Tests and Monitoring

**Subtask Title:** Test rate limiting and setup monitoring/alerts

**Priority:** High 🟠

**Description:**
Add comprehensive tests for rate limiting and setup monitoring to track rate limit hits and potential abuse.

**Tasks:**
1. Unit tests for rate limiting logic
2. Integration tests hitting rate limits
3. Setup CloudWatch/Datadog metrics
4. Create alerts for excessive rate limit hits
5. Dashboard for rate limit analytics

**Acceptance Criteria:**
- [ ] Tests verify rate limits enforced
- [ ] Tests verify 429 responses
- [ ] Metrics exported to monitoring system
- [ ] Alerts trigger on suspicious patterns
- [ ] Dashboard shows rate limit analytics

**Story Points:** 2

---

## Epic 2: Frontend Code Quality & Testing

### Epic Details

**Epic Title:** Frontend Code Quality - Testing, Type Safety, and Accessibility

**Epic Key:** GAQNO-[TBD]

**Priority:** High 🟠

**Labels:** `frontend`, `testing`, `type-safety`, `accessibility`, `code-quality`

**Description:**
Improve frontend code quality across @gaqno-frontcore and gaqno-omnichannel-ui by adding comprehensive test coverage, fixing type safety issues, and implementing accessibility standards.

**Current State:**
- Test coverage: 0-8% (only 3 test files)
- 37 hooks in @gaqno-frontcore with no tests
- Multiple `any` types compromising type safety
- Missing accessibility features (aria-labels, keyboard navigation)

**Target State:**
- Test coverage: 80%+
- All hooks have unit tests
- Zero `any` types in production code
- WCAG 2.1 AA compliance

**Business Value:**
- Reduced bugs in production
- Faster development with confidence
- Better user experience for accessibility
- Easier onboarding for new developers

**Acceptance Criteria:**
- [ ] Test coverage ≥ 80% for hooks and components
- [ ] All `any` types replaced with proper types
- [ ] Accessibility audit passed
- [ ] CI pipeline enforces quality standards

**Story Points:** 34

---

### Story 2.1: Add Unit Tests for @gaqno-frontcore Hooks

**Story Title:** Implement Comprehensive Unit Tests for All 37 Hooks

**Story Key:** GAQNO-[TBD]

**Priority:** High 🟠

**Labels:** `frontend`, `testing`, `hooks`, `unit-tests`, `@gaqno-frontcore`

**Description:**
Add comprehensive unit tests for all 37 hooks in @gaqno-frontcore package. Currently, the hooks have 0% test coverage, which makes refactoring risky and increases the likelihood of bugs.

**Hooks to Test:**
- API hooks: useApi, useApiClient, useMutation, useQuery
- Auth hooks: useAuth, usePermissions, useSession
- Form hooks: useForm, useFormValidation
- UI hooks: useModal, useToast, useDialog, useSidebar
- State hooks: useLocalStorage, useDebounce, useThrottle
- And 24 more...

**Testing Strategy:**
- Use @testing-library/react-hooks
- Mock external dependencies
- Test success and error cases
- Test edge cases and boundary conditions
- Test cleanup and memory leaks

**Acceptance Criteria:**
- [ ] All 37 hooks have test files
- [ ] Test coverage ≥ 90% for hooks package
- [ ] All edge cases covered
- [ ] Mock strategies documented
- [ ] Tests run in CI pipeline

**Story Points:** 13

---

#### Subtask 2.1.1: Setup Testing Infrastructure for Hooks

**Subtask Title:** Configure testing environment and utilities for hooks

**Priority:** High 🟠

**Description:**
Setup the testing infrastructure with proper dependencies, test utilities, and configuration for testing React hooks.

**Tasks:**
1. Install @testing-library/react-hooks
2. Install @testing-library/jest-dom
3. Configure Jest for @gaqno-frontcore
4. Create test utilities and helpers
5. Create mock factories for common dependencies
6. Setup coverage thresholds in package.json

**Acceptance Criteria:**
- [ ] Testing libraries installed
- [ ] Jest configured with proper setup files
- [ ] Test utilities created and documented
- [ ] Coverage thresholds set (≥80%)
- [ ] npm test runs successfully

**Story Points:** 2

**Files to Create:**
- `@gaqno-frontcore/jest.config.js`
- `@gaqno-frontcore/src/test-utils.ts`
- `@gaqno-frontcore/src/__mocks__/`

---

#### Subtask 2.1.2: Test API and Data Fetching Hooks (Part 1)

**Subtask Title:** Write tests for useApi, useApiClient, useQuery, useMutation

**Priority:** High 🟠

**Description:**
Write comprehensive unit tests for API and data fetching hooks including success, error, loading states, and retry logic.

**Hooks to Test:**
- useApi
- useApiClient
- useQuery
- useMutation

**Test Cases:**
- Successful API calls
- Network errors
- Timeout handling
- Retry logic
- Loading states
- Cache behavior
- Optimistic updates

**Acceptance Criteria:**
- [ ] 4 hook test files created
- [ ] All success paths tested
- [ ] All error scenarios tested
- [ ] Loading states verified
- [ ] 90%+ coverage for these hooks

**Story Points:** 3

---

#### Subtask 2.1.3: Test Authentication and Authorization Hooks (Part 2)

**Subtask Title:** Write tests for useAuth, usePermissions, useSession, useUser

**Priority:** High 🟠

**Description:**
Write comprehensive unit tests for authentication and authorization hooks including token management, permission checks, and session handling.

**Hooks to Test:**
- useAuth
- usePermissions
- useSession
- useUser

**Test Cases:**
- Login/logout flows
- Token refresh
- Permission checks
- Role validation
- Session expiration
- Unauthorized handling

**Acceptance Criteria:**
- [ ] 4 hook test files created
- [ ] Auth flows fully tested
- [ ] Permission logic verified
- [ ] Session management tested
- [ ] 90%+ coverage for these hooks

**Story Points:** 3

---

#### Subtask 2.1.4: Test Form and Validation Hooks (Part 3)

**Subtask Title:** Write tests for useForm, useFormValidation, useFieldArray

**Priority:** High 🟠

**Description:**
Write comprehensive unit tests for form management and validation hooks including field registration, validation, errors, and submission.

**Hooks to Test:**
- useForm
- useFormValidation
- useFieldArray
- useFormState

**Test Cases:**
- Field registration
- Validation rules
- Error handling
- Form submission
- Reset functionality
- Dynamic fields (arrays)

**Acceptance Criteria:**
- [ ] 4 hook test files created
- [ ] Form flows tested
- [ ] Validation logic verified
- [ ] Edge cases covered
- [ ] 90%+ coverage for these hooks

**Story Points:** 3

---

#### Subtask 2.1.5: Test UI State Management Hooks (Part 4)

**Subtask Title:** Write tests for useModal, useToast, useDialog, useSidebar, etc.

**Priority:** Medium 🟡

**Description:**
Write comprehensive unit tests for UI state management hooks including modals, toasts, dialogs, sidebars, and other UI components.

**Hooks to Test:**
- useModal
- useToast
- useDialog
- useSidebar
- useDrawer
- useCollapse

**Test Cases:**
- Open/close state
- Multiple instances
- Z-index management
- Focus management
- Keyboard shortcuts (ESC)
- Animation states

**Acceptance Criteria:**
- [ ] 6+ hook test files created
- [ ] All UI states tested
- [ ] Multiple instance handling verified
- [ ] Accessibility features tested
- [ ] 90%+ coverage for these hooks

**Story Points:** 2

---

### Story 2.2: Fix Type Safety Issues - Remove All `any` Types

**Story Title:** Eliminate All `any` Types and Add Explicit Return Types

**Story Key:** GAQNO-[TBD]

**Priority:** High 🟠

**Labels:** `frontend`, `typescript`, `type-safety`, `code-quality`

**Description:**
Remove all `any` types from the codebase and add explicit return types to all functions and hooks. Currently, there are 7+ instances of `any` in hooks, which defeats TypeScript's type safety benefits.

**Problems with `any`:**
- Loses all type checking
- No autocomplete support
- Hidden bugs not caught by compiler
- Poor developer experience
- Difficult refactoring

**Approach:**
1. Audit all files for `any` types
2. Replace with proper types or generics
3. Add explicit return types to all hooks
4. Use TypeScript strict mode
5. Add ESLint rule to prevent new `any` types

**Acceptance Criteria:**
- [ ] Zero `any` types in production code
- [ ] All hooks have explicit return types
- [ ] All functions have explicit return types
- [ ] TypeScript strict mode enabled
- [ ] ESLint rule enforces no-any
- [ ] CI pipeline fails on `any` types

**Story Points:** 8

---

#### Subtask 2.2.1: Audit Codebase for `any` Types

**Subtask Title:** Scan and document all instances of `any` in the codebase

**Priority:** High 🟠

**Description:**
Perform a comprehensive audit of the codebase to find all instances of `any` types and categorize them by complexity and risk.

**Tasks:**
1. Search for `any` in @gaqno-frontcore
2. Search for `any` in gaqno-omnichannel-ui
3. Document each instance with file and line number
4. Categorize by difficulty (easy/medium/hard to fix)
5. Prioritize by risk/impact

**Acceptance Criteria:**
- [ ] Complete list of all `any` types
- [ ] Each instance documented with context
- [ ] Categorized by difficulty
- [ ] Prioritized by impact
- [ ] Tracking document created

**Story Points:** 1

**Deliverable:** `docs/governance/any-types-audit.md`

---

#### Subtask 2.2.2: Fix `any` Types in Hooks (High Priority)

**Subtask Title:** Replace `any` with proper types in all hooks

**Priority:** High 🟠

**Description:**
Fix all `any` types in hooks by replacing them with proper types or generics. Hooks are high-priority because they're reused across multiple components.

**Tasks:**
1. Fix `any` in API hooks (parameters, responses)
2. Fix `any` in form hooks (values, errors)
3. Fix `any` in state hooks
4. Add generic type parameters where needed
5. Test that types work correctly

**Acceptance Criteria:**
- [ ] All hooks have proper types
- [ ] No `any` in function parameters
- [ ] No `any` in return types
- [ ] Generics used appropriately
- [ ] Type inference works correctly

**Story Points:** 3

---

#### Subtask 2.2.3: Add Explicit Return Types to All Hooks

**Subtask Title:** Add explicit return type annotations to all hooks

**Priority:** Medium 🟡

**Description:**
Add explicit return type annotations to all hooks to improve type safety and developer experience. This also helps catch breaking changes in refactoring.

**Tasks:**
1. Add return types to all hooks in @gaqno-frontcore
2. Use complex types where needed (unions, intersections)
3. Document return types with JSDoc
4. Verify autocomplete works correctly
5. Test with consumer components

**Acceptance Criteria:**
- [ ] All hooks have explicit return types
- [ ] Return types are accurate and complete
- [ ] JSDoc comments added
- [ ] Autocomplete verified
- [ ] No type errors in consumers

**Story Points:** 2

---

#### Subtask 2.2.4: Enable TypeScript Strict Mode and ESLint Rules

**Subtask Title:** Configure TypeScript strict mode and ESLint to prevent `any`

**Priority:** Medium 🟡

**Description:**
Enable TypeScript strict mode and configure ESLint rules to prevent new `any` types from being introduced.

**Tasks:**
1. Enable strict mode in tsconfig.json
2. Fix all strict mode errors
3. Add @typescript-eslint/no-explicit-any rule
4. Configure ESLint to error on `any`
5. Update CI to enforce rules

**Acceptance Criteria:**
- [ ] strict: true in tsconfig.json
- [ ] All strict mode errors fixed
- [ ] ESLint rule configured and passing
- [ ] CI pipeline enforces rules
- [ ] Documentation updated

**Story Points:** 2

---

### Story 2.3: Add Component Tests for Critical UI Components

**Story Title:** Implement Integration Tests for Critical Components

**Story Key:** GAQNO-[TBD]

**Priority:** High 🟠

**Labels:** `frontend`, `testing`, `components`, `integration-tests`

**Description:**
Add integration tests for critical UI components in gaqno-omnichannel-ui, focusing on user interactions, state management, and error handling.

**Critical Components:**
- InboxPage (817 lines - highest priority)
- ConversationList
- MessageThread
- TemplateManager
- ErrorBoundaries

**Testing Strategy:**
- Use @testing-library/react
- Test user interactions (clicks, typing, navigation)
- Test error states and recovery
- Test loading states
- Test accessibility

**Acceptance Criteria:**
- [ ] All critical components have test files
- [ ] User interactions tested
- [ ] Error states verified
- [ ] Loading states tested
- [ ] Accessibility verified in tests
- [ ] Coverage ≥ 70% for components

**Story Points:** 8

---

#### Subtask 2.3.1: Setup Component Testing Infrastructure

**Subtask Title:** Configure testing environment for component integration tests

**Priority:** High 🟠

**Description:**
Setup the testing infrastructure for component integration tests with proper mocks, providers, and utilities.

**Tasks:**
1. Install @testing-library/react
2. Install @testing-library/user-event
3. Create test utilities (render with providers)
4. Create mock factories (API responses, contexts)
5. Configure test environment

**Acceptance Criteria:**
- [ ] Testing libraries installed
- [ ] Test utilities created
- [ ] Mock factories documented
- [ ] Sample test demonstrates setup
- [ ] npm test runs successfully

**Story Points:** 2

---

#### Subtask 2.3.2: Test InboxPage Component

**Subtask Title:** Write integration tests for InboxPage (critical - 817 lines)

**Priority:** High 🟠

**Description:**
Write comprehensive integration tests for the InboxPage component covering all major user flows and interactions.

**Test Cases:**
- Conversation list rendering
- Conversation selection
- Message sending
- Filters and search
- Loading states
- Error states
- Empty states

**Acceptance Criteria:**
- [ ] InboxPage.test.tsx created
- [ ] All major flows tested
- [ ] User interactions verified
- [ ] Error handling tested
- [ ] 70%+ coverage for InboxPage

**Story Points:** 3

---

#### Subtask 2.3.3: Test Template Management Components

**Subtask Title:** Write integration tests for TemplateManager and related components

**Priority:** Medium 🟡

**Description:**
Write integration tests for template management components including creation, preview, and WhatsApp-specific features.

**Test Cases:**
- Template list rendering
- Template creation flow
- WhatsApp preview rendering
- Template validation
- AI suggestions
- Error handling

**Acceptance Criteria:**
- [ ] TemplateManager.test.tsx created
- [ ] Create/edit flows tested
- [ ] Preview functionality verified
- [ ] Validation tested
- [ ] 70%+ coverage

**Story Points:** 2

---

#### Subtask 2.3.4: Test Error Boundaries and Recovery

**Subtask Title:** Write tests for error boundaries and error recovery flows

**Priority:** Medium 🟡

**Description:**
Write integration tests for error boundaries to ensure proper error catching, display, and recovery without full page reload.

**Test Cases:**
- Error boundary catches errors
- Error UI displays correctly
- Retry button works
- Different error types handled
- Logging to error service

**Acceptance Criteria:**
- [ ] ErrorBoundary.test.tsx created
- [ ] Error catching verified
- [ ] Recovery flows tested
- [ ] Different error types tested
- [ ] 90%+ coverage

**Story Points:** 1

---

### Story 2.4: Implement E2E Tests for Critical User Flows

**Story Title:** Add End-to-End Tests for Key User Journeys

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `testing`, `e2e`, `playwright`

**Description:**
Add end-to-end tests using Playwright to cover critical user journeys across the application. E2E tests provide confidence that the full stack works together.

**Critical Flows:**
- User login → inbox → send message
- Create and manage templates
- Search and filter conversations
- Assign conversations to agents
- Error recovery flows

**Testing Strategy:**
- Use Playwright for E2E testing
- Run against real backend (test environment)
- Test on multiple browsers (Chrome, Firefox, Safari)
- Include mobile viewport testing
- Run in CI pipeline

**Acceptance Criteria:**
- [ ] Playwright configured
- [ ] 5+ critical flows have E2E tests
- [ ] Tests run in CI
- [ ] Tests run on multiple browsers
- [ ] Video recordings on failure

**Story Points:** 5

---

#### Subtask 2.4.1: Setup Playwright E2E Testing Infrastructure

**Subtask Title:** Install and configure Playwright for E2E testing

**Priority:** Medium 🟡

**Description:**
Setup Playwright E2E testing infrastructure with proper configuration, utilities, and CI integration.

**Tasks:**
1. Install Playwright and dependencies
2. Configure playwright.config.ts
3. Setup test environment configuration
4. Create page object models
5. Configure CI integration

**Acceptance Criteria:**
- [ ] Playwright installed
- [ ] Configuration complete
- [ ] Base URL configured
- [ ] Sample test passes
- [ ] CI pipeline runs tests

**Story Points:** 2

---

#### Subtask 2.4.2: Write E2E Test for Login and Inbox Flow

**Subtask Title:** Test complete flow: login → inbox → view conversation → send message

**Priority:** Medium 🟡

**Description:**
Write E2E test covering the most critical user journey: logging in, viewing inbox, selecting a conversation, and sending a message.

**Test Steps:**
1. Navigate to login page
2. Enter credentials and login
3. Verify redirect to inbox
4. Load conversations
5. Select a conversation
6. Type and send a message
7. Verify message appears

**Acceptance Criteria:**
- [ ] E2E test file created
- [ ] Full flow tested
- [ ] Assertions verify success
- [ ] Screenshots on failure
- [ ] Runs in CI

**Story Points:** 2

---

#### Subtask 2.4.3: Write E2E Test for Template Management

**Subtask Title:** Test template creation and preview flow

**Priority:** Low 🟢

**Description:**
Write E2E test for creating a WhatsApp template, previewing it, and verifying AI suggestions.

**Test Steps:**
1. Navigate to templates
2. Click create template
3. Fill in template details
4. Preview WhatsApp appearance
5. Use AI suggestions
6. Save template
7. Verify template in list

**Acceptance Criteria:**
- [ ] E2E test file created
- [ ] Create flow tested
- [ ] Preview verified
- [ ] AI suggestions tested
- [ ] Runs in CI

**Story Points:** 1

---

### Story 2.5: Implement Accessibility (A11y) Features

**Story Title:** Add Accessibility Features for WCAG 2.1 AA Compliance

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `accessibility`, `a11y`, `wcag`

**Description:**
Implement accessibility features to ensure WCAG 2.1 AA compliance, making the application usable for people with disabilities.

**Current Issues:**
- Missing aria-labels on icon buttons
- No keyboard navigation in InboxPage
- No focus management in dialogs
- Missing alt text on images
- Poor color contrast in some areas

**Target:**
- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader friendly
- Proper focus management

**Acceptance Criteria:**
- [ ] All interactive elements keyboard accessible
- [ ] All images have alt text
- [ ] All buttons have aria-labels
- [ ] Focus management in modals/dialogs
- [ ] Color contrast ≥ 4.5:1
- [ ] Screen reader tested
- [ ] Automated accessibility tests passing

**Story Points:** 8

---

#### Subtask 2.5.1: Audit Current Accessibility Issues

**Subtask Title:** Run automated accessibility audit and document issues

**Priority:** Medium 🟡

**Description:**
Run automated accessibility audits using axe-core and Lighthouse to identify all accessibility issues.

**Tasks:**
1. Install axe-core devtools
2. Run audit on all major pages
3. Run Lighthouse accessibility audit
4. Document all issues with severity
5. Categorize by WCAG success criteria
6. Prioritize fixes

**Acceptance Criteria:**
- [ ] Automated audits completed
- [ ] All issues documented
- [ ] Categorized by severity
- [ ] Prioritized fix list created
- [ ] Tracking document created

**Story Points:** 1

**Deliverable:** `docs/governance/accessibility-audit.md`

---

#### Subtask 2.5.2: Add aria-labels and Semantic HTML

**Subtask Title:** Add missing aria-labels and improve semantic HTML

**Priority:** Medium 🟡

**Description:**
Add aria-labels to all icon buttons and interactive elements, and improve semantic HTML structure throughout the application.

**Tasks:**
1. Add aria-labels to all icon buttons
2. Add aria-labels to form controls
3. Use semantic HTML (nav, main, aside, article)
4. Add landmark roles
5. Add aria-live regions for dynamic content

**Acceptance Criteria:**
- [ ] All icon buttons have aria-labels
- [ ] All forms properly labeled
- [ ] Semantic HTML used
- [ ] Landmarks defined
- [ ] Screen reader friendly

**Story Points:** 2

---

#### Subtask 2.5.3: Implement Keyboard Navigation

**Subtask Title:** Add full keyboard navigation support to InboxPage and components

**Priority:** Medium 🟡

**Description:**
Implement comprehensive keyboard navigation throughout the application, especially in complex components like InboxPage.

**Tasks:**
1. Add keyboard handlers to conversation list
2. Add arrow key navigation
3. Add Enter/Space for selection
4. Add Escape for closing dialogs
5. Add Tab order management
6. Add skip links

**Acceptance Criteria:**
- [ ] All features keyboard accessible
- [ ] Arrow keys navigate lists
- [ ] Enter/Space activate buttons
- [ ] Escape closes dialogs
- [ ] Tab order logical
- [ ] Skip links implemented

**Story Points:** 3

---

#### Subtask 2.5.4: Implement Focus Management

**Subtask Title:** Add proper focus management for dialogs and modals

**Priority:** Medium 🟡

**Description:**
Implement proper focus management for modals, dialogs, and dynamic content to ensure keyboard users can navigate effectively.

**Tasks:**
1. Focus trap in modals/dialogs
2. Return focus on close
3. Focus first element on open
4. Focus new dynamic content
5. Clear focus indicators (outline)

**Acceptance Criteria:**
- [ ] Focus trapped in dialogs
- [ ] Focus returns on close
- [ ] First element focused on open
- [ ] Visible focus indicators
- [ ] Keyboard users can navigate

**Story Points:** 2

---

## Epic 3: Backend Code Quality & Testing

### Epic Details

**Epic Title:** Backend Code Quality - Testing, Architecture, and Documentation

**Epic Key:** GAQNO-[TBD]

**Priority:** High 🟠

**Labels:** `backend`, `testing`, `architecture`, `code-quality`, `documentation`

**Description:**
Improve backend code quality across gaqno-omnichannel-service and @gaqno-backcore by adding comprehensive test coverage, extracting common code, refactoring services, and adding API documentation.

**Current State:**
- Test coverage: ~5%
- Most services have 0 tests
- Large services (459 lines) need refactoring
- Duplicated code across services
- No API documentation (Swagger)

**Target State:**
- Test coverage: 80%+
- All services have unit tests
- Fat services refactored into smaller services
- Common code extracted to @gaqno-backcore
- Complete API documentation

**Business Value:**
- Reduced bugs in production
- Faster development with confidence
- Easier onboarding for new developers
- Better API discoverability
- Maintainable codebase

**Acceptance Criteria:**
- [ ] Test coverage ≥ 80% for services
- [ ] All services refactored to <300 lines
- [ ] Common code in @gaqno-backcore
- [ ] Swagger/OpenAPI documentation complete
- [ ] CI pipeline enforces quality standards

**Story Points:** 55

---

### Story 3.1: Add Unit Tests for Critical Services

**Story Title:** Implement Comprehensive Unit Tests for Services with 0% Coverage

**Story Key:** GAQNO-[TBD]

**Priority:** High 🟠

**Labels:** `backend`, `testing`, `unit-tests`, `services`

**Description:**
Add comprehensive unit tests for critical services that currently have 0% test coverage. Focus on business logic, error handling, and edge cases.

**Services to Test:**
- ConversationsService (459 lines, 0 tests) - CRITICAL
- TransactionsService (209 lines, 0 tests) - HIGH
- AIService (467 lines, 2 trivial tests) - HIGH
- TemplatesService - MEDIUM
- UsersService - MEDIUM

**Testing Strategy:**
- Use Jest + @nestjs/testing
- Mock external dependencies (DB, APIs)
- Test success and error paths
- Test validation logic
- Test business rules
- Test edge cases

**Acceptance Criteria:**
- [ ] All critical services have test files
- [ ] Test coverage ≥ 85% for services
- [ ] All business logic tested
- [ ] All error paths tested
- [ ] Mock strategies documented
- [ ] Tests run in CI pipeline

**Story Points:** 21

---

#### Subtask 3.1.1: Setup Testing Infrastructure for Services

**Subtask Title:** Configure NestJS testing module and utilities

**Priority:** High 🟠

**Description:**
Setup the testing infrastructure for NestJS services with proper mocks, test utilities, and configuration.

**Tasks:**
1. Verify @nestjs/testing is installed
2. Create test utilities module
3. Create mock factories (repositories, external APIs)
4. Create test database setup/teardown
5. Configure coverage thresholds

**Acceptance Criteria:**
- [ ] Testing module configured
- [ ] Test utilities created
- [ ] Mock factories documented
- [ ] Coverage thresholds set (≥80%)
- [ ] npm test runs successfully

**Story Points:** 2

**Files to Create:**
- `gaqno-omnichannel-service/test/test-utils.ts`
- `gaqno-omnichannel-service/test/mocks/`
- `gaqno-omnichannel-service/jest-e2e.json`

---

#### Subtask 3.1.2: Test ConversationsService (Part 1 - CRUD)

**Subtask Title:** Write unit tests for ConversationsService CRUD operations

**Priority:** High 🟠

**Description:**
Write comprehensive unit tests for ConversationsService CRUD operations (create, read, update, delete conversations).

**Test Cases:**
- Create conversation with valid data
- Create conversation with invalid data
- Find conversations with filters
- Find conversation by ID
- Update conversation
- Delete conversation
- Multi-tenancy isolation
- Pagination

**Acceptance Criteria:**
- [ ] conversations.service.spec.ts created
- [ ] All CRUD operations tested
- [ ] Validation tested
- [ ] Multi-tenancy verified
- [ ] 85%+ coverage for CRUD methods

**Story Points:** 3

---

#### Subtask 3.1.3: Test ConversationsService (Part 2 - Business Logic)

**Subtask Title:** Write unit tests for conversation assignment and messaging logic

**Priority:** High 🟠

**Description:**
Write comprehensive unit tests for ConversationsService business logic including assignment, status changes, and messaging.

**Test Cases:**
- Assign conversation to agent
- Change conversation status
- Send message in conversation
- Mark conversation as read
- Archive conversation
- Transfer conversation
- Bulk operations

**Acceptance Criteria:**
- [ ] Business logic fully tested
- [ ] Assignment rules verified
- [ ] Status transitions tested
- [ ] Error handling verified
- [ ] 85%+ coverage for business methods

**Story Points:** 4

---

#### Subtask 3.1.4: Test TransactionsService

**Subtask Title:** Write unit tests for TransactionsService

**Priority:** High 🟠

**Description:**
Write comprehensive unit tests for TransactionsService covering all transaction operations and business rules.

**Test Cases:**
- Create transaction
- Process transaction
- Validate transaction data
- Calculate totals
- Handle transaction errors
- Multi-tenancy isolation
- Transaction history

**Acceptance Criteria:**
- [ ] transactions.service.spec.ts created
- [ ] All operations tested
- [ ] Business rules verified
- [ ] Error handling tested
- [ ] 85%+ coverage

**Story Points:** 3

---

#### Subtask 3.1.5: Test AIService

**Subtask Title:** Write comprehensive unit tests for AIService (upgrade from 2 trivial tests)

**Priority:** High 🟠

**Description:**
Write comprehensive unit tests for AIService replacing the 2 trivial tests with real coverage of AI generation, validation, and error handling.

**Test Cases:**
- Generate AI chat response
- Generate AI content
- Handle API failures
- Rate limiting
- Token usage tracking
- Prompt validation
- Response formatting
- Streaming responses

**Acceptance Criteria:**
- [ ] ai.service.spec.ts enhanced
- [ ] All AI operations tested
- [ ] External API mocked
- [ ] Error handling verified
- [ ] 85%+ coverage

**Story Points:** 4

---

#### Subtask 3.1.6: Add Integration Tests for Controller Flows

**Subtask Title:** Write integration tests for end-to-end controller flows

**Priority:** Medium 🟡

**Description:**
Write integration tests that test complete flows from controller to service to database, ensuring the full stack works together.

**Test Cases:**
- Complete conversation creation flow
- Authentication flow
- Message sending flow
- Template management flow
- Error propagation

**Acceptance Criteria:**
- [ ] Integration test files created
- [ ] Full flows tested
- [ ] Database operations verified
- [ ] Error handling tested
- [ ] 70%+ coverage for controllers

**Story Points:** 5

---

### Story 3.2: Extract Common Code to @gaqno-backcore

**Story Title:** Extract Duplicated Code to Shared @gaqno-backcore Package

**Story Key:** GAQNO-[TBD]

**Priority:** High 🟠

**Labels:** `backend`, `refactoring`, `code-reuse`, `@gaqno-backcore`

**Description:**
Extract common code that is duplicated across multiple backend services into the shared @gaqno-backcore package. This reduces duplication, ensures consistency, and makes updates easier.

**Code to Extract:**
- HttpExceptionFilter (duplicated in 4 services)
- Authentication middleware (after JWT fix)
- CORS configuration
- ValidationPipe setup
- Logger configuration
- Database utilities
- Common decorators

**Benefits:**
- Single source of truth
- Consistent error handling
- Easier updates
- Smaller service codebases
- Better testability

**Acceptance Criteria:**
- [ ] All duplicated code identified
- [ ] Code extracted to @gaqno-backcore
- [ ] All services updated to use @gaqno-backcore
- [ ] Tests verify functionality
- [ ] Documentation updated

**Story Points:** 13

---

#### Subtask 3.2.1: Audit Duplicated Code Across Services

**Subtask Title:** Identify all duplicated code patterns across backend services

**Priority:** High 🟠

**Description:**
Perform a comprehensive audit of all backend services to identify duplicated code patterns that should be extracted to @gaqno-backcore.

**Tasks:**
1. Search for duplicated filters
2. Search for duplicated middleware
3. Search for duplicated guards
4. Search for duplicated decorators
5. Search for duplicated utilities
6. Document each pattern with usage count

**Acceptance Criteria:**
- [ ] Complete list of duplicated code
- [ ] Each pattern documented
- [ ] Usage count for each pattern
- [ ] Prioritized extraction list
- [ ] Tracking document created

**Story Points:** 2

**Deliverable:** `docs/governance/backcore-extraction-plan.md`

---

#### Subtask 3.2.2: Extract and Test HttpExceptionFilter

**Subtask Title:** Move HttpExceptionFilter to @gaqno-backcore

**Priority:** High 🟠

**Description:**
Extract the HttpExceptionFilter that is duplicated in 4 services into @gaqno-backcore with proper tests and documentation.

**Tasks:**
1. Create http-exception.filter.ts in @gaqno-backcore
2. Add comprehensive tests
3. Update all services to import from @gaqno-backcore
4. Remove local implementations
5. Verify error handling works
6. Document usage

**Acceptance Criteria:**
- [ ] Filter in @gaqno-backcore
- [ ] Tests added (90%+ coverage)
- [ ] All services updated
- [ ] Local implementations removed
- [ ] Documentation complete

**Story Points:** 3

---

#### Subtask 3.2.3: Extract Authentication Middleware to @gaqno-backcore

**Subtask Title:** Move authentication middleware to shared package (after JWT fix)

**Priority:** High 🟠

**Description:**
Extract the authentication middleware (after JWT security fix) to @gaqno-backcore so all services use the same secure implementation.

**Dependencies:** Blocked by Story 1.1 (JWT Authentication Fix)

**Tasks:**
1. Create auth.middleware.ts in @gaqno-backcore
2. Add comprehensive tests
3. Update all services to import from @gaqno-backcore
4. Remove local implementations
5. Document usage

**Acceptance Criteria:**
- [ ] Middleware in @gaqno-backcore
- [ ] Tests added (90%+ coverage)
- [ ] All services updated
- [ ] Local implementations removed
- [ ] Security verified

**Story Points:** 3

---

#### Subtask 3.2.4: Extract CORS and Validation Configuration

**Subtask Title:** Move CORS and ValidationPipe configuration to @gaqno-backcore

**Priority:** Medium 🟡

**Description:**
Extract common CORS and ValidationPipe configurations to @gaqno-backcore to ensure consistency across all services.

**Tasks:**
1. Create cors.config.ts in @gaqno-backcore
2. Create validation.config.ts
3. Add environment-based configuration
4. Update all services
5. Document configuration options

**Acceptance Criteria:**
- [ ] Configs in @gaqno-backcore
- [ ] Environment-based setup
- [ ] All services updated
- [ ] Documentation complete
- [ ] Security verified (CORS)

**Story Points:** 2

---

#### Subtask 3.2.5: Extract Common Decorators and Utilities

**Subtask Title:** Move common decorators and utilities to @gaqno-backcore

**Priority:** Medium 🟡

**Description:**
Extract common decorators (CurrentUser, Roles, etc.) and utilities to @gaqno-backcore.

**Tasks:**
1. Create decorators directory
2. Create utils directory
3. Move common decorators
4. Move common utilities
5. Add tests
6. Update services

**Acceptance Criteria:**
- [ ] Decorators in @gaqno-backcore
- [ ] Utilities in @gaqno-backcore
- [ ] Tests added
- [ ] All services updated
- [ ] Documentation complete

**Story Points:** 3

---

### Story 3.3: Refactor Fat Services into Smaller Services

**Story Title:** Refactor Large Services (>300 lines) into Focused Services

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `backend`, `refactoring`, `architecture`, `services`

**Description:**
Refactor large services that exceed 300 lines into smaller, focused services following single responsibility principle. This improves maintainability, testability, and code clarity.

**Services to Refactor:**
- ConversationsService (459 lines) → split into 3 services
- AIService (467 lines) → split into 2-3 services
- Other services >300 lines

**Refactoring Strategy:**
- Identify distinct responsibilities
- Create new focused services
- Extract business logic from controllers
- Maintain backward compatibility
- Update tests accordingly

**Acceptance Criteria:**
- [ ] No service exceeds 300 lines
- [ ] Single responsibility maintained
- [ ] All tests passing
- [ ] No regressions
- [ ] Documentation updated

**Story Points:** 13

---

#### Subtask 3.3.1: Analyze and Plan Service Splitting

**Subtask Title:** Analyze large services and create refactoring plan

**Priority:** Medium 🟡

**Description:**
Analyze ConversationsService (459 lines) and other large services to identify distinct responsibilities and plan the splitting strategy.

**Tasks:**
1. Analyze ConversationsService responsibilities
2. Identify split points (CRUD, assignment, messaging)
3. Analyze AIService responsibilities
4. Create refactoring plan
5. Identify dependencies

**Acceptance Criteria:**
- [ ] Responsibilities identified
- [ ] Split plan documented
- [ ] Dependencies mapped
- [ ] Backward compatibility plan
- [ ] Tracking document created

**Story Points:** 2

**Deliverable:** `docs/governance/service-refactoring-plan.md`

---

#### Subtask 3.3.2: Split ConversationsService - Create CRUD Service

**Subtask Title:** Extract CRUD operations to ConversationsCrudService

**Priority:** Medium 🟡

**Description:**
Extract basic CRUD operations from ConversationsService into a new focused ConversationsCrudService.

**Responsibilities:**
- create()
- findAll()
- findOne()
- update()
- remove()
- Basic validation

**Tasks:**
1. Create ConversationsCrudService
2. Move CRUD methods
3. Update tests
4. Update ConversationsService to use new service
5. Verify functionality

**Acceptance Criteria:**
- [ ] ConversationsCrudService created
- [ ] CRUD methods moved
- [ ] Tests updated and passing
- [ ] Original service updated
- [ ] No regressions

**Story Points:** 3

---

#### Subtask 3.3.3: Split ConversationsService - Create Assignment Service

**Subtask Title:** Extract assignment logic to ConversationsAssignmentService

**Priority:** Medium 🟡

**Description:**
Extract conversation assignment and routing logic from ConversationsService into a new focused ConversationsAssignmentService.

**Responsibilities:**
- assignToAgent()
- assignToTeam()
- autoAssign()
- transferConversation()
- Assignment rules

**Tasks:**
1. Create ConversationsAssignmentService
2. Move assignment methods
3. Update tests
4. Update ConversationsService
5. Verify business rules

**Acceptance Criteria:**
- [ ] ConversationsAssignmentService created
- [ ] Assignment methods moved
- [ ] Tests updated and passing
- [ ] Business rules verified
- [ ] No regressions

**Story Points:** 3

---

#### Subtask 3.3.4: Split ConversationsService - Create Messaging Service

**Subtask Title:** Extract messaging logic to ConversationsMessagingService

**Priority:** Medium 🟡

**Description:**
Extract messaging and communication logic from ConversationsService into a new focused ConversationsMessagingService.

**Responsibilities:**
- sendMessage()
- receiveMessage()
- markAsRead()
- Message validation
- Delivery status

**Tasks:**
1. Create ConversationsMessagingService
2. Move messaging methods
3. Update tests
4. Update ConversationsService
5. Verify message flows

**Acceptance Criteria:**
- [ ] ConversationsMessagingService created
- [ ] Messaging methods moved
- [ ] Tests updated and passing
- [ ] Message flows verified
- [ ] No regressions

**Story Points:** 3

---

#### Subtask 3.3.5: Refactor AIService

**Subtask Title:** Split AIService into focused services

**Priority:** Low 🟢

**Description:**
Split AIService (467 lines) into focused services for chat, content generation, and prompt management.

**New Services:**
- AIChatService (chat operations)
- AIContentService (content generation)
- AIPromptService (prompt management)

**Tasks:**
1. Analyze AIService responsibilities
2. Create new focused services
3. Move methods appropriately
4. Update tests
5. Verify functionality

**Acceptance Criteria:**
- [ ] AIService split into 2-3 services
- [ ] Each service <200 lines
- [ ] Tests updated and passing
- [ ] No regressions
- [ ] Documentation updated

**Story Points:** 2

---

### Story 3.4: Fix N+1 Query Issues and Add Database Indexes

**Story Title:** Optimize Database Queries and Add Missing Indexes

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `backend`, `performance`, `database`, `optimization`

**Description:**
Fix N+1 query issues in conversation listing and other endpoints, and add proper database indexes to improve query performance.

**Current Issues:**
- Conversation listing causes N+1 queries
- Missing indexes on frequently queried columns
- Inefficient pagination implementation
- Slow queries on large datasets

**Target:**
- Eliminate all N+1 queries
- Add indexes on (tenantId, status, updatedAt)
- Implement cursor-based pagination
- Query time <100ms for common operations

**Acceptance Criteria:**
- [ ] No N+1 queries detected
- [ ] Indexes added on key columns
- [ ] Cursor-based pagination implemented
- [ ] Query performance improved by 80%+
- [ ] Performance tests added

**Story Points:** 8

---

#### Subtask 3.4.1: Audit Database Queries for N+1 Issues

**Subtask Title:** Identify all N+1 query patterns in the codebase

**Priority:** Medium 🟡

**Description:**
Audit all database queries to identify N+1 query patterns, especially in list endpoints and relationship loading.

**Tasks:**
1. Enable query logging
2. Test all list endpoints
3. Document N+1 patterns
4. Profile slow queries
5. Prioritize fixes by impact

**Acceptance Criteria:**
- [ ] All N+1 patterns documented
- [ ] Slow queries profiled
- [ ] Impact assessment complete
- [ ] Prioritized fix list
- [ ] Tracking document created

**Story Points:** 2

**Deliverable:** `docs/governance/n-plus-one-audit.md`

---

#### Subtask 3.4.2: Fix N+1 in Conversation Listing

**Subtask Title:** Optimize conversation listing with proper joins

**Priority:** Medium 🟡

**Description:**
Fix N+1 query issue in conversation listing by implementing proper joins and eager loading.

**Tasks:**
1. Add findAll with relations
2. Use QueryBuilder with joins
3. Add select specific fields
4. Test query performance
5. Verify results unchanged

**Acceptance Criteria:**
- [ ] N+1 eliminated
- [ ] Single query with joins
- [ ] Performance improved 80%+
- [ ] Tests verify correctness
- [ ] No regressions

**Story Points:** 2

---

#### Subtask 3.4.3: Add Database Indexes

**Subtask Title:** Add indexes on (tenantId, status, updatedAt) and other key columns

**Priority:** Medium 🟡

**Description:**
Add proper database indexes on frequently queried columns to improve query performance.

**Indexes to Add:**
- conversations: (tenantId, status, updatedAt)
- conversations: (tenantId, assignedTo)
- messages: (conversationId, createdAt)
- templates: (tenantId, status)

**Tasks:**
1. Create migration for indexes
2. Add composite indexes
3. Test query performance
4. Monitor index usage
5. Document index strategy

**Acceptance Criteria:**
- [ ] Migrations created
- [ ] Indexes added
- [ ] Performance improved
- [ ] Index usage monitored
- [ ] Documentation updated

**Story Points:** 2

---

#### Subtask 3.4.4: Implement Cursor-Based Pagination

**Subtask Title:** Replace offset pagination with cursor-based pagination

**Priority:** Medium 🟡

**Description:**
Implement cursor-based pagination for better performance on large datasets and consistent results during concurrent updates.

**Tasks:**
1. Design cursor structure
2. Implement cursor encoding/decoding
3. Update findAll methods
4. Update DTOs
5. Update API documentation

**Acceptance Criteria:**
- [ ] Cursor pagination implemented
- [ ] Performance better than offset
- [ ] Consistent results
- [ ] Backward compatible
- [ ] Documentation updated

**Story Points:** 2

---

### Story 3.5: Add API Documentation with Swagger/OpenAPI

**Story Title:** Implement Comprehensive API Documentation with Swagger

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `backend`, `documentation`, `api`, `swagger`, `openapi`

**Description:**
Add comprehensive API documentation using Swagger/OpenAPI to improve developer experience and API discoverability.

**Current State:**
- No API documentation
- Developers need to read code
- No API playground for testing
- Unclear request/response formats

**Target:**
- Complete Swagger documentation
- All endpoints documented
- Request/response examples
- Authentication documented
- Interactive API playground

**Acceptance Criteria:**
- [ ] Swagger UI accessible at /api/docs
- [ ] All endpoints documented
- [ ] All DTOs documented
- [ ] Authentication flow documented
- [ ] Request/response examples included
- [ ] OpenAPI spec exportable

**Story Points:** 8

---

#### Subtask 3.5.1: Setup Swagger/OpenAPI Infrastructure

**Subtask Title:** Install and configure @nestjs/swagger

**Priority:** Medium 🟡

**Description:**
Install and configure Swagger/OpenAPI infrastructure with NestJS swagger module.

**Tasks:**
1. Install @nestjs/swagger
2. Configure SwaggerModule in main.ts
3. Setup document options
4. Configure authentication
5. Test /api/docs endpoint

**Acceptance Criteria:**
- [ ] @nestjs/swagger installed
- [ ] Swagger UI accessible
- [ ] Basic configuration complete
- [ ] Authentication configured
- [ ] Endpoint accessible

**Story Points:** 2

---

#### Subtask 3.5.2: Document All Controllers with @Api Decorators

**Subtask Title:** Add Swagger decorators to all controllers

**Priority:** Medium 🟡

**Description:**
Add Swagger decorators (@ApiTags, @ApiOperation, @ApiResponse) to all controllers to document endpoints.

**Controllers to Document:**
- ConversationsController
- MessagesController
- TemplatesController
- UsersController
- AuthController
- AIController

**Tasks:**
1. Add @ApiTags to group endpoints
2. Add @ApiOperation for descriptions
3. Add @ApiResponse for status codes
4. Add @ApiBearerAuth for auth
5. Verify in Swagger UI

**Acceptance Criteria:**
- [ ] All controllers have @ApiTags
- [ ] All endpoints have @ApiOperation
- [ ] All responses documented
- [ ] Auth requirements documented
- [ ] Swagger UI displays correctly

**Story Points:** 3

---

#### Subtask 3.5.3: Document All DTOs with @ApiProperty

**Subtask Title:** Add Swagger decorators to all DTOs

**Priority:** Medium 🟡

**Description:**
Add Swagger decorators (@ApiProperty) to all DTOs to document request/response schemas.

**DTOs to Document:**
- CreateConversationDto
- UpdateConversationDto
- MessageDto
- TemplateDto
- UserDto
- All other DTOs

**Tasks:**
1. Add @ApiProperty to all DTO fields
2. Add descriptions
3. Add examples
4. Add validation rules
5. Verify in Swagger UI

**Acceptance Criteria:**
- [ ] All DTOs have @ApiProperty
- [ ] All fields described
- [ ] Examples provided
- [ ] Validation rules shown
- [ ] Schemas display correctly

**Story Points:** 2

---

#### Subtask 3.5.4: Add Request/Response Examples

**Subtask Title:** Add realistic examples for all endpoints

**Priority:** Low 🟢

**Description:**
Add realistic request/response examples to all endpoints to help developers understand API usage.

**Tasks:**
1. Create example requests
2. Create example responses
3. Add to @ApiOperation
4. Add error examples
5. Test in Swagger UI

**Acceptance Criteria:**
- [ ] All endpoints have examples
- [ ] Examples are realistic
- [ ] Error examples included
- [ ] Testable in Swagger UI
- [ ] Documentation complete

**Story Points:** 1

---

## Epic 4: Performance Optimization

### Epic Details

**Epic Title:** Frontend Performance Optimization - Code Splitting, Memoization, and Virtualization

**Epic Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `performance`, `optimization`, `code-splitting`

**Description:**
Optimize frontend performance through code splitting, React memoization, list virtualization, and lazy loading to improve load times and runtime performance.

**Current Issues:**
- No code splitting - large bundle size
- No React.memo on list items - unnecessary re-renders
- No list virtualization - poor performance with many items
- Missing useMemo/useCallback - expensive recalculations

**Target:**
- Initial bundle size reduced by 50%
- First Contentful Paint <1.5s
- Time to Interactive <3s
- 60fps during scrolling
- Lighthouse Performance score >90

**Business Value:**
- Faster page loads
- Better user experience
- Lower bandwidth costs
- Better mobile performance
- Improved SEO

**Acceptance Criteria:**
- [ ] Code splitting on all routes
- [ ] React.memo on list components
- [ ] Virtualization on large lists
- [ ] Lighthouse score >90
- [ ] No performance regressions

**Story Points:** 21

---

### Story 4.1: Implement Code Splitting with React.lazy

**Story Title:** Add Code Splitting to All Routes and Large Components

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `performance`, `code-splitting`, `lazy-loading`

**Description:**
Implement code splitting using React.lazy and dynamic imports to reduce initial bundle size and improve load times.

**Components to Split:**
- All route components
- Large components (InboxPage, TemplateManager)
- Heavy libraries (charts, editors)
- Feature modules

**Expected Impact:**
- Initial bundle: -50%
- First load: -40%
- Time to interactive: -30%

**Acceptance Criteria:**
- [ ] All routes use React.lazy
- [ ] Suspense boundaries added
- [ ] Loading states implemented
- [ ] Bundle size reduced by 50%
- [ ] No loading flashes
- [ ] Performance tested

**Story Points:** 8

---

#### Subtask 4.1.1: Setup Code Splitting Infrastructure

**Subtask Title:** Configure webpack/vite for code splitting and add Suspense boundaries

**Priority:** Medium 🟡

**Description:**
Configure build tool for optimal code splitting and add Suspense boundaries throughout the application.

**Tasks:**
1. Configure webpack/vite for code splitting
2. Create Suspense loading component
3. Add top-level Suspense boundary
4. Create error boundaries for chunks
5. Test chunk loading

**Acceptance Criteria:**
- [ ] Build tool configured
- [ ] Suspense component created
- [ ] Boundaries added
- [ ] Error handling works
- [ ] Chunks load correctly

**Story Points:** 2

---

#### Subtask 4.1.2: Implement Lazy Loading for All Routes

**Subtask Title:** Convert all route imports to React.lazy

**Priority:** Medium 🟡

**Description:**
Convert all route component imports to use React.lazy for automatic code splitting by route.

**Routes to Convert:**
- /inbox
- /templates
- /settings
- /analytics
- All other routes

**Tasks:**
1. Convert imports to React.lazy
2. Add Suspense per route
3. Add loading states
4. Test navigation
5. Measure bundle reduction

**Acceptance Criteria:**
- [ ] All routes lazy loaded
- [ ] Suspense on each route
- [ ] Loading states smooth
- [ ] Navigation works
- [ ] Bundle reduced

**Story Points:** 2

---

#### Subtask 4.1.3: Lazy Load Large Components

**Subtask Title:** Apply lazy loading to InboxPage, TemplateManager, and other large components

**Priority:** Medium 🟡

**Description:**
Apply lazy loading to large components that are not always visible (modals, panels, editors).

**Components to Lazy Load:**
- TemplateEditor
- RichTextEditor
- ChartComponents
- VideoPlayer
- Heavy modals

**Tasks:**
1. Identify large components
2. Convert to React.lazy
3. Add Suspense boundaries
4. Test component loading
5. Measure improvements

**Acceptance Criteria:**
- [ ] Large components lazy loaded
- [ ] Loading states implemented
- [ ] No UI flashes
- [ ] Performance improved
- [ ] Bundle size reduced

**Story Points:** 2

---

#### Subtask 4.1.4: Optimize Third-Party Library Loading

**Subtask Title:** Lazy load heavy third-party libraries

**Priority:** Low 🟢

**Description:**
Lazy load heavy third-party libraries that are not needed on initial page load.

**Libraries to Optimize:**
- Chart libraries
- Rich text editors
- Date pickers
- PDF viewers
- Other heavy deps

**Tasks:**
1. Audit third-party imports
2. Convert to dynamic imports
3. Add loading fallbacks
4. Test functionality
5. Measure bundle reduction

**Acceptance Criteria:**
- [ ] Heavy libs lazy loaded
- [ ] Functionality preserved
- [ ] Loading smooth
- [ ] Bundle significantly reduced
- [ ] Performance improved

**Story Points:** 2

---

### Story 4.2: Optimize React Rendering with Memo and Callbacks

**Story Title:** Add React.memo, useMemo, and useCallback to Prevent Unnecessary Re-renders

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `performance`, `react`, `optimization`

**Description:**
Optimize React rendering by adding React.memo to list items, useMemo for expensive computations, and useCallback for event handlers to prevent unnecessary re-renders.

**Current Issues:**
- List items re-render on every parent update
- Expensive calculations run on every render
- New function instances cause child re-renders
- Poor performance with large lists

**Target:**
- 80% reduction in unnecessary re-renders
- Smooth 60fps during interactions
- No janky scrolling

**Acceptance Criteria:**
- [ ] React.memo on all list items
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers
- [ ] React DevTools Profiler shows improvements
- [ ] No performance regressions

**Story Points:** 8

---

#### Subtask 4.2.1: Audit Components for Unnecessary Re-renders

**Subtask Title:** Profile components and identify re-render hotspots

**Priority:** Medium 🟡

**Description:**
Use React DevTools Profiler to identify components that re-render unnecessarily and document optimization opportunities.

**Tasks:**
1. Profile InboxPage interactions
2. Profile conversation list scrolling
3. Profile template management
4. Document re-render causes
5. Prioritize optimizations

**Acceptance Criteria:**
- [ ] Profiling complete
- [ ] Hotspots identified
- [ ] Re-render causes documented
- [ ] Prioritized optimization list
- [ ] Tracking document created

**Story Points:** 2

**Deliverable:** `docs/governance/react-optimization-plan.md`

---

#### Subtask 4.2.2: Add React.memo to List Item Components

**Subtask Title:** Wrap list items with React.memo to prevent unnecessary re-renders

**Priority:** Medium 🟡

**Description:**
Add React.memo to all list item components in conversation list, template list, and other lists.

**Components to Optimize:**
- ConversationListItem
- TemplateListItem
- MessageItem
- UserListItem
- All other list items

**Tasks:**
1. Wrap components with React.memo
2. Add custom comparison functions if needed
3. Test re-render behavior
4. Verify functionality
5. Measure improvements

**Acceptance Criteria:**
- [ ] All list items use React.memo
- [ ] Re-renders reduced by 80%+
- [ ] Functionality preserved
- [ ] Profiler shows improvements
- [ ] Scrolling smooth

**Story Points:** 2

---

#### Subtask 4.2.3: Add useMemo for Expensive Computations

**Subtask Title:** Wrap expensive calculations with useMemo

**Priority:** Medium 🟡

**Description:**
Identify expensive calculations and wrap them with useMemo to prevent recalculation on every render.

**Calculations to Optimize:**
- Filtering and sorting lists
- Computing statistics
- Parsing and formatting data
- Complex transformations

**Tasks:**
1. Identify expensive calculations
2. Wrap with useMemo
3. Define dependency arrays
4. Test correctness
5. Measure performance

**Acceptance Criteria:**
- [ ] Expensive calculations use useMemo
- [ ] Dependency arrays correct
- [ ] Calculations only when needed
- [ ] Performance improved
- [ ] No stale data bugs

**Story Points:** 2

---

#### Subtask 4.2.4: Add useCallback for Event Handlers

**Subtask Title:** Wrap event handlers with useCallback

**Priority:** Medium 🟡

**Description:**
Wrap event handlers with useCallback to prevent new function instances and unnecessary child re-renders.

**Handlers to Optimize:**
- Click handlers
- Change handlers
- Submit handlers
- Scroll handlers

**Tasks:**
1. Identify event handlers
2. Wrap with useCallback
3. Define dependency arrays
4. Test functionality
5. Verify re-render reduction

**Acceptance Criteria:**
- [ ] Event handlers use useCallback
- [ ] Dependency arrays correct
- [ ] Child re-renders reduced
- [ ] Functionality preserved
- [ ] Profiler shows improvements

**Story Points:** 2

---

### Story 4.3: Implement List Virtualization

**Story Title:** Add Virtual Scrolling to Conversation and Template Lists

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `performance`, `virtualization`, `lists`

**Description:**
Implement list virtualization using react-virtual or react-window to render only visible items and improve performance with large lists.

**Lists to Virtualize:**
- Conversation list (can have 1000+ items)
- Template list
- Message thread
- Search results

**Expected Impact:**
- Initial render: 90% faster for large lists
- Memory usage: 80% reduction
- Smooth 60fps scrolling

**Acceptance Criteria:**
- [ ] react-virtual installed and configured
- [ ] Conversation list virtualized
- [ ] Template list virtualized
- [ ] Smooth scrolling with 1000+ items
- [ ] Memory usage significantly reduced
- [ ] Accessibility preserved

**Story Points:** 5

---

#### Subtask 4.3.1: Install and Configure react-virtual

**Subtask Title:** Setup react-virtual library and utilities

**Priority:** Medium 🟡

**Description:**
Install react-virtual library and create utilities for virtual list implementation.

**Tasks:**
1. Install @tanstack/react-virtual
2. Create VirtualList component wrapper
3. Create utilities for item measurement
4. Test basic virtualization
5. Document usage

**Acceptance Criteria:**
- [ ] Library installed
- [ ] VirtualList component created
- [ ] Utilities documented
- [ ] Sample working
- [ ] No accessibility issues

**Story Points:** 2

---

#### Subtask 4.3.2: Virtualize Conversation List

**Subtask Title:** Implement virtual scrolling for conversation list in InboxPage

**Priority:** Medium 🟡

**Description:**
Implement virtual scrolling for the conversation list to handle 1000+ conversations smoothly.

**Tasks:**
1. Wrap ConversationList with VirtualList
2. Configure item sizes
3. Handle dynamic heights
4. Test with 1000+ items
5. Verify selection works

**Acceptance Criteria:**
- [ ] Conversation list virtualized
- [ ] Smooth scrolling
- [ ] Selection works
- [ ] Keyboard navigation preserved
- [ ] Performance excellent

**Story Points:** 2

---

#### Subtask 4.3.3: Virtualize Template List and Message Thread

**Subtask Title:** Add virtualization to template list and message thread

**Priority:** Low 🟢

**Description:**
Add virtualization to template list and message thread components for better performance with many items.

**Tasks:**
1. Virtualize template list
2. Virtualize message thread
3. Handle dynamic heights
4. Test with large datasets
5. Verify functionality

**Acceptance Criteria:**
- [ ] Template list virtualized
- [ ] Message thread virtualized
- [ ] Smooth scrolling
- [ ] Functionality preserved
- [ ] Performance improved

**Story Points:** 1

---

## Epic 5: Code Refactoring & Architecture

### Epic Details

**Epic Title:** Code Refactoring - Split Large Files and Improve Architecture

**Epic Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `backend`, `refactoring`, `architecture`, `code-quality`

**Description:**
Refactor large files and improve code architecture by splitting monolithic components and hooks into smaller, focused modules.

**Current Issues:**
- InboxPage.tsx: 817 lines (too large)
- useInboxPage.ts: 548 lines (too large)
- Mixed concerns in single files
- Difficult to maintain and test

**Target:**
- No file exceeds 300 lines
- Single responsibility per file
- Clear separation of concerns
- Improved testability

**Acceptance Criteria:**
- [ ] All files <300 lines
- [ ] Clear module boundaries
- [ ] Tests updated and passing
- [ ] No functionality regressions
- [ ] Documentation updated

**Story Points:** 13

---

### Story 5.1: Split InboxPage.tsx into Sub-components

**Story Title:** Refactor InboxPage (817 lines) into Focused Sub-components

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `refactoring`, `components`

**Description:**
Split the 817-line InboxPage.tsx into smaller, focused sub-components following single responsibility principle.

**Refactoring Plan:**
```
InboxPage (817 lines) →
  ├── InboxPage.tsx (main layout, ~100 lines)
  ├── ConversationList.tsx (~150 lines)
  ├── ConversationView.tsx (~150 lines)
  ├── InboxHeader.tsx (~100 lines)
  ├── InboxSidebar.tsx (~100 lines)
  ├── InboxFilters.tsx (~100 lines)
  └── InboxEmptyState.tsx (~50 lines)
```

**Acceptance Criteria:**
- [ ] InboxPage split into 7+ components
- [ ] Each component <200 lines
- [ ] Clear props interfaces
- [ ] Tests updated and passing
- [ ] No functionality changes
- [ ] Documentation updated

**Story Points:** 8

---

#### Subtask 5.1.1: Analyze and Plan InboxPage Splitting

**Subtask Title:** Analyze InboxPage structure and create refactoring plan

**Priority:** Medium 🟡

**Description:**
Analyze the 817-line InboxPage.tsx to identify logical component boundaries and create a detailed refactoring plan.

**Tasks:**
1. Analyze component structure
2. Identify logical boundaries
3. Map component responsibilities
4. Plan props interfaces
5. Document refactoring steps

**Acceptance Criteria:**
- [ ] Component boundaries identified
- [ ] Responsibilities mapped
- [ ] Props interfaces designed
- [ ] Refactoring plan documented
- [ ] Tracking document created

**Story Points:** 2

**Deliverable:** `docs/governance/inbox-refactoring-plan.md`

---

#### Subtask 5.1.2: Extract ConversationList Component

**Subtask Title:** Extract conversation list logic into separate component

**Priority:** Medium 🟡

**Description:**
Extract conversation list rendering and logic from InboxPage into a focused ConversationList component.

**Tasks:**
1. Create ConversationList.tsx
2. Move conversation list JSX
3. Move related state and handlers
4. Define props interface
5. Update InboxPage to use new component
6. Update tests

**Acceptance Criteria:**
- [ ] ConversationList component created
- [ ] Logic moved correctly
- [ ] Props interface clear
- [ ] Tests updated
- [ ] No regressions

**Story Points:** 2

---

#### Subtask 5.1.3: Extract ConversationView Component

**Subtask Title:** Extract conversation view logic into separate component

**Priority:** Medium 🟡

**Description:**
Extract conversation view (messages, input, etc.) from InboxPage into a focused ConversationView component.

**Tasks:**
1. Create ConversationView.tsx
2. Move conversation view JSX
3. Move related state and handlers
4. Define props interface
5. Update InboxPage
6. Update tests

**Acceptance Criteria:**
- [ ] ConversationView component created
- [ ] Logic moved correctly
- [ ] Props interface clear
- [ ] Tests updated
- [ ] No regressions

**Story Points:** 2

---

#### Subtask 5.1.4: Extract Header, Sidebar, and Filters

**Subtask Title:** Extract InboxHeader, InboxSidebar, and InboxFilters components

**Priority:** Medium 🟡

**Description:**
Extract header, sidebar, and filters into separate focused components.

**Tasks:**
1. Create InboxHeader.tsx
2. Create InboxSidebar.tsx
3. Create InboxFilters.tsx
4. Move respective JSX
5. Define props interfaces
6. Update InboxPage
7. Update tests

**Acceptance Criteria:**
- [ ] 3 new components created
- [ ] Logic moved correctly
- [ ] Props interfaces clear
- [ ] InboxPage now ~100 lines
- [ ] Tests updated
- [ ] No regressions

**Story Points:** 2

---

### Story 5.2: Split useInboxPage Hook into Smaller Hooks

**Story Title:** Refactor useInboxPage (548 lines) into Focused Hooks

**Story Key:** GAQNO-[TBD]

**Priority:** Medium 🟡

**Labels:** `frontend`, `refactoring`, `hooks`

**Description:**
Split the 548-line useInboxPage.ts hook into smaller, focused hooks following single responsibility principle.

**Refactoring Plan:**
```
useInboxPage (548 lines) →
  ├── useInboxPage.ts (orchestrator, ~100 lines)
  ├── useConversationList.ts (~100 lines)
  ├── useConversationSelection.ts (~80 lines)
  ├── useInboxFilters.ts (~80 lines)
  ├── useMessageHandling.ts (~100 lines)
  └── useInboxState.ts (~80 lines)
```

**Acceptance Criteria:**
- [ ] useInboxPage split into 5+ hooks
- [ ] Each hook <150 lines
- [ ] Clear responsibilities
- [ ] Tests updated and passing
- [ ] No functionality changes
- [ ] Documentation updated

**Story Points:** 5

---

#### Subtask 5.2.1: Analyze and Plan useInboxPage Splitting

**Subtask Title:** Analyze hook structure and create refactoring plan

**Priority:** Medium 🟡

**Description:**
Analyze the 548-line useInboxPage.ts to identify logical boundaries and create a detailed refactoring plan.

**Tasks:**
1. Analyze hook structure
2. Identify concerns
3. Map hook responsibilities
4. Plan hook interfaces
5. Document refactoring steps

**Acceptance Criteria:**
- [ ] Concerns identified
- [ ] Responsibilities mapped
- [ ] Interfaces designed
- [ ] Refactoring plan documented
- [ ] Tracking document created

**Story Points:** 1

---

#### Subtask 5.2.2: Extract Conversation List and Selection Hooks

**Subtask Title:** Extract useConversationList and useConversationSelection

**Priority:** Medium 🟡

**Description:**
Extract conversation list management and selection logic into separate focused hooks.

**Tasks:**
1. Create useConversationList.ts
2. Create useConversationSelection.ts
3. Move related logic
4. Define return types
5. Update useInboxPage
6. Update tests

**Acceptance Criteria:**
- [ ] 2 new hooks created
- [ ] Logic moved correctly
- [ ] Return types clear
- [ ] Tests updated
- [ ] No regressions

**Story Points:** 2

---

#### Subtask 5.2.3: Extract Filters and Message Handling Hooks

**Subtask Title:** Extract useInboxFilters and useMessageHandling

**Priority:** Medium 🟡

**Description:**
Extract filter logic and message handling into separate focused hooks.

**Tasks:**
1. Create useInboxFilters.ts
2. Create useMessageHandling.ts
3. Move related logic
4. Define return types
5. Update useInboxPage
6. Update tests

**Acceptance Criteria:**
- [ ] 2 new hooks created
- [ ] Logic moved correctly
- [ ] Return types clear
- [ ] useInboxPage now ~100 lines
- [ ] Tests updated
- [ ] No regressions

**Story Points:** 2

---

## Summary

### Epic Overview

| Epic | Priority | Story Points | Stories | Subtasks |
|------|----------|-------------|---------|----------|
| Epic 1: CRITICAL Security Fixes | 🔴 Critical | 21 | 2 | 8 |
| Epic 2: Frontend Code Quality | 🟠 High | 34 | 5 | 20 |
| Epic 3: Backend Code Quality | 🟠 High | 55 | 5 | 24 |
| Epic 4: Performance Optimization | 🟡 Medium | 21 | 3 | 12 |
| Epic 5: Code Refactoring | 🟡 Medium | 13 | 2 | 8 |
| **TOTAL** | | **144** | **17** | **72** |

### Priority Breakdown

- **Critical (Epic 1):** Must be completed immediately before any production deployment
- **High (Epics 2-3):** Should be completed in next 2-3 sprints
- **Medium (Epics 4-5):** Should be completed in following 2-3 sprints

### Recommended Sprint Planning

**Sprint 1 (Emergency):** Epic 1 - Security Fixes (21 points)
- Story 1.1: JWT Authentication Fix
- Story 1.2: Rate Limiting

**Sprint 2-3:** Epic 2 - Frontend Testing (34 points)
- Story 2.1: Hook Tests
- Story 2.2: Type Safety
- Story 2.3: Component Tests

**Sprint 4-5:** Epic 3 - Backend Quality (55 points)
- Story 3.1: Service Tests
- Story 3.2: Extract to @gaqno-backcore
- Story 3.3: Refactor Services

**Sprint 6:** Epic 4 - Performance (21 points)
- Story 4.1: Code Splitting
- Story 4.2: React Optimization
- Story 4.3: Virtualization

**Sprint 7:** Epic 5 - Refactoring (13 points)
- Story 5.1: Split InboxPage
- Story 5.2: Split useInboxPage

---

## Creating Stories in Jira

### Step-by-Step Process

1. **Create Epic in Jira**
   - Project: GAQNO
   - Issue Type: Epic
   - Copy Epic Title and Description from this document
   - Set Priority, Labels, and Story Points
   - Note the Epic Key (e.g., GAQNO-1400)

2. **Create Stories under Epic**
   - Issue Type: Story
   - Link to Epic: GAQNO-XXXX
   - Copy Story Title and Description
   - Set Priority, Labels, Story Points
   - Add Acceptance Criteria to Description
   - Note the Story Key (e.g., GAQNO-1401)

3. **Create Subtasks under Story**
   - Issue Type: Sub-task
   - Parent Issue: GAQNO-XXXX (Story)
   - Copy Subtask Title and Description
   - Set Priority and Story Points
   - Add Tasks and Acceptance Criteria

4. **Create Branches**
   - Epic: `epic/GAQNO-1400-security-fixes`
   - Story: `feature/GAQNO-1401-jwt-authentication` (branch from Epic)
   - Commits: Use subtask keys in messages

### Labels to Use

- **Component:** `frontend`, `backend`, `@gaqno-frontcore`, `@gaqno-backcore`
- **Type:** `security`, `testing`, `refactoring`, `performance`, `documentation`
- **Category:** `authentication`, `api`, `hooks`, `components`, `services`
- **Priority:** `critical`, `high-priority`, `tech-debt`

---

## Next Steps

1. **Review this document** with the team
2. **Prioritize** which Epics to tackle first
3. **Create Epics in Jira** using next available keys
4. **Create Stories and Subtasks** for first sprint
5. **Assign** stories to team members
6. **Create branches** following naming conventions
7. **Start work** on Epic 1 (Security) immediately

---

**Document Maintenance:**
- Update this document as stories are completed
- Link actual Jira ticket keys once created
- Track progress and update estimates
- Document lessons learned

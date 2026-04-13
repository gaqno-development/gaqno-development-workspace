# Copilot Instructions for gaqno Development

AI agents working in this codebase should understand these patterns before making changes.

## Architecture at a Glance

**gaqno** is a **multi-tenant SaaS for SMBs**, structured as a monorepo orchestrated with **npm workspaces + Turborepo**, where each service is a **git submodule** with independent CI/CD:

- **Shell-UI** (React Module Federation host, port 3000) routes to domain MFEs
- **14+ NestJS backend services** (ports 4001–4016) handle domain logic
- **Shared packages**: `@gaqno-types` (interfaces), `@gaqno-frontcore` (React components/hooks), `@gaqno-backcore` (NestJS utilities)
- **Tech stack**: React 18, NestJS, Drizzle ORM, PostgreSQL, BullMQ, TypeScript (strict), Vitest, Jest, Playwright
- **Deployment**: Docker on Dokploy, Cloudflare DNS/tunnels/R2, GitHub Actions CI

See `CLAUDE.md` for full architecture diagram and deployment details.

## Critical Conventions (Non-Negotiable)

### Coding Standards

1. **Language split**: Portuguese for user-facing strings, English for code/variables/commits
2. **No `any` types** — strict TypeScript everywhere
3. **No comments** — self-explanatory names only; if code needs a comment, refactor it
4. **Max 200 lines per file, 20 lines per function**
5. **DRY principle**: Shared types → `@gaqno-types`, shared logic → `@gaqno-frontcore` or `@gaqno-backcore`
6. **Immutability first**: `readonly`, `const`, pure functions
7. **TDD mandatory**: Red-Green-Refactor for all business logic

### Backend (NestJS) Pattern

```
Controller → Service → Repository/Drizzle → PostgreSQL
  ↓            ↓           ↓
Thin routing  All logic   Type-safe queries
HTTP mapping  Unit tests  Migrations in src/database/migrations/
Validation    Single      Drizzle schema in src/database/schema/
via DTO       responsibility
```

- **Controllers**: HTTP mapping + DTO validation only; delegate all business logic to services
- **DTOs**: Use `class-validator` decorators; separate create/update DTOs
- **Services**: All business rules; fully unit-testable; inject dependencies via constructor
- **Modules**: Feature-based; clear boundaries; export services for cross-module use
- **Testing**: Unit tests for all services (Jest); no business logic without failing test first

### Frontend (React/MFE) Pattern

```
Pages (composition) ← Hooks (business logic) ← Components (presentation)
   ↓
Assemble hooks      All state, API calls   Prop-only, no logic
and components      type-safe              Pure functions
                    naming: use[Domain][Action]
                    EVERY hook must have tests
```

- **Components**: Purely presentational; no business logic; import UI from `@gaqno-frontcore/components/ui`
- **Hooks**: Named `use[Domain][Action]` (e.g., `useUserProfile`, `useAuthLogin`); all business logic here; all hooks must have unit tests
- **MFE isolation**: No direct imports between MFEs; shared code only via `@gaqno-frontcore`
- **Pages**: Composition only — assemble hooks and components
- **Testing**: Vitest for all frontends + shared packages; test files colocated (`.spec.tsx`)

## Essential Workflows

### Local Development

```bash
npm run install:all              # Install all workspace deps (one-time)
npm run dev                      # Start everything via Turborepo (~25 services)
npm run dev:shell               # Just shell-ui (port 3000)
npm run dev:sso-service         # Just SSO backend (port 4001)
npm run dev:backends            # All backends only
npm run dev:frontends           # All frontends only
```

### Building & Pushing

```bash
# BUILD: Always use build-all.sh with explicit project names
./build-all.sh gaqno-admin-service gaqno-admin-ui
./build-all.sh --no-cache gaqno-sso-service    # Clear cache if needed

# PUSH: Never push repos individually; always use push-all.sh
./push-all.sh                                    # Auto-generates commit messages
./push-all.sh "feat(costs): add CRUD endpoints" # Custom message for all repos

# PUBLISH shared packages after version bump
npm run release:packages         # Publishes all changed packages
npm run publish:frontcore        # Individual package publish
```

### Testing

| Type | Runner | Command |
|------|--------|---------|
| NestJS services | Jest | `npx jest` or `npm test` |
| React frontends | Vitest | `npx vitest` or `npm test` |
| Shared packages | Vitest | `npx vitest` or `npm test` |
| E2E (shell-ui) | Playwright | `npx playwright test` |

**Pre-commit hooks enforce tests**; never use `--no-verify` to skip them. Fix failing tests before committing.

### Common Tasks

**Add a backend endpoint**:
1. Create/update module in `src/<feature>/`
2. Add DTO(s) in `src/<feature>/dto/` with `class-validator`
3. Implement service method (all business logic + DB)
4. Add controller route (thin — delegates to service)
5. Write unit tests in `*.spec.ts`
6. Build: `./build-all.sh <service-name>`

**Add a frontend page**:
1. Create component in `src/pages/<PageName>.tsx`
2. Create hook(s) in `src/hooks/` for business logic
3. Register route in MFE router config
4. Use shared UI from `@gaqno-frontcore/components/ui`
5. Write hook tests; components tested via hook tests

**Add a shared type**:
1. Define interface in `@gaqno-types/src/<domain>/`
2. Re-export from `@gaqno-types/src/index.ts`
3. Bump version in `@gaqno-types/package.json`
4. Run `npm run release:packages`

## Key Files & Directories

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Full architecture, tech stack, env vars, MCP servers |
| `turbo.json` | Turborepo task graph (dev, build, test, lint) |
| `package.json` | Workspace scripts + all 37 packages listed |
| `build-all.sh` | Docker builder for named projects |
| `push-all.sh` | Sequential commit/push across submodules |
| `.windsurf/rules/` | 8 Windsurf rules (auto-continue, backend, frontend, design-system, etc.) |
| `@gaqno-frontcore/src/` | Shared React components (shadcn/ui), hooks, configs |
| `@gaqno-backcore/src/` | Shared NestJS guards, filters, base services, CORS |
| `@gaqno-types/src/` | Shared TypeScript interfaces across all packages |
| `docker-compose.yml` | Local dev stack (PostgreSQL, Redis, etc.) |
| `.env.example` | Environment template |
| `.env.ai-platform.example` | AI services env template |

## Design System Principles (Non-Negotiable)

- **Action > Decoration**: Every element serves clarity, status, urgency, or productivity
- **3-level hierarchy max**: Primary (main action) → Secondary (filters) → Supporting (meta)
- **Dark-first UI**: 4 surface layers by elevation, not borders
- **Semantic colors only**: Green (open), Amber (waiting), Red (overdue), Muted (closed)
- **8pt grid spacing**: Use only 8, 16, 24, 32, 48 (Tailwind: `p-2`, `p-4`, `p-6`, `p-8`, `p-12`)
- **Button variants**: Primary (filled brand), Secondary (outline), Ghost (text-only) only

## Performance Optimization (Critical)

### Bundle Management
- **CSS code splitting disabled**: All MFEs use `cssCodeSplit: false` in `vite.config.ts` for consistent styling
- **React.lazy for routes**: Use `React.lazy()` for all page components in MFEs (see `gaqno-intelligence-ui/src/App.tsx`)
- **MFE chunk isolation**: Each MFE loads independently; shell-ui lazy-loads MFEs via Module Federation

### Frontend Performance
- **useMemo extensively**: All complex computations in hooks use `useMemo` (see `useInboxConversationList.ts`, `useFlowEditor.ts`, `useOmnichannelView.tsx`)
- **Query caching**: React Query with manual cache updates for real-time features (see `useInboxSocket.ts` for manual cache updates on WebSocket events)
- **Component memoization**: Pure components with stable props; avoid unnecessary re-renders through prop stability
- **Stable references**: Use `useCallback` for event handlers passed as props; use `useMemo` for expensive computations and derived data
- **Query key optimization**: Include all dependencies in query keys for proper cache invalidation (see conversation list filtering)

### Backend Performance
- **Pagination mandatory**: All list endpoints use `limit`/`offset` (default limit: 50, see `products.service.ts`)
- **Database indexes**: Tenant-based indexes on all multi-tenant tables (see `erp-service/src/database/schema.ts`)
- **Query optimization**: Drizzle ORM with explicit selects; avoid N+1 queries
- **Redis for cache**: Session data, temporary state; BullMQ for background jobs

### Image & Asset Optimization
- **Cloudflare R2**: All static assets served via Cloudflare for global CDN
- **Lazy loading**: Images and heavy components loaded on demand
- **Bundle analysis**: Monitor chunk sizes; keep MFEs under 2MB initial load

### Monitoring & Metrics
- **New Relic**: Application performance monitoring on all services
- **Grafana**: Real-time dashboards for system metrics
- **Response time targets**: API responses <200ms, page loads <3s

## Git & Commit Workflow

- **Conventional commits**: `feat(scope): description`, `fix(scope): description`
- **Commit message max**: 100 characters for first line
- **Each submodule**: Its own GitHub repo with own CI pipelines
- **Main branch**: Commits go directly (no PR requirement unless Jira workflow used)
- **Submodule tracking**: Parent repo tracks commit hashes; `push-all.sh` updates these

## Auto-Continue Principle

When implementing multi-phase plans:
1. **Never ask user to continue** — proceed autonomously through all phases
2. **Work without interruption** until entire task is complete
3. **Update progress** (todo list) after each phase
4. **Only stop** for true blockers requiring user input

This accelerates feature work and refactoring when scope is clear.

## Integration Points & External Systems

- **Atlassian Jira MCP**: Ticket management, hierarchy validation
- **Dokploy MCP**: Deployment management
- **Cloudflare MCP**: DNS, tunnel, R2 bucket management
- **Grafana MCP**: Dashboard queries, Prometheus/Loki, alerting
- **n8n MCP**: Workflow automation
- **Mercado Pago**: Payment integration (gaqno-finance-service)
- **New Relic**: Application monitoring
- **shadcn MCP**: UI component management

## Quick Reference: Project Structure

```
gaqno-development-workspace (monorepo root)
├── @gaqno-frontcore/          # Shared React (components, hooks, configs)
├── @gaqno-backcore/           # Shared NestJS (guards, base services)
├── @gaqno-types/              # Shared TypeScript interfaces
├── @gaqno-agent/              # OpenClaw configuration
├── gaqno-shell-ui/            # Module Federation host (port 3000)
├── gaqno-sso-service/         # Auth backend (port 4001)
├── gaqno-admin-ui/            # Admin MFE (port 3010)
├── gaqno-crm-service/         # CRM backend (port 4003)
├── gaqno-ai-service/          # AI backend (port 4002)
└── [29+ more services/UIs]    # Each following the same pattern

Key workflow files at root:
├── build-all.sh               # Docker builder
├── push-all.sh                # Commit/push orchestrator
├── publish-packages.sh        # Shared package publisher
├── turbo.json                 # Task graph
└── .github/workflows/         # CI/CD pipelines
```

---

**Last updated**: April 2026. See CLAUDE.md and .windsurf/rules/ for latest patterns.

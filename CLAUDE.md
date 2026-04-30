# CLAUDE.md — gaqno Development Workspace

## Project Overview

gaqno is a multi-tenant SaaS platform for SMBs. The architecture is a monorepo of **git submodules** orchestrated with **npm workspaces + Turborepo**. Each submodule is its own GitHub repository with independent CI/CD.

- **Organization:** github.com/gaqno-development
- **Production domain:** `*.gaqno.com.br`
- **NPM scope:** `@gaqno-development/*`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend services | NestJS, TypeScript, Drizzle ORM, PostgreSQL, BullMQ, class-validator |
| Frontend MFEs | React 18, Vite, Module Federation, TailwindCSS, shadcn/ui, React Query |
| Landing page | Next.js (App Router) |
| Testing | Jest (services), Vitest (frontends + shared libs), Playwright (shell-ui E2E) |
| Infra | Docker, Dokploy, Cloudflare (DNS/tunnels/R2), GitHub Actions |
| Monitoring | Grafana, New Relic, Prometheus |
| Package manager | npm 11 with workspaces |

## Architecture

```
Browser → shell-ui (Module Federation host, port 3000)
            ├── sso-ui      (auth MFE, 3001)
            ├── ai-ui       (AI tools, 3002)
            ├── crm-ui      (CRM, 3003)
            ├── erp-ui      (ERP, 3005)
            ├── finance-ui  (finance, 3006)
            ├── pdv-ui      (POS, 3006)
            ├── admin-ui    (admin panel, 3010)
            ├── omnichannel-ui (messaging, 3011)
            ├── wellness-ui (wellness, 3012)
            ├── intelligence-ui (BI, 3013)
            └── docs-ui     (docs, 3020)

API calls → SSO service (4001) proxies to domain services:
            ├── ai-service          (4002)
            ├── crm-service         (4003)
            ├── erp-service         (4004)
            ├── finance-service     (4005)
            ├── pdv-service         (4006)
            ├── rpg-service         (4007)
            ├── omnichannel-service (4008)
            ├── admin-service       (4010)
            ├── wellness-service    (4011)
            ├── lead-enrichment     (4012)
            ├── customer-service    (4013)
            ├── intelligence        (4014)
            ├── consumer-service    (4015)
            └── dropshipping       (4016)

Other frontends (standalone):
            ├── landing-ui      (Next.js, 3009)
            ├── dropshipping-ui (Next.js, 3014)
            └── lenin-ui        (Nuxt 3, 3000)
```

## Shared Packages

| Package | npm name | Purpose |
|---------|----------|---------|
| `@gaqno-frontcore` | `@gaqno-development/frontcore` | React components (shadcn/ui), hooks, Vite/Tailwind/ESLint configs, Module Federation helpers, i18n |
| `@gaqno-backcore` | `@gaqno-development/backcore` | NestJS guards/filters/interceptors, base CRUD service, CORS config, messaging, encryption |
| `@gaqno-types` | `@gaqno-development/types` | Shared TypeScript interfaces and types across all services and frontends |
| `@gaqno-agent` | `@gaqno-development/gaqno-agent` | OpenClaw configuration and workspace assets |

When changing any shared package: bump the version in its `package.json` (semver), then run `npm run release:packages` from the workspace root.

## Coding Conventions

### General
- **Language:** Portuguese for all user-facing strings; English for code, variables, and commit messages.
- **No comments in code.** Names must be self-explanatory. If code needs a comment, refactor it.
- **No `any` type.** Full strict TypeScript everywhere.
- **Max 200 lines per file, 20 lines per function.**
- **DRY:** Shared types in `@gaqno-types`, shared logic in `@gaqno-frontcore` or `@gaqno-backcore`.
- **Immutability:** Prefer `readonly`, `const`, and pure functions.

### Backend (NestJS)
- **Controllers:** Thin routing layer only. Handle HTTP mapping and delegate to services.
- **Services:** All business logic. Fully unit-testable. Single responsibility.
- **DTOs:** `class-validator` decorators. Separate create/update DTOs.
- **Modules:** Feature-based. Import only what is needed; export services for cross-module use.
- **Database:** Drizzle ORM with PostgreSQL. Migrations in `src/database/migrations/`.

### Frontend (React / MFE)
- **Components:** Purely presentational. No business logic.
- **Hooks:** All business logic. Naming: `use[Domain][Action]` (e.g. `useUserProfile`). Every hook must have tests.
- **Pages:** Composition only — assemble hooks and components.
- **MFE isolation:** No direct imports between MFEs. Shared code only via `@gaqno-frontcore`.
- **UI components:** Always import from `@gaqno-development/frontcore/components/ui`. Never import directly from `@radix-ui/*`.

### TDD (Mandatory)
- Follow Red-Green-Refactor rigorously.
- No business logic without a failing test first.
- Tests serve as documentation (`it('should ...')` describes behavior).

## Build and Deploy

### Docker builds
```bash
# Build specific projects (REQUIRED — never run without args)
./build-all.sh gaqno-admin-service gaqno-admin-ui

# With clean cache
./build-all.sh --no-cache gaqno-sso-service

# Logs go to build-logs/<name>-docker-build.log
```

### Pushing changes
```bash
# ALWAYS use push-all.sh — never push repos individually
./push-all.sh                                    # auto-generates commit messages
./push-all.sh "feat(costs): add CRUD endpoints"  # custom message for all repos

# What it does:
# 1. Iterates submodules sequentially
# 2. Skips repos with no changes
# 3. Runs tests before committing
# 4. Commits, pushes, moves to next repo
# 5. Bumps and publishes shared packages if changed
# 6. Updates parent repo submodule references last
```

### Publishing shared packages
```bash
# Publish all changed packages
npm run release:packages

# Or individual
npm run publish:frontcore
npm run publish:types
```

### Local development
```bash
npm run install:all          # Install all workspace deps
npm run dev                  # Start everything via Turborepo
npm run dev:shell            # Just shell-ui
npm run dev:admin            # Just admin-ui
npm run dev:sso-service      # Just SSO backend
npm run dev:ai-service       # Just AI backend
```

## Testing

| Project type | Runner | Command |
|-------------|--------|---------|
| NestJS services | Jest | `npx jest` or `npm test` |
| React frontends | Vitest | `npx vitest` or `npm test` |
| Shared packages | Vitest | `npx vitest` or `npm test` |
| E2E (shell-ui) | Playwright | `npx playwright test` |

**Never use `--no-verify` on commits.** If pre-commit hooks fail because tests fail, fix the tests.

## Git Workflow

- Each submodule is its own GitHub repo with its own CI pipelines.
- Commits go directly to `main` unless using the Jira workflow (feature branches).
- **Conventional commits:** `feat(scope): description`, `fix(scope): description`, `chore(scope): description`.
- **Commit message max length:** Enforced by commitlint. Keep the first line under 100 characters.
- **Submodule references:** The parent repo tracks submodule commit hashes. `push-all.sh` updates these automatically.

## Common Tasks

### Add a new backend endpoint
1. Create or update the module in `src/<feature>/`
2. Add DTO(s) in `src/<feature>/dto/` with `class-validator`
3. Add method to the service (business logic + DB queries)
4. Add route to the controller (thin — just delegates)
5. Write unit tests in `*.spec.ts`
6. Build: `./build-all.sh <service-name>`

### Add a new frontend page
1. Create page component in `src/pages/<PageName>.tsx`
2. Create hook(s) for business logic in `src/hooks/` or colocated
3. Register route in the MFE's router config
4. Use shared UI components from `@gaqno-development/frontcore/components/ui`

### Add a shared type
1. Define the interface in `@gaqno-types/src/<domain>/`
2. Re-export from `@gaqno-types/src/index.ts`
3. Bump version, publish: `npm run release:packages`

### Fix a failing pre-commit hook
1. Run `npx jest <path>` or `npx vitest <path>` to identify failures
2. Determine if the bug is in the test or the implementation
3. Fix the root cause
4. Verify all tests pass, then commit normally

## Project Files Reference

| Path | Purpose |
|------|---------|
| `build-all.sh` | Docker builds for named projects |
| `push-all.sh` | Sequential commit/push across all submodules |
| `publish-packages.sh` | Build and publish shared npm packages |
| `turbo.json` | Turborepo task graph (dev, build, test) |
| `docker-compose.yml` | Local development stack (services built from submodule paths) |
| `.github/workflows/` | Parent repo CI/CD (gitleaks, deploy, PR agent) |
| `.cursor/rules/` | Cursor IDE rule files (10 rules) |
| `.claude/agents/` | Claude Code agent definitions (backend-dev, frontend-dev, frontend-page-structure, devops, jira-specialist) |
| `scripts/` | CI-critical checks (submodules, page structure, federation postinstall) |
| `monitoring/` | Grafana/Prometheus stack helpers |

## Environment Variables

Each service reads `DATABASE_URL`, `PORT`, `JWT_SECRET`, `CORS_ORIGIN` at minimum. See:
- `.env.production.example` — full production variable list
- `.env.ai-platform.example` — AI platform services
- `gaqno-ai-service/.env.example` — AI service specific (Cloudflare R2, attribution, billing)

Secrets are never committed. Use environment-specific `.env` files or vault injection.

## MCP Servers Available

- **Atlassian (Jira):** Ticket management, hierarchy validation
- **Dokploy:** Deployment management
- **Cloudflare:** DNS and tunnel management
- **Grafana:** Dashboard queries, Prometheus/Loki, alerting
- **n8n:** Workflow automation
- **Mercado Pago:** Payment integration
- **New Relic:** Application monitoring
- **shadcn:** UI component management

---
trigger: model_decision
description: CI/CD, Docker, deployment, and infrastructure standards
globs: "**/.github/**/*.yml,**/Dockerfile*,**/docker-compose*.yml,**/*.tf"
---

# DevOps Standards

**CI/CD pipeline stages (in order)**
1. Code quality (lint, type check, security scan)
2. Build (deps + app build with caching, Docker image)
3. Test (unit, integration, E2E if applicable)
4. Deploy (env-specific, health checks, smoke tests)
5. Post-deploy (notifications, metrics)

**Docker**
- Multi-stage builds; non-root user; health checks in Dockerfile.
- Use `.dockerignore`; pin dependency versions; prefer minimal bases (alpine, distroless).

**Config**
- Separate dev/staging/prod; secrets from vaults, never in code; validate config on startup.

**Safety**
- Rollback capability; health checks before routing traffic; gradual production rollout; post-deploy smoke tests.

**Worktree**
- Use `git worktree add ../<repo>-<desc> -b feature/TICKET-KEY-desc` for pipeline/infra changes; work in worktree; remove after PR merged.

Pipeline failures: identify failing stage, fix config/deps/env, add safeguards, document.

---
trigger: model_decision
description: React/MFE structure — hooks for logic, components presentational, @gaqno-frontcore
globs: "**/*.tsx,**/hooks/**/*.ts,**/@gaqno-frontcore/**/*"
---

# Frontend (React / MFE) Standards

**Components**: Purely presentational. No business logic in components.

**Hooks**: All business logic. Naming `use[Domain][Action]` (e.g. `useUserProfile`, `useAuthLogin`). Every hook must have unit tests. No `any`; full type safety. Side effects only in callbacks.

**Structure**: Hooks by domain (auth/, user/, product/). Pages are composition-only. Shared logic in `@gaqno-frontcore`. Test files colocated (*.spec.tsx, *.test.tsx).

**MFE**: No direct imports between MFEs. Shared code only via `@gaqno-frontcore`. Module Federation for runtime integration. Each MFE owns its domain and routes.

**Worktree**: Use `git worktree add ../<repo>-<desc> -b feature/TICKET-KEY-desc` for feature work; remove after PR merged.

Violations: hook without tests (CRITICAL), business logic in component (HIGH), duplicated shared logic (HIGH).

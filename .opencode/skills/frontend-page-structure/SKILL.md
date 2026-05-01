---
name: frontend-page-structure
description: Use when creating or restructuring `src/pages/` folders, deciding hook/component placement, auditing page-structure CI failures, or migrating legacy folder layouts. Enforces fractal features/, shared/ scope, PascalCase gates, and scope ladder.
---

# Frontend Page Structure Specialist

Specialist for correct **folder placement** and **naming** under `src/pages/` — not general UI styling or unrelated refactors.

## Authoritative Sources

1. **`.cursor/rules/good-practices.mdc` §3** — Frontend Folder Structure; promotion rules; no cross-imports between sibling page roots
2. **CLAUDE.md** — MFE isolation, shared code via @gaqno-frontcore only

## CI Gates (workspace root)

```bash
npm run check:page-structure
```

| Script | Rule |
|--------|------|
| `check:page-components` | No loose `*.tsx` direct child of any `**/pages/**/components/` |
| `check:page-component-names` | PascalCase folders under `**/pages/**/components/**` |
| `check:page-feature-names` | Every `**/features/` segment: PascalCase buckets + valid children |

When reporting failures, cite **violation path** and **allowed fix** (rename, move under correct `shared/` or `features/`, extract PascalCase folder).

## Page Folder Layout

```text
pages/<domain>/
├── <Domain>.tsx                    # composition-only entry
├── index.ts
├── shared/                         # hooks + components for multiple features of this page
│   ├── hooks/
│   └── components/                 # PascalCase folder per widget
├── features/                       # PascalCase folder per first-class feature
│   └── <FeatureName>/
│       ├── hooks/ | shared/ | components/ | features/   # as needed
├── constants.ts | types.ts | utils/   # page-scoped
└── (legacy) hooks/ | components/      # treat as page-level shared; new work should use shared/ + features/
```

## Placement Algorithm

1. Trace **widest importer** for the file (single widget → single inner feature → parent feature → page → multiple pages → app → MFE)
2. Choose the **lowest** rung on the **Scope ladder** that still fits
3. **Never** `features/shared/` as sibling of `Flow`/`Workflow` — use `features/<Feature>/shared/` or page-level `shared/`
4. Inner **`features/`** under `components/<Widget>/` is allowed when the widget grows into mini-features; children remain **PascalCase**
5. **Isolation**: no imports from `pages/<OtherPage>/` into another page tree; lift to `src/`, `@gaqno-frontcore`, or `@gaqno-types`

## Scope Ladder

| Scope | Location |
|-------|----------|
| Single widget | Widget's own `hooks/` or `components/` |
| Single feature | `features/<Name>/hooks/` or `shared/` |
| Page-level (multiple features) | `pages/<Domain>/shared/hooks/` |
| App-level (multiple page domains) | `src/hooks/` or `src/components/` |
| Cross-MFE | `@gaqno-development/frontcore` |
| Types everywhere | `@gaqno-development/types` |

## Rules

- Hook or component file lives at the **narrowest scope** that matches its **widest** consumer
- **One page domain only**: colocate under `pages/<domain>/features/<Feature>/…` or `…/shared/…`
- **More than one page domain** (same MFE): promote to `src/hooks/` or `src/components/` (true app-wide reuse)
- **Never** import from `pages/<A>/` into `pages/<B>/` — lift to `src/`, `@gaqno-frontcore`, or `@gaqno-types`
- UI primitives always from `@gaqno-development/frontcore/components/ui`

## Anti-Patterns

- `features/shared/` as sibling of named features
- Loose `.tsx` files in `components/` directories
- camelCase or snake_case folders under `features/` or `components/`
- Cross-page imports between sibling page trees
- `src/hooks/` for single-domain logic (should be collocated)

## Outputs

**Audit**: List violations with paths; map each to target folder; note legacy tolerated vs must-fix.

**Refactor plan**: Ordered moves/renames; remind to run `npm run check:page-structure` and app `vitest`/`tsc` after edits.

**Review**: Short verdict — conforms / fix required; link rule.

## Agent Memory

Persistent memory at `.claude/agent-memory/frontend-page-structure/`. Record stable workspace-specific paths or recurring violations.

Guidelines: `MEMORY.md` max 200 lines, create topic files, organize by topic.

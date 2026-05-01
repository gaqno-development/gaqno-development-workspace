---
name: good-practices
description: Consolidated coding standards for the workspace — clean code, hooks, folder structure, prop passing, NestJS patterns, build/push workflow. Always apply.
---

# Good Practices

Consolidated coding standards. These rules apply to all frontend and backend code in the workspace.

## 1. Clean Code

- **No comments.** If the code needs explanation, refactor or rename.
- **No `any`.** Full strict TypeScript. Define interfaces and type guards instead of casts.
- **No magic values.** Extract to `constants/`.
- **Immutability first.** Prefer `readonly`, `const`, spread operators, `.map()` / `.filter()` over mutation.
- **Object mapping over if/else chains.** Use `Record<Key, Value>` lookup tables.

### Size Limits

| Unit     | Max       |
| -------- | --------- |
| Function | 20 lines  |
| File     | 200 lines |
| Hook     | 1 concern |

If it exceeds the limit, decompose into named helpers or split into focused modules.

### Smell → Fix

| Smell                                     | Fix                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| Same 3+ lines in 2+ files                 | Extract to `utils/` or a shared hook                        |
| Hook does fetch + transform + UI state    | Split into `useXQuery` + `useXTransform`, compose in parent |
| Inline component inside another component | Move to its own file, pass props                            |
| Hardcoded string/number in 2+ places      | Move to `constants/`                                        |
| `as any` / `as unknown`                   | Define an interface + type guard                            |
| `<Child {...hookReturn} />`               | Pass explicit named props (see §2.1)                        |

---

## 2. Hooks — Separate View, Logic, and Mutations

Every React component is **purely presentational**. All logic lives in hooks. Hooks follow single-concern:

| Hook type | Naming                 | Responsibility                         |
| --------- | ---------------------- | -------------------------------------- |
| Query     | `use[Domain]Query`     | Fetch + cache (React Query)            |
| Mutation  | `use[Domain]Mutation`  | Create / update / delete               |
| Transform | `use[Domain]Transform` | Derive/filter/sort data                |
| UI state  | `use[Domain]State`     | Local UI state (modals, tabs, filters) |
| Composer  | `use[Domain]`          | Composes the above, returns a flat API |

**Components receive data and callbacks via props — never call API or manage business state directly.**

---

## 2.1 Prop Passing — Explicit Named Props, Never Spread a Hook Return

**Rule:** NEVER pass `{...hookReturn}` or `{...compositeObject}` to a child component. Always pass explicit, named props that match the child's declared interface.

### Why

1. **Contract visibility.** The JSX should tell you exactly what the child depends on.
2. **No over-passing.** Spreading leaks all 20+ properties into the child.
3. **Presentational contract.** Components must be pure functions of their props.
4. **Testability.** Explicit props let tests construct minimal fixtures.
5. **Refactor safety.** TypeScript catches breakage at explicit call sites only.

### The only exceptions (narrow)

1. **DOM-attribute forwarding** on a primitive wrapper
2. **True proxy/HOC components** that forward an unknown attribute surface (`Slot`, `asChild`)

If the parent is passing 10+ props: split the child, or group into named sub-objects with their own named interface — still passed explicitly, never via spread.

---

## 3. Frontend Folder Structure

See the **frontend-page-structure** skill for the full tree, fractal `features/`, scope ladder, and CI gates.

Key rules:
- Hook/component file lives at the **narrowest scope** that matches its **widest** consumer
- **One page domain only**: colocate under `pages/<domain>/features/<Feature>/…` or `…/shared/…`
- **More than one page domain** (same MFE): promote to `src/hooks/` or `src/components/`
- **Never** import from `pages/<A>/` into `pages/<B>/` — lift to `src/`, `@gaqno-frontcore`, or `@gaqno-types`
- UI primitives always from `@gaqno-development/frontcore/components/ui`

CI: `npm run check:page-structure`

---

## 4. Backend (NestJS) Structure

```
src/
├── <feature>/
│   ├── <feature>.module.ts
│   ├── <feature>.controller.ts   # Thin — HTTP mapping only
│   ├── <feature>.service.ts      # All business logic
│   ├── dto/
│   │   ├── create-<feature>.dto.ts
│   │   └── update-<feature>.dto.ts
│   └── <feature>.service.spec.ts
├── common/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
└── database/
    ├── schema.ts
    └── migrations/
```

- **Controllers:** thin routing. No business logic.
- **Services:** all logic, fully unit-testable, single responsibility.
- **DTOs:** `class-validator` decorators. Separate create/update DTOs.

---

## 5. Build Before Push

**Always** verify the Docker build succeeds before pushing:

```bash
./build-all.sh gaqno-ai-service
./push-all.sh "feat(ai): add new handler"
```

If the build fails, fix the error before pushing.

---

## 6. Push via `push-all.sh`

**Never** push repos individually or in parallel. Each push triggers CI, and simultaneous pipelines compete.

```bash
./push-all.sh
./push-all.sh "fix(cors): update origin list"
```

`push-all.sh` iterates submodules sequentially, runs tests, commits, pushes, bumps shared packages if changed, and updates parent repo references.

---

## 7. Decision Checklist

Before writing any function, hook, or component:

1. Can I describe it in **one clause** (no "and")?
2. Does it fit in **20 lines**?
3. Does identical logic already exist? → reuse it.
4. Does it use a hardcoded value? → `constants/`.
5. Does it need a cast? → define an interface first.
6. Is it used by only this page **domain**? → colocate under `pages/<domain>/`.
7. Is it used by **more than one** page **domain** (or clearly app-wide)? → `src/hooks/` or `src/components/`.

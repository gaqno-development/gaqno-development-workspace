---
name: clean-code-finder
description: Use before committing, during code review, or when asked to improve code quality. Finds anti-patterns, code smells, and maintenance risks.
---

# Clean Code Finder

## Overview

Code quality degrades silently. Anti-patterns accumulate. This skill systematically scans code for issues that hurt readability, maintainability, and correctness.

**Core principle:** Find problems BEFORE they reach production. Better to catch a code smell in review than debug it at 2am.

## When to Use

- Before committing changes (pre-commit quality gate)
- During code review of PRs
- When asked to "improve this code" or "clean this up"
- When onboarding to an unfamiliar codebase
- Before refactoring — establish baseline quality first

## The Scan Layers

Run scans in order. Each layer catches different issues.

### Layer 1: Structural Issues

These break code organization and make systems hard to navigate.

| Pattern | What to Look For | Why It Matters |
|---------|-----------------|----------------|
| God Object | Classes/files > 200 lines with multiple responsibilities | Single point of failure, hard to test |
| Long Method | Functions > 20 lines | Hard to reason about, multiple exit paths |
| Deep Nesting | 3+ levels of indentation | Cognitive overload, hidden logic paths |
| Circular Dependencies | A imports B imports A | Breaks modularity, causes init order bugs |
| Feature Envy | Method uses another object's data more than its own | Wrong class owns the behavior |

### Layer 2: Type Safety

These cause runtime errors that compilers should catch.

| Pattern | What to Look For | Why It Matters |
|---------|-----------------|----------------|
| `any` Usage | Explicit `any` type, implicit any from missing types | Defeats TypeScript, hides bugs |
| Type Assertions | `as SomeType`, `!` non-null assertion | Lies to the compiler, runtime crashes |
| Unsafe Casts | Casting between unrelated types | Silent data corruption |
| Missing Null Checks | Accessing properties on nullable without guard | `Cannot read property of undefined` |
| Incomplete Unions | `switch` without `never` exhaustiveness check | New union members silently unhandled |

### Layer 3: API & Integration

These cause integration failures between services and components.

| Pattern | What to Look For | Why It Matters |
|---------|-----------------|----------------|
| Hardcoded URLs | `fetch("https://api...")` instead of config | Breaks in different environments |
| Missing Error Handling | `await fetch()` without try/catch | Unhandled promise rejections |
| Silent Failures | Empty catch blocks, swallowed errors | Bugs disappear, users see broken state |
| Magic Numbers | `if (status === 4)` instead of enum | What does 4 mean? |
| Unvalidated Input | DTOs without `class-validator` decorators | Garbage in, garbage out |

### Layer 4: State & Side Effects

These cause unpredictable behavior and race conditions.

| Pattern | What to Look For | Why It Matters |
|---------|-----------------|----------------|
| Mutable Shared State | Global variables, module-level mutable objects | Race conditions, order-dependent bugs |
| Uncontrolled Side Effects | Effects without cleanup, missing dependencies | Memory leaks, stale closures |
| Stale Closures | Callbacks capturing old state values | Wrong data processed, UI out of sync |
| Missing Keys | List rendering without stable `key` prop | React reconciliation bugs, lost state |
| Unmemoized Expensive Computations | Heavy calculations in render body | Re-computed every render, performance hit |

### Layer 5: Testing & Documentation

These make code hard to maintain and modify safely.

| Pattern | What to Look For | Why It Matters |
|---------|-----------------|----------------|
| Untested Business Logic | Hooks/services with no spec files | Changes are guesswork |
| Brittle Tests | Tests that mock everything, test implementation | Refactor breaks tests, not code |
| Missing Assertions | Tests without `expect()` | False confidence, tests pass on broken code |
| No JSDoc/TSDoc | Public APIs without documentation | Consumers guess at behavior |
| Outdated Comments | Comments describing old behavior | Misleads developers |

## The Scan Process

### Step 1: Scope Definition

Identify what to scan:
- **Single file**: Direct review
- **Feature**: All files in the feature directory
- **PR**: Files changed in the diff
- **Module**: Entire module/package

### Step 2: Automated Scan

Use grep/rg to find common patterns:

```bash
# Type safety
rg '\bany\b' --type typescript
rg ' as [A-Z]' --type typescript
rg '!\.' --type typescript

# Code smells
rg 'catch.*\{[\s\n]*\}' --type typescript
rg 'console\.(log|warn|error)' --type typescript
rg '// TODO|// FIXME|// HACK' --type typescript

# Long files
find . -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -rn | head -20
```

### Step 3: Manual Review

For each file, check:
1. **Naming**: Do names reveal intent? (`getUserById` not `getData`)
2. **Single Responsibility**: Does this do one thing?
3. **Dependencies**: Are imports minimal and direct?
4. **Error Paths**: Are all error cases handled?
5. **Edge Cases**: What happens with empty input, null, max values?

### Step 4: Report

Present findings in this format:

```
## Clean Code Report: <scope>

### Critical (fix before merge)
- [ ] <file>:<line> - <issue> — <why it matters>

### Warning (fix soon)
- [ ] <file>:<line> - <issue> — <why it matters>

### Info (consider improving)
- [ ] <file>:<line> - <issue> — <why it matters>
```

## Project-Specific Rules (gaqno)

Apply these in addition to the general scan:

| Rule | Check |
|------|-------|
| No `any` type | Strict TypeScript everywhere |
| Max 200 lines per file | Split large files |
| Max 20 lines per function | Extract helpers |
| No comments in code | Names must be self-explanatory |
| Hooks must have tests | Every `use*` hook needs `.spec.ts` |
| Controllers thin | Only HTTP mapping, delegate to services |
| Components presentational | No business logic in UI components |
| DRY via shared packages | Use `@gaqno-frontcore`, `@gaqno-backcore`, `@gaqno-types` |
| Immutability preferred | `readonly`, `const`, pure functions |
| Portuguese for user strings | English for code/variables |

## Quick Reference

| Severity | Action | Examples |
|----------|--------|----------|
| **Critical** | Block merge | `any` type, unhandled errors, security issues |
| **Warning** | Fix in same PR | Long functions, missing tests, magic numbers |
| **Info** | Track for later | Naming improvements, documentation gaps |

## Anti-Patterns to Flag Immediately

If you see any of these, flag them as **Critical**:

1. **`any` type** — Defeats the entire type system
2. **Empty catch block** — Swallows errors silently
3. **`// @ts-ignore`** — Hides type errors instead of fixing
4. **`setTimeout` for state sync** — Race condition waiting to happen
5. **Direct DOM manipulation in React** — Bypasses React's rendering
6. **SQL string concatenation** — SQL injection risk
7. **Hardcoded secrets** — Security vulnerability
8. **`eval()` or `new Function()`** — Code injection risk

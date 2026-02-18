# Frontcore components – shadcn style alignment

Components in `@gaqno-frontcore` that do not fully follow shadcn patterns, with recommended changes. Reference: shadcn MCP (`list_items_in_registries`, `get_item_examples_from_registries`).

---

## Summary

| Component        | Divergence                          | Priority | Status |
|-----------------|-------------------------------------|----------|--------|
| **Badge**       | ~~`div` vs `span`, `rounded-md` vs `rounded-full`, no `asChild`, no `data-slot`~~ | Medium   | **Done:** span, rounded-full, data-slot, data-variant, asChild, [a&]:hover only. |
| **Toast**      | ~~Hardcoded colors (green-50, red-50, etc.)~~ | Medium   | **Done:** theme tokens (primary, destructive, muted, border). |
| **Breadcrumbs**| ~~Single component only~~ | Low     | **Done:** composition API (Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis) + Breadcrumbs convenience. |
| **EmptyState** | ~~No composition primitives~~ | Low     | **Done:** composition exports (Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent, emptyMediaVariants); EmptyState unchanged. |
| **Card**       | ~~`data-component`~~ | Low     | **Done:** CardContent uses `data-slot="card-content"`. |
| **DialogFormFooter** | Custom composite (no shadcn equivalent) | —        | **Verified:** uses DialogFooter + Button. No change. |
| **ModuleTabs** | Composes Tabs correctly              | —        | No change. |
| **LoadingSkeleton** | Custom composite (Card + Skeleton) | —        | No change. |
| **BellIcon, ClapIcon, etc.** | Custom icons / motion | —        | No change (not in shadcn). |

---

## 1. Badge

**Current:** `badge.tsx` uses `<div>`, `rounded-md`, no `asChild`, no `data-slot`, and generic `focus:ring` / hover on all variants.

**Shadcn:** `<span>` (inline semantics), `rounded-full`, `data-slot="badge"`, `data-variant={variant}`, `asChild` with `Slot.Root`, hover only when badge is a link (`[a&]:hover:...`).

**Recommendation:**

- Render as `<span>` for inline correctness.
- Use `rounded-full` to match shadcn default.
- Add `data-slot="badge"` and `data-variant={variant}`.
- Optionally add `asChild` (Slot) for link badges.
- Restrict hover/focus to link usage (e.g. `[a&]:hover:...`) so plain badges don’t look clickable.

---

## 2. Breadcrumbs

**Was:** Single `Breadcrumbs` component with `items`, `showHome`; no composition parts.

**Shadcn:** Composition: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (asChild), `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`; each with `data-slot`.

**Status:** Done. Composition API added: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (asChild + react-router Link), `BreadcrumbPage`, `BreadcrumbSeparator` (default `ChevronRight`), `BreadcrumbEllipsis`. `Breadcrumbs` (convenience) uses these and keeps same props. `aria-label="breadcrumb"` and `BreadcrumbPage` with `aria-current="page"` for last item.

---

## 3. EmptyState

**Was:** Prop-based `EmptyState` only; no composition primitives.

**Shadcn:** Composition: `Empty`, `EmptyHeader`, `EmptyMedia` (variant: default | icon), `EmptyTitle`, `EmptyDescription`, `EmptyContent`; `data-slot` on each.

**Status:** Done. Composition primitives exported: `Empty`, `EmptyHeader`, `EmptyMedia` (variant: default | icon), `EmptyTitle`, `EmptyDescription`, `EmptyContent`, `emptyMediaVariants`. `EmptyState` prop-based API unchanged.

---

## 4. Toast

**Current:** `toast/index.tsx` uses fixed Tailwind classes: `bg-green-50`, `border-green-500`, `text-green-900`, and equivalent for error (red), warning (yellow), info (blue). Not using CSS variables.

**Shadcn:** Toasts typically use theme tokens (e.g. destructive, primary) or Sonner with variant-based styling.

**Recommendation:**

- Use theme tokens:
  - **success:** `bg-primary text-primary-foreground` (or a dedicated `--success` if added to theme).
  - **error:** `bg-destructive text-destructive-foreground` / border-destructive.
  - **warning:** `bg-muted text-muted-foreground` or `secondary` (or add `--warning` to theme).
  - **info:** `bg-muted text-muted-foreground` or primary.
- Ensures dark mode and theme consistency without hardcoded palettes.

---

## 5. Card

**Current:** ~~`CardContent` uses `data-component="card-content"`.~~

**Shadcn:** Uses `data-slot` for layout/slot detection.

**Status:** Done. CardContent now uses `data-slot="card-content"`.

---

## 6. Other components

- **Alert, AlertTitle, AlertDescription:** Structure and CVA variants align with shadcn; `[&>svg]` positioning matches. No change needed.
- **Progress, Spinner, Dialog, Sheet, etc.:** Use Radix or same patterns as shadcn; no material divergence noted.
- **DialogFormFooter:** Uses DialogFooter + Button; no shadcn equivalent. Verified; keep as is.
- **ModuleTabs, LoadingSkeleton:** App-specific composites; no shadcn 1:1; keep as is.
- **SectionWithSubNav:** Layout + breadcrumb strip; uses Link and Button; optional improvement is to use Breadcrumb composition in the nav strip if we add it.

---

## After making changes

- Run build/typecheck for `@gaqno-frontcore` and consuming apps (e.g. gaqno-shell-ui).
- Run shadcn MCP **get_audit_checklist** (no args) if available.
- Update this doc and `shadcn-component-audit.md` as components are aligned.

# Frontcore components – shadcn style alignment

Components in `@gaqno-frontcore` that do not fully follow shadcn patterns, with recommended changes. Reference: shadcn MCP (`list_items_in_registries`, `get_item_examples_from_registries`).

---

## Summary

| Component        | Divergence                          | Priority | Status |
|-----------------|-------------------------------------|----------|--------|
| **Badge**       | ~~`div` vs `span`, `rounded-md` vs `rounded-full`, no `asChild`, no `data-slot`~~ | Medium   | **Done:** span, rounded-full, data-slot, data-variant, asChild, [a&]:hover only. |
| **Toast**      | ~~Hardcoded colors (green-50, red-50, etc.)~~ | Medium   | **Done:** theme tokens (primary, destructive, muted, border). |
| **Breadcrumbs**| Single component vs composition API; no `BreadcrumbPage` / `BreadcrumbSeparator` / `BreadcrumbEllipsis` | Low     | Optional: add composition API; keep current API as convenience. |
| **EmptyState** | Prop-based + Card wrapper vs shadcn composition (Empty, EmptyHeader, EmptyMedia, etc.) | Low     | Keep current API (audit says OK). Optional: add composition exports. |
| **Card**       | `CardContent` uses `data-component` instead of `data-slot` | Low     | Optional: rename to `data-slot="card-content"` for shadcn consistency. |
| **DialogFormFooter** | Custom composite (no shadcn equivalent) | —        | Keep; ensure it uses DialogFooter + Button. |
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

**Current:** Single `Breadcrumbs` component with `items: IBreadcrumbItem[]`, `showHome`, renders `<nav><ol>` with `Link` and `ChevronRight`. No separate parts for list/link/page/separator.

**Shadcn:** Composition: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (with `asChild` for Link), `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`; each with `data-slot`; separator and ellipsis optional.

**Recommendation:**

- Keep existing `Breadcrumbs` for simple use cases.
- Optionally add a composition API: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink` (asChild + react-router Link), `BreadcrumbPage`, `BreadcrumbSeparator` (default `ChevronRight`), `BreadcrumbEllipsis` for overflow.
- Use `aria-label="breadcrumb"` and current page with `aria-current="page"` (we already use a similar structure; ensure last item has it).

---

## 3. EmptyState

**Current:** Prop-based API (icon, title, description, action, secondaryAction, size, children) with `Card` + `CardContent`.

**Shadcn:** Composition: `Empty` (div with border-dashed), `EmptyHeader`, `EmptyMedia` (variant: default | icon), `EmptyTitle`, `EmptyDescription`, `EmptyContent`; no Card; `data-slot` on each.

**Recommendation:**

- Keep current API (simpler for most usages; see `shadcn-component-audit.md`).
- Optional: export composition primitives (`Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`) for layouts that need full control.

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

**Current:** `CardContent` uses `data-component="card-content"`.

**Shadcn:** Uses `data-slot` for layout/slot detection.

**Recommendation:**

- Optional: change to `data-slot="card-content"` for consistency with shadcn slot naming.

---

## 6. Other components

- **Alert, AlertTitle, AlertDescription:** Structure and CVA variants align with shadcn; `[&>svg]` positioning matches. No change needed.
- **Progress, Spinner, Dialog, Sheet, etc.:** Use Radix or same patterns as shadcn; no material divergence noted.
- **DialogFormFooter, ModuleTabs, LoadingSkeleton:** App-specific composites; no shadcn 1:1; keep as is.
- **SectionWithSubNav:** Layout + breadcrumb strip; uses Link and Button; optional improvement is to use Breadcrumb composition in the nav strip if we add it.

---

## After making changes

- Run build/typecheck for `@gaqno-frontcore` and consuming apps (e.g. gaqno-shell-ui).
- Run shadcn MCP **get_audit_checklist** (no args) if available.
- Update this doc and `shadcn-component-audit.md` as components are aligned.

# Dynamic Category Section Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow tenants to customize category section labels ("Por categoria", "Coleção", "Explorar") and fallback category names via storefrontCopy settings.

**Architecture:** Extend `storefrontCopy.home` with category section labels and category-specific settings. Add admin form fields for customization. Use tenant settings in shop components.

**Tech Stack:** NestJS (shop-service), React (shop, shop-admin), TypeScript

---

## File Mapping

| File | Change |
|------|--------|
| `gaqno-shop-service/src/tenant/tenant.service.ts` | Add category label fields to AI prompt |
| `gaqno-shop/src/lib/storefront-copy.ts` | Add category section interface and defaults |
| `gaqno-shop-admin/src/pages/TenantDetailPage/hooks/useTenantPlatformDetailForm.ts` | Add form fields |
| `gaqno-shop-admin/src/pages/TenantDetailPage/components/TenantStorefrontPreview.tsx` | Use tenant labels |
| `gaqno-shop/src/app/components/HomeCategoriesSection.tsx` | Use tenant labels |
| `gaqno-shop-admin/src/pages/TenantDetailPage/hooks/useTenantPlatformDetailForm.spec.ts` | Update tests |

---

## Tasks

### Task 1: Extend shop-service tenant AI prompt with category labels

In `gaqno-shop-service/src/tenant/tenant.service.ts`, around line 410 where `storefrontCopy.home` is generated, add:

```typescript
categoriesEyebrow: "Rótulo da seção de categorias (ex: 'Coleções', 'Coleção', 'Por categoria')",
categoriesSectionTitle: "Título da seção de categorias (ex: 'Por categoria', 'Por tipo')",
categoriesCtaLabel: "Texto do link de explorar (ex: 'Explorar', 'Ver produtos', 'Ver mais')",
```

**Commit:** "feat(shop-service): add category section labels to AI prompt for storefrontCopy"

---

### Task 2: Extend storefront-copy.ts interface and defaults

In `gaqno-shop/src/lib/storefront-copy.ts`:

1. Add to `ResolvedStorefrontHomeCopy` interface (around line 34):
```typescript
categories: {
  readonly eyebrow: string;      // "Coleções" / "Coleção"
  readonly sectionTitle: string; // "Por categoria" / "Por tipo"
  readonly ctaLabel: string;   // "Explorar" / "Ver produtos"
};
```

2. Add to `DEFAULT_HOME_COPY` (around line 99):
```typescript
categories: {
  eyebrow: "Coleções · 2026",
  sectionTitle: "Por categoria",
  ctaLabel: "Explorar",
},
```

3. Add to `resolveHomeCopy()` function (around line 229):
```typescript
categories: {
  eyebrow: asText(home?.categories?.eyebrow, DEFAULT_HOME_COPY.categories.eyebrow),
  sectionTitle: asText(home?.categories?.sectionTitle, DEFAULT_HOME_COPY.categories.sectionTitle),
  ctaLabel: asText(home?.categories?.ctaLabel, DEFAULT_HOME_COPY.categories.ctaLabel),
},
```

**Commit:** "feat(shop): add category section labels to storefrontCopy"

---

### Task 3: Update admin form interface

In `gaqno-shop-admin/src/pages/TenantDetailPage/hooks/useTenantPlatformDetailForm.ts`:

1. Add to `ITenantStorefrontPreviewModel.home` (around line 169):
```typescript
readonly categoriesEyebrow: string;
readonly categoriesSectionTitle: string;
readonly categoriesCtaLabel: string;
```

2. Add to `ITenantProfileFormState` (search for it):
```typescript
homeCategoriesEyebrow: string;
homeCategoriesSectionTitle: string;
homeCategoriesCtaLabel: string;
```

3. Add to `EMPTY_FORM`:
```typescript
homeCategoriesEyebrow: "",
homeCategoriesSectionTitle: "",
homeCategoriesCtaLabel: "",
```

4. Add to form loading (around line 364):
```typescript
homeCategoriesEyebrow: readSettingString(sections, "categoriesEyebrow"),
homeCategoriesSectionTitle: readSettingString(sections, "categoriesSectionTitle"),
homeCategoriesCtaLabel: readSettingString(sections, "categoriesCtaLabel"),
```

5. Add to form saving (search for where homeSectionCatalogEyebrow is saved):
```typescript
homeCategoriesEyebrow: form.homeCategoriesEyebrow,
homeCategoriesSectionTitle: form.homeCategoriesSectionTitle,
homeCategoriesCtaLabel: form.homeCategoriesCtaLabel,
```

**Commit:** "feat(shop-admin): add category section label fields to tenant form"

---

### Task 4: Update TenantStorefrontPreview component

In `gaqno-shop-admin/src/pages/TenantDetailPage/components/TenantStorefrontPreview.tsx`:

1. Update SectionHeader usage (around line 688-689):
```tsx
// From: "Por categoria"
// To:
<EditableText
  fieldId="home.categoriesSectionTitle"
  value={model.home.categoriesSectionTitle}
  onEdit={onEditField}
  className="block font-serif text-[clamp(2.3rem,5vw,3.8rem)] italic leading-[0.95] tracking-[-0.02em] text-[var(--tenant-ink)]"
/>
```

2. Update CategoryTile (around lines 919, 928, 931):
- Line 920: `Coleção` → `<EditableText fieldId="home.categoriesEyebrow" ... />`
- Line 928: category.name stays as-is
- Line 931: `Explorar` → `<EditableText fieldId="home.categoriesCtaLabel" ... />`

**Commit:** "feat(shop-admin): use tenant-configurable category labels in preview"

---

### Task 5: Update shop HomeCategoriesSection component

In `gaqno-shop/src/app/components/HomeCategoriesSection.tsx`:

The shop doesn't have direct access to settings. Need to pass via props or context. Check how other sections get settings - likely from the parent page or a hook.

For now, assume it receives `labels` prop:
```typescript
interface Props {
  readonly categories: readonly Category[];
  readonly labels?: {
    readonly eyebrow?: string;
    readonly sectionTitle?: string;
    readonly ctaLabel?: string;
  };
}
```

Update usages:
- Line 44: `Coleções · 2026` → `{labels?.eyebrow ?? "Coleções · 2026"}`
- Line 49: `Por categoria` → `{labels?.sectionTitle ?? "Por categoria"}`
- Line 117: `Coleção` → `{labels?.eyebrow ?? "Coleção"}`
- Line 135: `Explorar` → `{labels?.ctaLabel ?? "Explorar"}`

**Commit:** "feat(shop): support tenant-configurable category labels in HomeCategoriesSection"

---

### Task 6: Update tests

1. Update `useTenantPlatformDetailForm.spec.ts` - add test cases for the new fields:
```typescript
expect(result.homeCategoriesEyebrow).toBe("Coleções");
expect(result.homeCategoriesSectionTitle).toBe("Por categoria");
expect(result.homeCategoriesCtaLabel).toBe("Explorar");
```

**Commit:** "test(shop-admin): add tests for category label fields"

---

### Task 7: Integration - pass labels from page to component

In the shop, find where `HomeCategoriesSection` is used and pass the labels from tenant settings.

**Commit:** "feat(shop): integrate category labels from tenant settings"

---

## Verification

Run:
```bash
npx vitest gaqno-shop/src/app/components/HomeCategoriesSection.spec.tsx
npx jest gaqno-shop-admin/src/pages/TenantDetailPage/hooks/useTenantPlatformDetailForm.spec.ts
```

All tests should pass.

---

## Execution Options

1. **Subagent-Driven (recommended)** - Dispatch tasks 1-7 to subagents
2. **Inline** - Execute in this session with checkpoint reviews between tasks
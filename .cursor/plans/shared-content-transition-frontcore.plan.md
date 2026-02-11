# Shared content transition in frontcore

## Overview

Move the section content transition (AnimatePresence + motion) from omnichannel into frontcore's SectionWithSubNav so the AI module, CRM, omnichannel, and any other consumer get the same animated sub-route switch. Apply `enableContentTransition={true}` everywhere SectionWithSubNav is used.

## Current usage of SectionWithSubNav

| App | File(s) | Usages |
|-----|---------|--------|
| **gaqno-crm-ui** | `src/App.tsx` | 9 section components: DashboardSection, SalesSection, CustomersSection, InventorySection, OperationsSection, FinanceSection, ReportsSection, AutomationSection, AdministrationSection, SettingsSection |
| **gaqno-ai-ui** | RetailSection, VideoSection, ImagesSection, AudioSection, BookPage | 5 pages |
| **gaqno-omnichannel-ui** | InboxSection | 1 (DashboardSection uses custom layout + local transition; will be refactored to use SectionWithSubNav) |

**ERP, PDV, Admin, SSO** do not use SectionWithSubNav today. When they add section-with-subnav pages in the future, they should use `SectionWithSubNav` with `enableContentTransition={true}`.

## Implementation

### 1. Frontcore: add motion + optional transition in SectionWithSubNav

- Add dependency in [@gaqno-frontcore/package.json](@gaqno-frontcore/package.json): `"motion": "^11.0.0"`.
- In [@gaqno-frontcore/src/components/SectionWithSubNav.tsx](@gaqno-frontcore/src/components/SectionWithSubNav.tsx):
  - Add optional prop: `enableContentTransition?: boolean` (default `false`).
  - When `enableContentTransition` is true: import `AnimatePresence` and `motion` from `"motion/react"`, use shared preset (initial: opacity 0, x 8 → animate: opacity 1, x 0 → exit: opacity 0, x -8, duration 0.2), wrap content in `<AnimatePresence mode="wait"><motion.div key={segment} ...><ChildComponent /></motion.div></AnimatePresence>`.
  - When false, keep current plain swap.

### 2. Omnichannel

- Refactor [gaqno-omnichannel-ui/src/pages/DashboardSection.tsx](gaqno-omnichannel-ui/src/pages/DashboardSection.tsx) to use `SectionWithSubNav` with same config + `enableContentTransition={true}` (remove local CONTENT_TRANSITION and AnimatePresence/motion).
- In [gaqno-omnichannel-ui/src/pages/InboxSection/InboxSection.tsx](gaqno-omnichannel-ui/src/pages/InboxSection/InboxSection.tsx): add `enableContentTransition={true}`.

### 3. AI module (gaqno-ai-ui)

Add `enableContentTransition={true}` to all 5 SectionWithSubNav usages:

- [gaqno-ai-ui/src/pages/RetailSection.tsx](gaqno-ai-ui/src/pages/RetailSection.tsx)
- [gaqno-ai-ui/src/pages/VideoSection.tsx](gaqno-ai-ui/src/pages/VideoSection.tsx)
- [gaqno-ai-ui/src/pages/ImagesSection.tsx](gaqno-ai-ui/src/pages/ImagesSection.tsx)
- [gaqno-ai-ui/src/pages/AudioSection.tsx](gaqno-ai-ui/src/pages/AudioSection.tsx)
- [gaqno-ai-ui/src/pages/BookPage.tsx](gaqno-ai-ui/src/pages/BookPage.tsx)

### 4. CRM (gaqno-crm-ui)

Add `enableContentTransition={true}` to all 9 SectionWithSubNav usages in [gaqno-crm-ui/src/App.tsx](gaqno-crm-ui/src/App.tsx):

- DashboardSection (line ~112)
- SalesSection (~131)
- CustomersSection (~152)
- InventorySection (~172)
- OperationsSection (~192)
- FinanceSection (~211)
- ReportsSection (~230)
- AutomationSection (~251)
- AdministrationSection (~270)
- SettingsSection (~290)

### 5. ERP, PDV, Admin, SSO

No code changes now. These apps do not use SectionWithSubNav. When adding section-with-subnav flows later, use `SectionWithSubNav` from frontcore with `enableContentTransition={true}` and add `motion` dependency if not already present.

### 6. Version and publish

- Bump frontcore version (e.g. patch), publish. Update frontcore in omnichannel-ui, ai-ui, crm-ui if needed (e.g. ^1.0.29 or new patch).

## Summary

| App | Action |
|-----|--------|
| Frontcore | Add `motion`; add `enableContentTransition` to SectionWithSubNav and implement transition when true. |
| Omnichannel | Refactor DashboardSection to SectionWithSubNav + enableContentTransition; add enableContentTransition to InboxSection. |
| AI | Add enableContentTransition to 5 pages. |
| CRM | Add enableContentTransition to 9 section components in App.tsx. |
| ERP, PDV, Admin, SSO | No changes; use SectionWithSubNav + enableContentTransition when adding section pages later. |

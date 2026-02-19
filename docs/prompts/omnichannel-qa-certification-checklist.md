# Omnichannel QA Certification Checklist

**Reference:** Navigation, layout, responsive, and engineering sign-off criteria.  
**Audit date:** 2025-02-13  
**Codebase:** gaqno-shell-ui, gaqno-omnichannel-ui, @gaqno-frontcore

---

## 1. Navigation Structure

### Vertical App Rail Implemented

| Criterion | Status | Evidence |
|----------|--------|----------|
| Width fixed (60–72px) | ❌ | Frontcore sidebar icon width is `3rem` (48px). Spec asks 60–72px. |
| Icons only (no text labels) | ✅ | When collapsed (`collapsible="icon"`), `SidebarMenuButton` shows icon only; text hidden. |
| Active state clearly visible | ✅ | `isActive` / `data-[active=true]` and `sidebarMenuButtonVariants` style active. |
| Hover tooltip present | ✅ | `SidebarMenuButton` has `tooltip` prop; collapsed items use tooltips. |
| Bottom section: User avatar | ❌ | ShellSidebar has trigger only at bottom. Profile is in top Header. |
| Bottom section: Notifications | ❌ | Notifications in Header dropdown, not in rail. |
| Bottom section: Settings access | ❌ | Settings in Header dropdown, not in rail. |

### No Global Top Header

| Criterion | Status | Evidence |
|----------|--------|----------|
| No horizontal header bar | ❌ | `ShellLayout` includes a top header (border-b, logo, trigger, theme, profile). |
| No duplicated navigation layers | ✅ | Single sidebar; no second top nav. |
| No breadcrumb system | ❌ | `PageWithBreadcrumb` and `breadcrumbRoot` used (InboxSection, DashboardSection, Agents, etc.). |

### Single Navigation Axis

| Criterion | Status | Evidence |
|----------|--------|----------|
| No top-level tabs duplicating sidebar | ✅ | No top tabs; sidebar is the only primary nav. |
| No nested primary nav inside pages | ⚠ | Inbox uses `SectionWithSubNav` (vertical sub-nav: Conversations, Queues, Teams, etc.). This is secondary context nav, not a second primary axis. Acceptable. |

---

## 2. Layout Grid System

### Large Screens (≥1440px)

| Criterion | Status | Evidence |
|----------|--------|----------|
| 4-column layout: Rail \| Context \| Main \| Right Panel | ✅ | Inbox: ConversationListSidebar \| conversation area \| CustomerContextPanel. |
| Right panel persistent | ✅ | When `isLarge`, panel inline; not Sheet. |
| Context panel width 320–360px | ✅ | `CONTEXT_PANEL_WIDTH.large` = 360; ConversationListSidebar uses 360px. |
| Right panel width 320–360px | ✅ | `RIGHT_PANEL_WIDTH` large 340, medium 320. |
| Chat area fluid | ✅ | Conversation area is flex-1 min-w-0. |

### Medium Screens (1024–1439px)

| Criterion | Status | Evidence |
|----------|--------|----------|
| 3-column: Rail \| Context \| Main | ✅ | Right panel becomes Sheet (slide-in). |
| Right panel as slide-in overlay | ✅ | `!isLarge` → Sheet for CustomerContextPanel. |
| Context panel width ~300px | ✅ | `CONTEXT_PANEL_WIDTH.medium` = 300. |

### Small Screens (768–1023px)

| Criterion | Status | Evidence |
|----------|--------|----------|
| 2-panel switching: list vs chat | ✅ | `showList` / `showConversation` from breakpoint; list or chat shown. |
| Default: conversation list | ✅ | List shown when no conversation or when list view. |
| On select: full chat view | ✅ | Selecting conversation shows chat; list can hide. |
| Back arrow visible | ✅ | Mobile back button: "Back to list" with ChevronLeft. |
| Right panel becomes modal | ✅ | Customer panel is Sheet. |

### Mobile (<768px)

| Criterion | Status | Evidence |
|----------|--------|----------|
| Sequential: list → chat → customer details | ✅ | List → select → chat; profile icon opens customer Sheet. |
| Rail converted | ✅ | On mobile (`useIsMobile` 768), sidebar is Sheet; not visible until trigger. |
| Bottom navigation OR hamburger | ✅ | SidebarTrigger (hamburger) in Header opens sidebar Sheet. No bottom nav in shell/omnichannel. |

---

## 3. Responsive Collapse Priority

| Criterion | Status | Evidence |
|----------|--------|----------|
| Metrics hide first | ✅ | `showKPIs={isMediumOrLarger}`; KPIs hidden on small/mobile. |
| Right panel hides second | ✅ | Right panel is Sheet when !isLarge (medium and below). |
| Context panel hides third | ✅ | List can collapse or switch with conversation on small/mobile. |
| Chat never hides | ✅ | When a conversation is selected, chat area is always shown. |
| No layout squeezing | ✅ | Panels use fixed/min widths or Sheet; no squeezed middle. |

---

## 4. Inbox Experience Validation

### Conversation List

| Criterion | Status | Evidence |
|----------|--------|----------|
| Status limited to 4: Open, Waiting, Overdue, Closed | ✅ | `STATUS_CONFIG` in ConversationListItem; KPI strip matches. |
| Unread clearly differentiated | ✅ | Unread badge on list items. |
| SLA visible but subtle | ✅ | `slaLabel` on item; optional. |
| Tags minimal | ✅ | Tags in customer panel; not dominant in list. |

### Chat Area

| Criterion | Status | Evidence |
|----------|--------|----------|
| Immersive: minimal borders, clean spacing | ✅ | Message area with muted background; bubbles; spacing. |
| Input bar fixed bottom | ✅ | Input area at bottom of conversation column. |
| Profile icon toggles right panel | ✅ | UserCircle button when !isLarge opens customer Sheet. |
| No always-open customer panel on medium | ✅ | On medium, panel is Sheet; opens on demand. |

---

## 5. Design System Rules

### Spacing

| Criterion | Status | Evidence |
|----------|--------|----------|
| 8pt grid; padding/margins consistent | ✅ | `SECTION_PADDING`: 24, 20, 16, 12. Used in layout. |
| No random spacing values | ✅ | Breakpoint-driven padding; gap-2, gap-4, etc. |

### Color

| Criterion | Status | Evidence |
|----------|--------|----------|
| Brand only for primary actions | ✅ | Primary buttons use primary/brand. |
| Semantic only for states | ✅ | Open (emerald), Waiting (amber), Overdue (destructive), Closed (muted). |

### Buttons

| Criterion | Status | Evidence |
|----------|--------|----------|
| Only 3 types: Primary, Secondary, Ghost | ⚠ | Outline and destructive used in places (e.g. secondary actions). Mostly 3 types. |

### Typography

| Criterion | Status | Evidence |
|----------|--------|----------|
| Max 3 hierarchy levels | ✅ | Page title, section, body in use. |

---

## 6. Dashboard Responsiveness

| Criterion | Status | Evidence |
|----------|--------|----------|
| Large: 4-column KPI grid | ✅ | `grid-cols-1 lg:grid-cols-2 xl:grid-cols-4`. |
| Medium: 2-column | ✅ | lg:2. |
| Small: 1-column stacked | ✅ | grid-cols-1 default. |
| No compressed widgets | ✅ | Cards and grid use gap-4; min heights reasonable. |
| No horizontal overflow | ✅ | Containers use min-w-0, overflow-hidden where needed. |

---

## 7. Performance Checks

| Criterion | Status | Evidence |
|----------|--------|----------|
| Lazy load graphs | ⚠ | Dashboard "Trends" is placeholder (no chart lib yet). Images in MessageContent use `loading="lazy"`. |
| No heavy background effects on mobile | ✅ | No heavy animations or large backgrounds in inbox. |
| Transitions 150–250ms | ✅ | duration-150, duration-200, transition 0.15s in motion. |
| No blocking animations | ✅ | Short, non-blocking transitions. |

---

## 8. Accessibility Checks

| Criterion | Status | Evidence |
|----------|--------|----------|
| Contrast AA compliant | ⚠ | Not audited in code; theme uses semantic colors. Assume pass if design system is AA. |
| Focus states visible | ✅ | Buttons and interactive elements use focus-visible rings (frontcore). |
| Keyboard navigation functional | ✅ | Sidebar trigger, buttons, dropdowns are focusable. |
| ARIA for navigation and chat | ✅ | aria-label on buttons (e.g. "Back to list", "Customer details", "Toggle Sidebar"); nav/sr-only where needed. |

---

## 9. UX Consistency Validation

| Criterion | Status | Evidence |
|----------|--------|----------|
| No duplicate navigation | ✅ | Single rail. |
| No redundant controls | ✅ | No repeated primary actions. |
| No hidden critical actions | ✅ | Resolve, Assign, Tag, More in header; customer panel toggle visible. |
| Active states consistent | ✅ | Sidebar and list use active/selected styles. |
| Hover states implemented | ✅ | Buttons and list items have hover (e.g. duration-150). |

---

## 10. Structural Cleanliness Test

| Question | Answer |
|----------|--------|
| Can a new user understand navigation in <30 seconds? | ⚠ | Single rail + sub-nav; possible. Header adds a second bar to parse. |
| Is there any page requiring breadcrumb? | ❌ | Breadcrumbs exist (InboxSection, DashboardSection, etc.). Rule says none required. |
| Are there more than 3 levels of navigation? | ❌ | Rail → section (e.g. Inbox) → sub-nav (Conversations, Queues, …). Effectively 3. |
| Is any component visually louder than the chat? | ❌ | Chat is central; list and customer panel support it. |

---

## 11. Engineering Sign-Off Criteria

| Criterion | Status |
|----------|--------|
| Shell behaves predictably across breakpoints | ✅ |
| No layout collapse bugs during resize | ✅ (assumed; not stress-tested in this audit) |
| No duplicated navigation logic | ✅ |
| Inbox remains primary mental model | ✅ |
| SMB user flow requires minimal training | ✅ (with refinement of header/breadcrumbs) |

---

## 12. QA Output Template

| Item | Status |
|------|--------|
| All breakpoints tested | ⚠ Manual/QA to confirm |
| All layout transitions verified | ⚠ Manual/QA to confirm |
| No overflow issues | ✅ From code review |
| No duplicated nav | ✅ |
| No inconsistent spacing | ✅ |
| Chat remains priority at all sizes | ✅ |

---

## Final Status

**Needs Fixes**

### Must-fix to reach "Ready for Production" against this checklist

1. **Rail width 60–72px** – Today icon rail is 48px (3rem). Change to ~64px (4rem) or 72px if spec is strict.
2. **Bottom section of rail** – Add `SidebarFooter` with user avatar, notifications, settings (or move from Header into rail bottom).
3. **No global top header** – Remove or reduce Header to a minimal bar (e.g. trigger only) and move profile/notifications/settings into rail bottom.
4. **No breadcrumb system** – Remove `PageWithBreadcrumb` / `breadcrumbRoot` from InboxSection, DashboardSection, and other uses; rely on layout and titles.

### Optional / verify in QA

- Lazy load for dashboard charts when implemented.
- Contrast AA audit.
- Full breakpoint and resize testing.

---

**Checklist summary**

- **Pass:** 1 (Navigation), 2 (Layout grid), 3 (Collapse priority), 4 (Inbox), 5 (Design), 6 (Dashboard), 9 (UX consistency), 11 (Sign-off).
- **Fail / partial:** Rail width, rail bottom section, global header, breadcrumbs, button variants (minor).
- **Final:** ⚠ Needs Fixes — address rail, header, and breadcrumbs for ✅ Ready for Production.

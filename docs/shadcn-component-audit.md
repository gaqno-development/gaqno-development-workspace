# Shadcn-style component audit (by context and requirements)

This document maps **project contexts** and **requirements** to places where we can implement or align with better (shadcn-style) components. It uses the **shadcn MCP** (`npx shadcn@latest mcp`) and the shared doc [shadcn-components-replacement.md](./shadcn-components-replacement.md).

---

## How to use the shadcn MCP

- **Registry:** Project has `@shadcn` configured (no `components.json` in repo; frontcore is the shared UI source).
- **Tools:** `get_project_registries`, `list_items_in_registries`, `search_items_in_registries`, `get_item_examples_from_registries`, `get_add_command_for_items`, `get_audit_checklist`.
- **Adding components:** Run `npx shadcn@latest add <component>` in the target package (e.g. `@gaqno-frontcore` or an app). Prefer adding to frontcore when the component is shared.

---

## Shadcn MCP alignment check (correct components?)

Verified against **@shadcn** registry via MCP (`list_items_in_registries`, `get_item_examples_from_registries`):

| Our component | Shadcn registry | Alignment |
|---------------|-----------------|-----------|
| **Spinner** | `spinner` | ✅ Correct. Same pattern: Loader2 + `animate-spin`, `className` for size/color. We have `role="status"` and `aria-label="Loading"` (a11y). |
| **EmptyState** | `empty` | ✅ Correct usage, different API. Shadcn uses **composition**: `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`. We use a **single prop-based** `EmptyState` (icon, title, description, action, children). Same purpose; our API is simpler for the common case. No change required. |
| **Command** | `command` | ✅ We use Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut (cmdk). Matches shadcn. |
| **Chart** | `chart` | ✅ We use ChartContainer, ChartTooltip, ChartLegend + Recharts. Matches shadcn. |
| **Dialog / Sheet / Drawer** | `dialog`, `sheet`, `drawer` | ✅ We have Dialog, AlertDialog, Sheet, Drawer, ResponsiveSheetDrawer. Correct. |
| **Breadcrumbs** | `breadcrumb` | ✅ We export `breadcrumbs` (shadcn name is `breadcrumb`). Same primitive; naming is fine. |
| **Form, Input, Select, Label, etc.** | `form`, `input`, `select`, `label`… | ✅ Present in frontcore; usage matches. |

**After adding or changing components:** Run MCP **get_audit_checklist** (no args): verify imports, dependencies, lint, TypeScript, and Playwright if available.

---

## 1. Spinner (loading states)

**Requirement:** Consistent loading indicators; no raw `Loader2` + `animate-spin` outside the shared `Spinner`.

**Context → Where to implement**

| Context        | Location (examples)                                                                 | Action |
|----------------|--------------------------------------------------------------------------------------|--------|
| **gaqno-rpg-ui** | QuickDiceRoller, NextAbilities, MagicDialogContent, AbilitiesDialogContent, NarrativeFlow, MasterActionChat, CharacterSheet, CharacterCreationWizard, CampaignStepEditor, SessionView, RulesView, DndDetailView, CampaignsListView, CampaignWizardView, RPGInput, item-detail, SessionSettings, SpellCard, SkillTree, SuggestionLoadingIndicator, MonsterSuggestions, DndSearchCommand, Dnd5eCategoryView, AIButtons, ActionProgressIndicator | Replace `<Loader2 className="… animate-spin" />` with `<Spinner />` from frontcore (or RPG-specific wrapper if theme required). |
| **gaqno-ai-ui**  | WorldSettingsStep, ToneStyleStep, StructureStep, ItemsStep, CreateBookWizard, CharactersStep, BasicInfoStep, CharacterEditor, ChapterEditor, BlueprintStructure, AISuggestionPopover, BookExportPage | Same: use `Spinner` from frontcore. |
| **gaqno-shell-ui** | DashboardPage, UserDashboardPage, SettingsPage, ProfilePage, ManagerDashboardPage (inline loading) | Prefer `Spinner` for inline/small loading; keep `LoaderPinwheelIcon` for full-page where already used. |
| **@gaqno-frontcore** | SSLChecker uses `RefreshCw` + `animate-spin` (semantic: “refresh in progress”) | Keep as-is or add a small “progress” variant if we want consistency. |

**Shadcn registry:** `spinner` (registry:ui). Frontcore Spinner is aligned (Loader2, role="status", aria-label="Loading", className for size/color).

---

## 2. Empty states

**Requirement:** Consistent “no data” / “no results” UX; optional CTA (e.g. “Create first item”).

**Context → Where to implement**

| Context              | Current pattern                                                                 | Action |
|----------------------|----------------------------------------------------------------------------------|--------|
| **@gaqno-frontcore** | `EmptyState` (Card + icon, title, description, action/secondaryAction, children) in `empty-state.tsx`; used by DataTable, others | Aligned with shadcn intent; we use prop-based API (shadcn uses composition). |
| **gaqno-omnichannel-ui** | Done: frontcore `EmptyState` everywhere; no wrapper components. | — |
| **gaqno-rpg-ui**     | `EmptyState` in NarrativeFlow (message-only), RPGCard wrapping                         | Use frontcore `EmptyState` with icon + title + description for consistency. |
| **gaqno-ai-ui**      | BooksListPage, BookDetailPage, BookCoverPage                                        | Use frontcore `EmptyState` for list/detail empty. |
| **gaqno-crm-ui**     | `PlaceholderPage` (title + description)                                              | Use `EmptyState` for list/content placeholders; keep PlaceholderPage for “coming soon” if needed. |
| **DataTable**        | Built-in empty + empty-search (SearchX + text); `renderEmptyState` / `renderEmptySearchState` | Keep; ensure copy and layout match design; optional use of shadcn **empty** block for richer layout. |

**Shadcn registry:** `empty` (registry:ui); examples: `empty-icon`, `empty-demo`, `empty-avatar`, `empty-outline`, `empty-background`.

---

## 3. Dialogs and sheets (modals / panels)

**Requirement:** Use Dialog for confirmations and small forms; use Sheet/Drawer (or ResponsiveSheetDrawer) for side panels and mobile-friendly flows.

**Context → Where to implement**

| Context              | Current pattern                                                                 | Action |
|----------------------|----------------------------------------------------------------------------------|--------|
| **@gaqno-frontcore** | Dialog, AlertDialog, ResponsiveSheetDrawer, Sheet                                | Standard: non-confirmation modals → ResponsiveSheetDrawer; confirmations → AlertDialog. Document in replacement doc. |
| **gaqno-omnichannel-ui** | Sheet for customer panel (InboxPage); MobileConversationSheets; assign sheet          | Already Sheet; ensure mobile uses Drawer where appropriate (ResponsiveSheetDrawer if moved to frontcore pattern). |
| **gaqno-rpg-ui**    | RPGDialogModal (Radix Dialog primitives, custom styling); MasterActionCardsWithDialogs; useCollapsibleDialog | Optionally wrap content in frontcore Dialog/AlertDialog for consistency; keep RPG theme (amber, etc.) via className. |
| **gaqno-finance-ui** | CategoryManagementDialog                                                          | Use frontcore Dialog + Form; consider ResponsiveSheetDrawer on small viewports for create/edit. |
| **gaqno-shell-ui**  | WidgetConfigDialog                                                               | Use frontcore Dialog or ResponsiveSheetDrawer by layout needs. |
| **gaqno-admin-ui**   | UsagePage → UsageByUserView (admin component)                                    | Ensure admin dialogs/sheets use frontcore Dialog/Sheet/ResponsiveSheetDrawer. |

**Shadcn registry:** `dialog`, `sheet`, `drawer`, `alert-dialog`. We already have equivalents; align props and composition (e.g. DialogHeader, DialogFooter) with shadcn where it helps.

---

## 4. Forms and inputs

**Requirement:** Consistent form layout, validation feedback, and accessible controls (Form + Label + Input/Select/Checkbox, etc.).

**Context → Where to implement**

| Context              | Current pattern                                                                 | Action |
|----------------------|----------------------------------------------------------------------------------|--------|
| **@gaqno-frontcore** | Form (react-hook-form + zod), Input, Select, Label, Checkbox, Textarea, DatePicker | Keep; consider shadcn **field** / **input-group** for composite fields if we add them. |
| **gaqno-rpg-ui**     | RPGInput (with Loader2 for AI), custom forms                                    | Use frontcore Input + Spinner for loading; align validation with Form. |
| **gaqno-ai-ui**      | CreateBookWizard steps (inputs + loaders)                                       | Use frontcore Form + Input + Spinner; optional **input-otp** for codes if ever needed. |
| **gaqno-omnichannel-ui** | TemplateListSidebar search/filter; ConversationListSidebar search              | Already frontcore Input; ensure all filters use same pattern. |

**Shadcn registry:** `form`, `input`, `input-group`, `input-otp`, `field`, `label`, `select`, `checkbox`, `textarea`. Frontcore already covers most; add **input-otp** to frontcore only if a product requirement appears.

---

## 5. Command palette and search

**Requirement:** Universal search / command palette built with Command (cmdk).

**Context → Where to implement**

| Context              | Current pattern                                                                 | Action |
|----------------------|----------------------------------------------------------------------------------|--------|
| **gaqno-omnichannel-ui** | Layout Command dialog; Inbox registers commands (Focus search, Resolve, Assign)   | Done. Use same pattern for Templates/Queues/Agents if we add global commands. |
| **gaqno-rpg-ui**    | DndSearchCommand (RPGCommandDialog + RPGCommandInput)                           | Consider migrating to frontcore Command + same dialog pattern for consistency (optional; RPG theme can stay). |
| **gaqno-shell-ui**  | No global command yet                                                            | Add a shell-level CommandDialog (e.g. Cmd+K) and let apps register commands via context (like omnichannel). |
| **gaqno-admin-ui**  | No command palette                                                               | Add Command for “Go to page” / “Search users” if scope grows. |

**Shadcn registry:** `command`. Frontcore has it; extend usage to shell/admin where it fits.

---

## 6. Data tables and lists

**Requirement:** Sortable, filterable tables with empty states and optional row actions.

**Context → Where to implement**

| Context              | Current pattern                                                                 | Action |
|----------------------|----------------------------------------------------------------------------------|--------|
| **@gaqno-frontcore** | DataTable (columns, sorting, filtering, Sheet for filters, EmptyState, pagination) | Keep; align empty/filter UI with shadcn **table** + **empty** if we refresh the block. |
| **gaqno-admin-ui**   | UsageByUserView (likely table/list)                                              | Use frontcore DataTable for usage tables; use EmptyState for “no usage” from UsagePage. |
| **gaqno-omnichannel-ui** | QueuesPage, TeamsPage, AgentsPage                                               | Prefer DataTable for tabular data; use frontcore Table + Select/Dropdown for simple lists. |
| **gaqno-crm-ui**     | Dashboard and list views                                                         | Use DataTable + EmptyState for CRM lists. |
| **gaqno-shell-ui**   | NexAiRequestsPage, UsersList, dashboard grids                                    | Use DataTable where layout is table-like; WidgetConfigDialog already in use. |

**Shadcn registry:** `table`, `pagination`; blocks like `dashboard-01` (dashboard with data table). Use as reference for layout only; frontcore DataTable remains the implementation.

---

## 7. Charts and dashboard stats

**Requirement:** Dashboards use Chart (Recharts) + stat cards + activity/lists.

**Context → Where to implement**

| Context              | Current pattern                                                                 | Action |
|----------------------|----------------------------------------------------------------------------------|--------|
| **gaqno-shell-ui**   | DashboardPage: OverviewCard grid, ServiceUsageChart (AreaChart), ActivityItem list | Done. Reuse pattern elsewhere. |
| **gaqno-admin-ui**   | UsagePage (UsageByUserView)                                                      | Add Chart + stat cards if we show usage over time or per-user metrics (align with shell dashboard pattern). |
| **gaqno-finance-ui** | DashboardView                                                                   | Use frontcore ChartContainer + Recharts + OverviewCard-style blocks for KPIs. |
| **gaqno-crm-ui**     | Dashboard overview                                                               | Same: Chart + stat cards + lists. |

**Shadcn registry:** `chart`; blocks: `dashboard-01`. Frontcore has Chart; document dashboard pattern (already in shadcn-components-replacement.md).

---

## 8. Components to add only when required

- **Menubar:** Add to frontcore only if a product needs a desktop “File / Edit / View” menubar (e.g. admin or editor).
- **Carousel:** Add to frontcore if we need image/content carousels (e.g. onboarding, galleries).
- **Sonner (toast):** Frontcore has toast; sonner is an alternative; switch only if we standardize on sonner.
- **Resizable / Slider:** Add to frontcore when a concrete use case appears (e.g. resizable panels, volume).
- **Combobox:** Add to frontcore if we need searchable select (e.g. user picker, entity search) and use it from admin/omnichannel/crm.

---

## 9. Summary by app

| App / package       | High-impact improvements |
|---------------------|---------------------------|
| **gaqno-rpg-ui**    | Spinner everywhere; optional Command + Dialog alignment with frontcore. |
| **gaqno-ai-ui**     | Done: Spinner in CreateBookWizard steps, CharacterEditor, ChapterEditor, BlueprintStructure, AISuggestionPopover, BookExportPage. Books pages already use frontcore EmptyState. |
| **gaqno-omnichannel-ui** | Done: EmptyState everywhere (ConversationListEmpty, InboxPage, TemplatesPage, QueuesPage, TemplateListSidebar); ListEmptyState removed. Command in layout. |
| **gaqno-shell-ui**  | Optional global Command (Cmd+K); Spinner for inline loading; DataTable/Chart where applicable. |
| **gaqno-admin-ui**  | UsagePage/UsageByUserView: DataTable + EmptyState; optional Command later. |
| **gaqno-finance-ui**| DashboardView: Chart + stat cards; CategoryManagementDialog → Dialog/ResponsiveSheetDrawer. |
| **gaqno-crm-ui**    | PlaceholderPage → EmptyState where appropriate; DataTable for lists. |
| **@gaqno-frontcore**| Align EmptyState with shadcn **empty** if useful; document Dialog/Sheet/Drawer usage; add components from §8 only when required. |

---

## Running the shadcn MCP audit checklist

After adding or changing components, run the MCP tool **get_audit_checklist** (no arguments). It returns a short checklist:

- Ensure imports are correct (named vs default)
- If using `next/image`, configure `images.remotePatterns` in next.config.js
- Ensure all dependencies are installed
- Check for lint and TypeScript errors
- Use Playwright MCP for E2E if available

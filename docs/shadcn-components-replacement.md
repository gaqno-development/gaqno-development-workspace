# Shadcn-style components: where to use them

**See also:** [shadcn-component-audit.md](./shadcn-component-audit.md) for a **context- and requirement-based audit** (by app and use case) and how to use the **shadcn MCP** (`npx shadcn@latest mcp`) to discover and add components.

## Spinner

**Status:** Added to `@gaqno-frontcore` as `Spinner` (Loader2 + animate-spin). Export: `import { Spinner } from "@gaqno-development/frontcore/components/ui"`.

**Replace:** Any `Loader2` (or similar) + `animate-spin` with `<Spinner />` (or `<Spinner className="…" />` for size/color).

| App / package | Files to update |
|---------------|-----------------|
| **gaqno-rpg-ui** | QuickDiceRoller, NextAbilities, MagicDialogContent, AbilitiesDialogContent, NarrativeFlow, MasterActionChat, CharacterSheet, CharacterCreationWizard, CampaignStepEditor, SessionView, RulesView, DndDetailView, CampaignsListView, CampaignWizardView, RPGInput, item-detail, SessionSettings, SpellCard, SkillTree, SuggestionLoadingIndicator, MonsterSuggestions, DndSearchCommand, Dnd5eCategoryView, AIButtons, ActionProgressIndicator |
| **gaqno-ai-ui** | WorldSettingsStep, ToneStyleStep, StructureStep, ItemsStep, CreateBookWizard, CharactersStep, BasicInfoStep, CharacterEditor, ChapterEditor, BlueprintStructure, AISuggestionPopover, BookExportPage |
| **gaqno-omnichannel-ui** | ✅ Done: MobileConversationSheets, InboxMessagesList, ConversationHeader, CustomerContextPanel, CreateTemplatePanel, TemplateDetailPanel, AISuggestionPopover, AISuggestionInline, AgentPersonasPage |
| **gaqno-shell-ui** | Already uses `LoaderPinwheelIcon` for full-page loading; can use `Spinner` for inline/small loading if desired (DashboardPage, UserDashboardPage, SettingsPage, ProfilePage, ManagerDashboardPage). |
| **@gaqno-frontcore** | Button and Input use `LoaderPinwheelIcon` by design; use `Spinner` in new features or when a simple circular loader is preferred. SSLChecker uses RefreshCw + animate-spin (different semantic: “refresh”, not “loading”). |

Use `data-icon="inline-start"` / `data-icon="inline-end"` when placing Spinner inside Button or Badge (per shadcn docs).

---

## Toggle

**Status:** Already in `@gaqno-frontcore` (Radix). Export: `import { Toggle, toggleVariants } from "@gaqno-development/frontcore/components/ui"`.

**Use for:** Two-state buttons (on/off). Already used via Radix; no migration needed. ThemeToggle in header and landing (DarkModeToggle, ModeToggle) are custom buttons; could be refactored to use `Toggle` if we want consistent pressed state styling.

---

## Menubar

**Status:** Not in frontcore. Present in **gaqno-landing-ui** (`components/ui/menubar.tsx`, Radix). Doc: Radix Menubar.

**Add to frontcore:** To share across React apps, add `@radix-ui/react-menubar` to frontcore and a `menubar.tsx` mirroring landing’s (or the shadcn snippet). No current usages in shell/admin/rpg/ai; useful for desktop-style “File / Edit / View” bars.

---

## Drawer

**Status:** Not in workspace. Mobile “modules drawer” in shell is the **Sheet** (sidebar), not Vaul.

**Add to frontcore:** To match shadcn, add `vaul` and a `drawer.tsx` (Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose). Use for bottom/side panels and for the “responsive dialog” pattern (Dialog on desktop, Drawer on mobile).

---

---

## Chart (Recharts)

**Status:** In `@gaqno-frontcore` (Recharts + shadcn-style wrappers). Export: `import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@gaqno-development/frontcore/components/ui"`. Type: `ChartConfig`.

**Stack:** Build charts with Recharts primitives (`BarChart`, `AreaChart`, `LineChart`, etc.) and use frontcore’s `ChartContainer` (with `config`), `ChartTooltip` + `ChartTooltipContent`, and optionally `ChartLegend` + `ChartLegendContent`. Set `min-h-[…]` or `h-[…]` on `ChartContainer` for responsiveness. Chart colors: use `var(--color-<key>)` from config or CSS variables `--chart-1` … `--chart-5` in `globals.css` (light and `.dark`).

**Dashboard pattern (stats + charts):** In **gaqno-shell-ui**, the main dashboard uses:
- **Stats:** `OverviewCard` grid (title, value, trend, description).
- **Chart:** `ServiceUsageChart` (AreaChart inside `ChartContainer` with `ChartTooltipContent`, time-range selector).
- **Activity:** List of `ActivityItem` (e.g. “Recent Activity”).

Other dashboards (finance, CRM, admin, etc.) can reuse the same pattern: stat cards → chart(s) → lists or secondary widgets.

---

## Summary

| Component | In frontcore? | Action |
|-----------|----------------|--------|
| Spinner   | Yes (new)      | Replace Loader2 + animate-spin across apps with `<Spinner />`. |
| Toggle    | Yes (Radix)    | Use as-is; optional: use in ThemeToggle/DarkModeToggle. |
| Menubar   | No             | Optional: add to frontcore from Radix for desktop menubars. |
| Drawer    | Yes (Vaul)      | Use `Drawer` for mobile panels; use `ResponsiveSheetDrawer` for desktop=Sheet + mobile=Drawer (all non-confirmation modals). |
| Chart     | Yes (Recharts)  | Use for dashboards: `ChartContainer` + Recharts + tooltip/legend; pair with stat cards and activity lists. |
| Command   | Yes (cmdk)      | Use for universal search / command palette: `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`. Omnichannel: header trigger opens one shared dialog; pages register commands via `OmnichannelCommandContext`. |

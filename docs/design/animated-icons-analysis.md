# Animated Icons – Analysis and Replacement Plan

## Current state: what is already animated

The only animated icon pattern used today is **Loader2 + Tailwind `animate-spin`** (spinning loader). It appears in:

- **Frontcore:** `Input.tsx`, `InputWithAI.tsx`, `SSLChecker.tsx` (RefreshCw gets `animate-spin` when checking), `button/index.tsx` (custom spinner div), `FeatureGuard.tsx`, `RootAdminGuard.tsx`
- **gaqno-omnichannel-ui:** TemplateDetailPanel, CreateTemplatePanel, AISuggestionPopover, AISuggestionInline, AgentPersonasPage
- **gaqno-ai-ui:** CreateBookWizard (multiple steps), CharacterEditor, ChapterEditor, BlueprintStructure, AISuggestionPopover, BookExportPage
- **gaqno-rpg-ui:** MasterActionChat, CharacterCreationWizard, CharacterSheet, NarrativeFlow, QuickDiceRoller, SessionView, and many others
- **gaqno-shell-ui:** (see “Spinner consistency” below – some pages use a div instead of Loader2)

So the “one you’re already using” is **Loader2 with `animate-spin`** for loading states.

---

## Where icons are not animated (candidates for animated versions)

### 1. Bell (notifications)

| Location                                           | Usage                      | Suggestion                                                    |
| -------------------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| `@gaqno-frontcore` app-sidebar                     | User menu → “Notificações” | Animate (e.g. ring/pulse) when there are unread notifications |
| gaqno-omnichannel-ui `OmnichannelPageLayout.tsx`   | Header bell                | Same                                                          |
| gaqno-omnichannel-ui `config/omnichannel-menu.tsx` | Menu item icon             | Optional: subtle pulse on “active”                            |

**Goal:** Use an animated Bell (or Bell + badge) for notification affordance; consider `lucide-animated` or a small CSS animation (e.g. `animate-pulse` / custom ring).

---

### 2. Sparkles (AI / suggestions)

| Location                                                                              | Usage              | Suggestion           |
| ------------------------------------------------------------------------------------- | ------------------ | -------------------- |
| gaqno-omnichannel-ui AISuggestionPopover, AISuggestionInline                          | AI suggestion UI   | Subtle glow or pulse |
| gaqno-ai-ui CreateBookWizard (BasicInfoStep, ToneStyleStep), ChapterEditor            | AI / magic actions | Same                 |
| gaqno-rpg-ui NextAbilities, AbilitiesDialogContent, MagicDialogContent, CombatActions | Abilities / magic  | Same                 |

**Goal:** Replace static Sparkles with an animated variant (e.g. from `lucide-animated` or a light motion/CSS animation) where it denotes “AI” or “magic”.

---

### 3. Refresh / RotateCw

| Location                      | Usage             | Suggestion                                                           |
| ----------------------------- | ----------------- | -------------------------------------------------------------------- |
| `@gaqno-frontcore` SSLChecker | Refresh SSL check | Already uses `animate-spin` when `checkingIds.size > 0` – keep as is |

No change needed beyond current behavior.

---

### 4. Other high-visibility static icons (optional)

- **SendHorizontal / Send** – Could add a short “send” animation on click in chat/compose (e.g. omnichannel, RPG).
- **Check / CheckCircle2** – Optional success animation (e.g. after save or template apply).
- **Search** – Optional subtle motion on focus (e.g. in command palettes / InboxCommandPalette).

These are lower priority than Bell and Sparkles.

---

## Spinner consistency: replace custom div spinners with Loader2

Several places use a **custom div** with `animate-spin` instead of **Loader2** from Lucide. Replacing them with Loader2 keeps one pattern and makes future “animated icon” work consistent.

| Location                                  | Current                                                              | Replace with                                               |
| ----------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| gaqno-shell-ui `ProfilePage.tsx`          | `<div className="h-8 w-8 animate-spin rounded-full border-4 ..." />` | `<Loader2 className="h-8 w-8 animate-spin" />`             |
| gaqno-shell-ui `UserDashboardPage.tsx`    | Same div                                                             | Loader2                                                    |
| gaqno-shell-ui `SettingsPage.tsx`         | Same div                                                             | Loader2                                                    |
| gaqno-shell-ui `ManagerDashboardPage.tsx` | Same div                                                             | Loader2                                                    |
| gaqno-shell-ui `DashboardPage.tsx`        | Same div                                                             | Loader2                                                    |
| @gaqno-frontcore `button/index.tsx`       | Div spinner in button                                                | Loader2 (already has Loader2 in some variants – align all) |
| @gaqno-frontcore `FeatureGuard.tsx`       | Div spinner                                                          | Loader2                                                    |
| @gaqno-frontcore `RootAdminGuard.tsx`     | Div spinner                                                          | Loader2                                                    |
| gaqno-rpg-ui `CampaignWizardView.tsx`     | Custom border spinner div                                            | Loader2                                                    |

After replacement, all loading states use the same “animated” icon: **Loader2 + animate-spin**.

---

## Recommended approach for “animated” icons

1. **Loading:** Keep and standardize on **Loader2 + animate-spin**; replace custom div spinners as in the table above.
2. **Bell:** Add an animated Bell (or Bell + CSS) for notification entry points (sidebar, omnichannel header/menu); optionally drive animation by “unread” state.
3. **Sparkles:** Introduce an animated Sparkles (e.g. from `lucide-animated` or a small wrapper with motion) for AI/suggestion/magic surfaces and use it everywhere we currently use static Sparkles for that meaning.
4. **Library option:** If you want more ready-made animated icons, add **lucide-animated** (Motion-based, same family as Lucide) and use it for Bell and Sparkles first; keep `lucide-react` for everything else unless we migrate more icons later.

---

## lucide-animated (recommended library)

**[lucide-animated](https://lucide-animated.com/)** – open-source (MIT) animated React icons built with Motion and Lucide. Same visual family as our current `lucide-react` icons, with smooth built-in animations.

- **Site:** https://lucide-animated.com/
- **Install (from project root or the app that will use them):**
  ```bash
  pnpm add lucide-animated
  # or: npm install lucide-animated
  ```
  If using shadcn: `pnpm dlx shadcn add @lucide-animated/`

**Icons we need (all available in their catalog):**

| Our use       | lucide-animated icon    | Notes                                                                  |
| ------------- | ----------------------- | ---------------------------------------------------------------------- |
| Notifications | `bell`, `bell-electric` | Use for sidebar + omnichannel                                          |
| AI / magic    | `sparkles`              | Use for suggestion/AI UI                                               |
| Loading       | `loader-pinwheel`       | Optional alternative to Loader2+spin; we can keep Loader2+animate-spin |

They also provide **search**, **check**, **refresh-cw**, **refresh-ccw**, and many others if we want to animate more icons later. After adding the dependency, import from `lucide-animated` (or `@lucide-animated/react`) where we want animation and keep `lucide-react` for static icons.

---

## Checklist for implementation

- [x] Add lucide-animated-style components to frontcore (clap, bell, sparkles, loader-pinwheel) via shadcn add + copy to `@gaqno-frontcore/src/components/ui/`.
- [x] Replace custom div spinners in frontcore (button, FeatureGuard, RootAdminGuard) with `LoaderPinwheelIcon`.
- [x] Replace custom div spinners in shell-ui (Profile, Dashboard, Settings, ManagerDashboard, UserDashboard) with `LoaderPinwheelIcon`.
- [x] Replace static Bell in frontcore app-sidebar with `BellIcon` (animated).
- [x] Replace static Sparkles/Loader2 in frontcore Input and InputWithAI with `SparklesIcon` and `LoaderPinwheelIcon`.
- [ ] Replace custom spinner in gaqno-rpg-ui CampaignWizardView with `LoaderPinwheelIcon` (when consuming frontcore).
- [ ] In omnichannel-ui / ai-ui / rpg-ui: optionally replace remaining static Bell/Sparkles/Loader2 with animated icons from `@gaqno-development/frontcore/components/ui` or `components/icons` (AnimatedBellIcon, AnimatedSparklesIcon, LoaderPinwheelIcon).
- [ ] (Optional) Add Send / Check / Search animations where desired.

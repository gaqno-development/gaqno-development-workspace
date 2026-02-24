---
trigger: model_decision
description: Omnichannel/SMB UI design system — clean, fast, focused. Dark-first, 3-level hierarchy, 8pt grid.
globs: gaqno-omnichannel-ui/**/*.tsx, gaqno-omnichannel-ui/**/*.css, gaqno-shell-ui/**/*.tsx, "**/frontcore/**/*.tsx"
---

# Design System Rules (Non-Negotiable)

## 1. Design Principles

- **Action > Decoration**: Every element must serve clarity, status, urgency, or productivity. No decorative UI.
- **3-level hierarchy max**: Level 1 = Primary (Inbox, Active Chat). Level 2 = Secondary (filters, tags). Level 3 = Supporting (meta). If everything has the same weight, nothing is important.
- **Reduce cognitive load**: Max 4 status types. Max 2 button styles in a view. One primary color. No double navigation. SMBs don’t want complexity.

## 2. Color System (Dark-First)

- **Primary brand**: Only for primary buttons, active state, important highlights. Never as large backgrounds.
- **Semantic colors (strict)**:
  - Open → green
  - Waiting → amber/yellow
  - Overdue → red/destructive
  - Closed → muted/neutral
  Use only as system signals, not decoration.
- **Surface layers (dark mode)**: 4 depth layers, each 4–6% lighter than the previous.
  - Layer 0 = App background
  - Layer 1 = Sidebar
  - Layer 2 = Inbox panel
  - Layer 3 = Chat panel
  Prefer separation by elevation/surface, not heavy borders.

## 3. Typography

- Clean sans-serif (Inter, SF, etc.).
- **Conversation name** = semibold. **Metadata** = ~80% opacity (e.g. `text-muted-foreground`). Don’t mix font weights randomly.
- Hierarchy: H1 = page title, H2 = section title, body = normal, caption = metadata.

## 4. Spacing (8pt Grid)

Use only: **8, 16, 24, 32, 48** (Tailwind: `p-2`, `p-4`, `p-6`, `p-8`, `p-12` or equivalent). No arbitrary values. Inconsistent spacing looks cheap.

## 5. Components

- **Buttons**: Only Primary (filled brand), Secondary (outline), Ghost (text only). No extra variants.
- **Status badges**: Rounded pill, small, uppercase or medium weight, consistent padding.
- **Conversation cards**: Fixed layout — Customer name → Preview → Meta (time, unread, agent). Same alignment in every state; never change layout between states.

## 6. UX Behavior

- **Hover feedback** required for: conversation rows, buttons, icons, sidebar items. No dead UI.
- **Transitions**: 150–250ms. No bounce. No excessive motion. Professional only.

## 7. Product Simplicity

If a feature needs explanation to use, it’s too complex for SMB. Simplify before shipping.

## 8. UI Component Imports

In apps that use frontcore (e.g. gaqno-omnichannel-ui, gaqno-shell-ui), **always** import UI components from `@gaqno-development/frontcore/components/ui` or the app alias `@/components/ui` when it points to frontcore. **Never** import directly from `@radix-ui/*` in app code — those primitives are wrapped and styled in frontcore; using Radix directly bypasses the design system and can break styling. ESLint enforces this via shared rules from frontcore: in your app's `.eslintrc.cjs` use `...require("@gaqno-development/frontcore/config/eslint-rules-consumer").rules` so all fronts follow the same source of truth.

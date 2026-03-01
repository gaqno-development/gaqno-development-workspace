# UI Card pattern (workspace standard)

Use this pattern for all section and content cards across apps (SSO, Admin, SaaS, CRM, ERP, Omnichannel, Finance, AI, etc.).

## Standard structure

Use **Card + CardHeader + CardTitle + (CardDescription or `text-sm text-muted-foreground`) + CardContent** from `@gaqno-development/frontcore/components/ui`.

- **Card**: Wrapper from frontcore.
- **CardHeader**: Contains title and optional description.
- **CardTitle**: Section title (use `className="text-sm font-medium"` or `text-base` as needed).
- **CardDescription** (optional): Subtitle; or use a `<p className="text-sm text-muted-foreground">` for secondary text.
- **CardContent**: Main body of the card.

Optional: **CardFooter** for actions when needed.

## Reference

- **CRM** is the reference implementation: see [gaqno-crm-ui/src/pages/README.md](../gaqno-crm-ui/src/pages/README.md) (CRM style checklist).
- Layout: Prefer `div className="space-y-4"` (or `space-y-5`) for page content; use DataTable + EmptyState from frontcore for lists.

## Exceptions

- **Themed apps** (e.g. RPG with RPGCard): May use custom card UI for the theme.
- **Highly animated components** (e.g. Wellness HabitCard): May keep custom card-like layout when animation is central.

Even in those cases, consider using frontcore Card as the inner structure where it does not conflict with the design.

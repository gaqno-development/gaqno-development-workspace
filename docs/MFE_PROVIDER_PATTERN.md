# MFE provider pattern

This document describes how React context providers (Auth, Tenant, I18n, and MFE-specific) must be set up so that every micro-frontend (MFE) works both when run **standalone** and when loaded by the **shell** (portal) as a remote.

## Shell loading strategies

| Strategy | Shell mounts | MFEs |
|----------|-------------|------|
| **Full App only** | `remote/App` | CRM, Finance, PDV, RPG, SSO, Admin |
| **Layout + pages** | Route layout + individual page components (App never mounted) | AI, SAAS, Wellness |
| **Mixed** | Individual pages for some routes + `remote/App` for catch-all | ERP, Omnichannel |

When the shell uses **layout + pages** or **mixed**, a given route may render only a **route layout** and a **page** component. The MFE’s `App.tsx` is not in the tree, so any providers defined only in `App.tsx` are missing. That leads to errors like “useAuth must be used within an AuthProvider” or “useChannelContext must be used within ChannelProvider”.

## Rule: same context in layout as in App

- **When the shell mounts only a layout + page components** (and never mounts the MFE’s App), the **route layout** of that MFE must provide the same context that the MFE’s **App** would provide when run standalone or when loaded as `remote/App`.
- **When the shell mounts `remote/App`**, the MFE’s `App.tsx` must wrap content with every provider that the MFE’s code expects (Auth, Tenant, I18n, and any MFE-specific provider), so that the same bundle that provides the hooks also provides the context.

## Provider order

Use this order in both App and route layouts:

1. **AuthProvider** (if the MFE uses `useAuth`)
2. **TenantProvider** (if the MFE uses `useTenant`)
3. **I18nProvider** (if the MFE uses i18n / `useTranslation`)
4. **MFE-specific providers** (e.g. Omnichannel: **ChannelProvider**)
5. Content (or `<Outlet />` in a route layout)

## Per-MFE summary

| MFE | Shell loads | Providers in App.tsx | Providers in route layout |
|-----|-------------|----------------------|----------------------------|
| CRM, PDV, RPG, SSO, Admin | App only | I18n; Auth where the MFE uses useAuth | N/A |
| Finance | App only | AuthProvider, TenantProvider, I18nProvider | N/A |
| SAAS | SaasRouteLayout + pages | AuthProvider, I18nProvider | AuthProvider |
| AI | AIRouteLayout + pages | AuthProvider, TenantProvider, I18nProvider | AuthProvider, TenantProvider, I18nProvider |
| Wellness | WellnessRouteLayout + pages | I18nProvider | AuthProvider, TenantProvider, I18nProvider |
| Omnichannel | OmnichannelRouteLayout + pages (+ App catch-all) | AuthProvider, TenantProvider, I18nProvider, ChannelProvider | AuthProvider, TenantProvider, I18nProvider, ChannelProvider |
| ERP | Pages + App catch-all | I18nProvider | None (ERP pages don’t need Auth/Tenant from remote) |

## Adding a new MFE or route layout

1. If the shell will mount a **route layout** for that MFE (e.g. `XRouteLayout`), implement the layout so it wraps its children (or `<Outlet />`) with the same provider stack as the MFE’s App: AuthProvider, TenantProvider, I18nProvider, and any MFE-specific provider. Call `initI18n()` before rendering if the layout or its children use i18n.
2. If the MFE exposes `./App`, ensure App.tsx wraps content with AuthProvider, TenantProvider (if the MFE uses `useTenant`), I18nProvider, and MFE-specific providers.
3. In the shell, for the MFE’s base path set `element: <Suspense><XRouteLayout /></Suspense>` and keep the same child routes so they render inside the layout’s `<Outlet />`.

## Related

- [Shell and Module Federation routing](shell-federation-routing.md) – how the shell declares routes and lazy-loads remote entries.

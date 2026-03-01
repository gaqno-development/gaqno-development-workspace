K# Shell and Module Federation routing

## Summary

**Yes: all routes are shell-handled.** The shell owns the single router and declares every path. Each MFE (ERP, CRM, Omnichannel, etc.) **exports** page components via Vite Module Federation; the shell **links** those paths to the remote entries and lazy-loads the corresponding component.

## Flow

```mermaid
flowchart LR
  subgraph shell [Shell gaqno-shell-ui]
    Router[createBrowserRouter]
    Router --> PathERP["/erp/*"]
    Router --> PathOmni["/omnichannel/*"]
    PathERP --> LazyERP[lazy(erp/DashboardPage)]
    PathOmni --> LazyOmni[lazy(omnichannel/InboxView)]
  end
  subgraph mfe_erp [ERP MFE]
    ExposesERP[exposes: DashboardPage, CatalogPage, ...]
  end
  subgraph mfe_omni [Omnichannel MFE]
    ExposesOmni[exposes: App, InboxView, DashboardPage, ...]
  end
  LazyERP --> ExposesERP
  LazyOmni --> ExposesOmni
```

1. **Shell** (`gaqno-shell-ui`): Defines the full route tree in `App.tsx` with `createBrowserRouter`. For each segment (e.g. `/erp/dashboard`, `/omnichannel/inbox`), it declares the element as a `lazy(() => import("remoteName/ExposedModule"))` inside `Suspense`.

2. **MFEs**: Each app (e.g. `gaqno-erp-ui`, `gaqno-omnichannel-ui`) uses Vite Federation to **expose** entry points in `vite.config.ts` (e.g. `./DashboardPage`, `./InboxView`). They do **not** define the top-level routes for the host; they only export components.

3. **Catch-all**: For paths the shell does not map to a specific remote page (e.g. `/omnichannel/agents/personas`), the shell often has a `path: "*"` child that renders the MFE’s `App`. That App then has its own internal routing (e.g. Omnichannel’s `useOmnichannelView`) and can show a specific page or a placeholder (e.g. `SectionPage` → `PlaceholderSection` with `getRouteMeta`).

## Adding a new route

- **Shell**: Add a new route and a new `lazy(() => import("remoteName/NewPage"))` in `gaqno-shell-ui/src/App.tsx`.
- **MFE**: Expose the new page in that MFE’s `vite.config.ts` under `exposes` (e.g. `"./NewPage": "./src/pages/NewPage.tsx"`).

So: routes are defined and “handled” in the shell; MFEs only export the page components that the shell links to.

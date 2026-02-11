# Supabase env removal and Coolify redeploys

## Summary

Removed all Supabase environment variable references from the codebase and Coolify; redeployed affected applications.

## Changes

### 1. Local `.env` files (workspace)

Removed Supabase vars from:

- **gaqno-shell-ui**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **gaqno-pdv-ui**, **gaqno-finance-ui**, **gaqno-crm-ui**: `VITE_PUBLIC_SUPABASE_URL`, `VITE_PUBLIC_SUPABASE_ANON_KEY`

### 2. Coolify – env vars deleted

Removed the same Supabase env vars from production and dev apps:

- gaqno-crm-ui / gaqno-crm-ui-dev
- gaqno-finance-ui / gaqno-finance-ui-dev
- gaqno-pdv-ui / gaqno-pdv-ui-dev
- gaqno-shell-ui / gaqno-shell-ui-dev

### 3. Redeployments (Coolify)

Redeployed all 8 applications above so the updated env (without Supabase) is applied.

### 4. Codebase cleanup

- **@gaqno-frontcore**: Removed `"supabase"` from the `exclude` array in `tsconfig.base.json` (if present).
- **Verification**: No remaining references to `VITE_PUBLIC_SUPABASE*`, `NEXT_PUBLIC_SUPABASE*`, or Supabase client imports in source (`.ts`/`.tsx`/`.js`/`.jsx`). `package-lock.json` may still list `@supabase/supabase-js` as a transitive dependency until the next `npm install` if no package declares it directly.

## Rationale

Supabase is no longer used; keeping env vars and config references would be misleading and could cause build/runtime issues if values were required.

## Jira

- [GAQNO-1324](https://gaqno.atlassian.net/browse/GAQNO-1324) – Document: Supabase env removal and Coolify redeploys

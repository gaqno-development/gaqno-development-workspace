# Coolify failed deployments – root causes and fixes

**Script to list failed/retrying apps:** `node scripts/coolify-status-retries.mjs`

## Current failed applications (12)

| App | Root cause | Fix |
|-----|------------|-----|
| **gaqno-admin-service** | Runtime: `Cannot find module '/app/dist/main.js'` | **Fixed:** Dockerfile supports build context = repo root via `ARG BUILD_SUBDIR=gaqno-admin-service` and `COPY ${BUILD_SUBDIR}/...`. In Coolify use context = `.` and Dockerfile = `gaqno-admin-service/Dockerfile`. Redeploy triggered. |
| **gaqno-consumer-service** | Likely same as admin (build path) | **Fixed:** Same pattern in `gaqno-consumer-service/Dockerfile`. Redeploy triggered. |
| **gaqno-crm-service** | Migration: `CREATE TYPE "crm_deal_stage" AS ENUM(...)` — type already exists | **Fixed:** `0000_ambiguous_quasimodo.sql` — CREATE TYPE wrapped in `DO $$ ... IF NOT EXISTS (pg_type) ... END $$`. Redeploy. |
| **gaqno-customer-service** | Same Drizzle CREATE TYPE (if any) | No CREATE TYPE in initial migration; if failure persists, check logs. |
| **gaqno-erp-service** | Same Drizzle CREATE TYPE | **Fixed:** `0000_faithful_blacklash.sql` — CREATE TYPE made idempotent. Redeploy. |
| **gaqno-erp-ui** | Vite: `"useErpOrders" is not exported` from frontcore | Bump and publish `@gaqno-development/frontcore`; erp-ui already has explicit export in frontcore. |
| **gaqno-finance-service** | Same Drizzle CREATE TYPE | **Fixed:** `0000_serious_matthew_murdock.sql` — CREATE TYPE made idempotent. Redeploy. |
| **gaqno-intelligence-service** | Likely migration or runtime | Check logs; apply migration or build-path fix as above. |
| **gaqno-lead-enrichment-service** | Likely migration or runtime | Same. |
| **gaqno-omnichannel-service** | Migration: CREATE TYPE/table already exists → app crashes before listening, healthcheck fails | **Fixed:** `0000_true_tombstone.sql` made idempotent (DO blocks for CREATE TYPE, IF NOT EXISTS for tables/constraints/indexes). Redeploy. |
| **gaqno-saas-service** | Likely migration or runtime | Same. |
| **gaqno-wellness-service** | Same Drizzle CREATE TYPE | **Fixed:** `0000_majestic_lily_hollister.sql` — CREATE TYPE made idempotent. Redeploy. |

## Backend: Drizzle CREATE TYPE already exists

PostgreSQL has no `CREATE TYPE IF NOT EXISTS`. Migrations that run `CREATE TYPE "public"."…" AS ENUM(...)` fail when the type already exists (e.g. re-run or partial apply).

**Fix:** Make the migration idempotent, e.g.:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_deal_stage') THEN
    CREATE TYPE "public"."crm_deal_stage" AS ENUM (...);
  END IF;
END $$;
```

Apply the same pattern to each CREATE TYPE in the failing migration files (or generate new migrations and edit them).

## Frontend: gaqno-erp-ui and useErpOrders

- **Cause:** The version of `@gaqno-development/frontcore` used in Coolify’s build doesn’t export `useErpOrders` (or the bundler doesn’t resolve the re-export).
- **Done:** Explicit `export { useErpOrders } from "./useErpOrders"` added in `@gaqno-frontcore/src/hooks/erp/index.ts`.
- **Done:** Frontcore bumped to 1.6.27. Run `npm run release:packages` from workspace root to publish; then redeploy gaqno-erp-ui (redeploy already triggered via `coolify-redeploy-apps.mjs`).

## Backend: dist/main.js not found

- **Cause:** Image is built from a context where `nest build` runs in the wrong directory, so `dist/main.js` is not at `/app/dist/main.js` in the container.
- **Fix:** Dockerfiles for gaqno-admin-service and gaqno-consumer-service now support build context = repo root via `ARG BUILD_SUBDIR` and `COPY ${BUILD_SUBDIR}/...`. In Coolify use Build context = `.` and Dockerfile = `gaqno-admin-service/Dockerfile` (or consumer). If building from the service directory, set build arg `BUILD_SUBDIR=.`. Redeploys were triggered.

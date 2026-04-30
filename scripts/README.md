# Scripts (workspace root)

Scripts live next to `package.json` at the monorepo root. Submodules (e.g. `gaqno-sso-service/scripts/`) have their own folders.

## npm scripts (`package.json`)

| Script | File | Purpose |
|--------|------|---------|
| `create-project` | `create-project.js` | Scaffold new MFE and/or Nest service |
| `check:page-structure` | `run-page-structure-checks.mjs` | Page folder gates (CI + pre-commit) |
| `check:page-*` | `check-*.mjs` | Individual gates; usually run via `check:page-structure` |
| `dokploy:*` | `dokploy-pull-env.mjs`, `dokploy-inspect-latency-hints.mjs` | Dokploy env / latency helpers |
| `scrape:product-images` | `scrape-product-images.mjs` | CRM product images (R2) |
| `import:dummyjson-products` | `import-dummyjson-products.mjs` | Seed products from DummyJSON |
| `measure:api-ttfb` | `measure-api-ttfb.mjs` | TTFB probe |
| `explain:erp-queries` | `explain-erp-tenant-queries.sql` | `psql` explain (see `package.json` for env vars) |
| `codemap` | — | Not present in this tree; `build-all.sh` skips codemap if `npm run codemap` fails |

## Shell helpers

| File | Used by |
|------|---------|
| `patch-federation-plugin.sh` | `npm postinstall` |
| `gaqno-resolve-npm-token.sh` | `push-all.sh`, `build-all.sh` |
| `guard-destructive-commit.sh` | Husky pre-commit |
| `verify-submodules-non-empty.sh` | Parent CI |
| `submodule-ensure-on-default-branch.sh` | Documented in `push-all.sh` header |
| `push-restored-submodules.sh` | Docs / recovery after empty submodule commits |
| `cursor-mcp-login-path.sh` | `cursor-postgres-mcp.sh` |
| `cursor-postgres-mcp.sh` | Local MCP / Postgres |

## Workflow templates

YAML under `scripts/workflows/` (`ci.yml`, `branch-pr-validation.yml`, `pr-agent.yml`) is the canonical copy for submodule repos. A `copy-workflows-to-repos.sh` helper is referenced in older docs; if missing, copy files manually or restore the script from history.

## n8n

`n8n-workflows/` holds exported workflow JSON; see `n8n-workflows/README.md`.

## Page-structure checks

See `.cursor/skills/frontend-page-structure/SKILL.md` and `check-page-root-contract.json`. Migrate UI: `migrate-page-components-to-folders.mjs` then `fix-migrated-component-imports.mjs`.

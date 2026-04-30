# Scripts (workspace root)

This folder holds **CI-critical** automation for the superproject: submodule verification, `npm postinstall` federation patching, and `src/pages/` layout gates.

| Item | Role |
|------|------|
| `verify-submodules-non-empty.sh` | GitHub Actions `prepare` job |
| `patch-federation-plugin.sh` | Root `package.json` `postinstall` (runs on `npm install` in CI) |
| `run-page-structure-checks.mjs` + `check-*.mjs` + `check-page-root-contract.json` + `print-page-structure-scope.mjs` + `lib/page-check-log.mjs` | `npm run check:page-structure` (lint job + Husky) |
| `mcp-cloudflare-remote.sh` | Cursor **cloudflare-api** MCP: runs `mcp-remote` with **API token only** (no OAuth). Token from `CLOUDFLARE_API_TOKEN` env, repo `.env` (`CLOUDFLARE_API_TOKEN=`), `.cursor/cloudflare-api-token`, or `CLOUDFLARE_API_TOKEN_FILE`. OAuth + Cursor reload causes `Invalid PKCE code_verifier` and hung secondaries. |

Apps with `src/pages` can still invoke individual `check-*.mjs` files via `node ../scripts/...` (see `gaqno-ai-ui/package.json`).

Other helpers live at the repo root (`gaqno-resolve-npm-token.sh`, `guard-destructive-commit.sh`) or under packages (e.g. `dokploy-mcp/scripts/`).

See `.cursor/skills/frontend-page-structure/SKILL.md` for page layout rules.

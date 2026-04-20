# Cursor MCP configuration

`mcp.json` is portable and uses `npx`/`uvx` directly — no wrapper scripts, no hardcoded paths (except `${workspaceFolder}` for the local dokploy MCP build artifact).

## Prerequisites (install once per machine)

| Tool | Used by                                                          |
| ---- | ---------------------------------------------------------------- |
| node (>=18) + npx | `playwright`, `shadcn`, `cloudflare-api`, `dokploy-mcp` |
| uv / uvx | `atlassian`, `grafana`, `postgres-*`                         |

Install per OS:

- **NixOS / nix user:** `nix profile add nixpkgs#nodejs_22 nixpkgs#uv`
- **macOS:** `brew install node uv`
- **Debian/Ubuntu:** `apt install nodejs npm` + `curl -LsSf https://astral.sh/uv/install.sh | sh`

After install, restart Cursor so it picks up the new `PATH`.

## Local build step (once)

The `dokploy-mcp` entry launches a TypeScript project from this repo. Build it once:

```bash
cd dokploy-mcp && npm install && npm run build
```

## Secrets

`mcp.json` holds tokens in plaintext and is gitignored. Populate yours from a secure source (1Password, vault, team doc) — never commit it. Placeholders to replace:

- `JIRA_API_TOKEN`, `CONFLUENCE_API_TOKEN`
- `GRAFANA_SERVICE_ACCOUNT_TOKEN`
- `DOKPLOY_API_KEY`
- `NEWRELIC api-key` header
- `n8n Authorization` bearer
- `DATABASE_URI` passwords for postgres-* entries

## OpenCode

For OpenCode, copy the same servers into `opencode.json` (project-level) or `~/.config/opencode/opencode.json` (global).

# Workspace Memory - 2026-04-13

## OpenCode MCP Configuration

Converted Cursor MCPs to OpenCode format at `opencode.json` (project-level) and `~/.config/opencode/opencode.json` (global).

### MCP Servers Configured
- playwright
- grafana (mcp-grafana)
- shadcn
- cloudflare-api (mcp-remote)
- atlassian (mcp-atlassian)
- n8n-mcp (remote HTTP)
- postgres-sso, postgres-finance, postgres-pdv, postgres-rpg, postgres-ai, postgres-omnichannel
- dokploy-mcp
- newrelic

### Issues Encountered
- OpenCode couldn't find executables (npx, uvx) in shell PATH
- Solution: Use `nix develop` to get nodejs_22 and uv in PATH

### Config Format (OpenCode)
```json
{
  "mcp": {
    "name": {
      "type": "local",
      "command": ["npx", "-y", "package"],
      "enabled": true
    }
  }
}
```

## Nix Flake
Created `flake.nix` with:
- nodejs_22
- uv
- python312
- docker, docker-compose
- just, nixfmt

Usage: `nix develop`

## Git Ignore Updates
Added exceptions for cursor scripts:
- `!.cursor/run-*.sh`
- `!.cursor/mcp-path.sh`

This allows commit while keeping mcp.json ignored.
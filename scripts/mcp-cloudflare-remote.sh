#!/usr/bin/env bash
set -euo pipefail
export MCP_REMOTE_CONFIG_DIR="${MCP_REMOTE_CONFIG_DIR:-${HOME}/.mcp-auth-cloudflare-api}"
port="${CLOUDFLARE_MCP_OAUTH_PORT:-39451}"
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  exec npx -y mcp-remote@latest "https://mcp.cloudflare.com/mcp" \
    --header "Authorization:Bearer ${CLOUDFLARE_API_TOKEN}" \
    "$port"
fi
exec npx -y mcp-remote@latest "https://mcp.cloudflare.com/mcp" "$port"

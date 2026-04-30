#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
export MCP_REMOTE_CONFIG_DIR="${MCP_REMOTE_CONFIG_DIR:-${HOME}/.mcp-auth-cloudflare-api}"
port="${CLOUDFLARE_MCP_OAUTH_PORT:-39451}"
token="${CLOUDFLARE_API_TOKEN:-}"
token_file="${CLOUDFLARE_API_TOKEN_FILE:-$repo_root/.cursor/cloudflare-api-token}"
dotenv="$repo_root/.env"
if [[ -z "$token" && -f "$token_file" ]]; then
  token=$(head -1 "$token_file" | tr -d '\r\n')
fi
if [[ -z "$token" && -f "$dotenv" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^CLOUDFLARE_API_TOKEN=(.*)$ ]] || continue
    token="${BASH_REMATCH[1]}"
    token="${token%$'\r'}"
    token="${token#\"}"
    token="${token%\"}"
    token="${token#\'}"
    token="${token%\'}"
    break
  done <"$dotenv"
fi
if [[ -n "$token" ]]; then
  exec npx -y mcp-remote@latest "https://mcp.cloudflare.com/mcp" \
    --header "Authorization:Bearer ${token}" \
    "$port"
fi
echo "cloudflare-api MCP: missing token. OAuth breaks on Cursor Reload (Invalid PKCE / hung secondary)." >&2
echo "Set CLOUDFLARE_API_TOKEN in .env (gitignored), .cursor/cloudflare-api-token, or cloudflare-api env in .cursor/mcp.json." >&2
echo "  $token_file" >&2
echo "Docs: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/" >&2
exit 1

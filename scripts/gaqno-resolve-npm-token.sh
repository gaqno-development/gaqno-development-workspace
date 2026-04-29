#!/usr/bin/env bash
set -u

emit_token() {
  printf '%s' "$1"
  exit 0
}

BASE_DIR="${1:?}"

[ -n "${NPM_TOKEN:-}" ] && emit_token "$NPM_TOKEN"

if [ -f "${BASE_DIR}/.npmrc" ]; then
  t=$(grep "//npm.pkg.github.com/:_authToken" "${BASE_DIR}/.npmrc" 2>/dev/null | head -1 | cut -d'=' -f2-)
  [ -n "${t:-}" ] && emit_token "$t"
fi

if [ -f "${HOME}/.npmrc.personal" ]; then
  t=$(grep "//npm.pkg.github.com/:_authToken" "${HOME}/.npmrc.personal" 2>/dev/null | head -1 | cut -d'=' -f2-)
  [ -n "${t:-}" ] && emit_token "$t"
fi

MCP_JSON="${BASE_DIR}/.cursor/mcp.json"
if command -v jq >/dev/null 2>&1 && [ -f "${MCP_JSON}" ]; then
  t=$(jq -r '.mcpServers["dokploy-mcp"].env.NPM_TOKEN // empty' "${MCP_JSON}" 2>/dev/null)
  [ -n "$t" ] && [ "$t" != "null" ] && emit_token "$t"
fi

if [ "${GAQNO_NPM_TOKEN_FROM_DOKPLOY_API:-1}" != "0" ]; then
  if command -v curl >/dev/null 2>&1 && command -v jq >/dev/null 2>&1 && [ -f "${MCP_JSON}" ]; then
    d_url=$(jq -r '.mcpServers["dokploy-mcp"].env.DOKPLOY_BASE_URL // empty' "${MCP_JSON}" 2>/dev/null)
    d_key=$(jq -r '.mcpServers["dokploy-mcp"].env.DOKPLOY_API_KEY // empty' "${MCP_JSON}" 2>/dev/null)
    if [ -n "$d_url" ] && [ -n "$d_key" ] && [ "$d_url" != "null" ] && [ "$d_key" != "null" ]; then
      base="${d_url%/}"
      raw=$(curl -sf --max-time 20 -H "x-api-key: ${d_key}" "${base}/project.all") || raw=""
      if [ -n "$raw" ]; then
        while IFS= read -r env_block; do
          [ -z "$env_block" ] && continue
          while IFS= read -r line || [ -n "$line" ]; do
            line="${line//$'\r'/}"
            case "$line" in
              NPM_TOKEN=*) emit_token "${line#NPM_TOKEN=}" ;;
            esac
          done <<ENVBLK
$(printf '%s' "$env_block")
ENVBLK
        done < <(echo "$raw" | jq -r '(if type == "array" then . else [.] end) | .[] | .applications[]? | .env // empty')
      fi
    fi
  fi
fi

for rc in \
  "${BASE_DIR}/gaqno-sso-service/.npmrc" \
  "${BASE_DIR}/gaqno-shell-ui/.npmrc" \
  "${BASE_DIR}/gaqno-shop-admin/.npmrc" \
  "${BASE_DIR}/gaqno-shop-service/.npmrc"; do
  if [ -f "${rc}" ]; then
    t=$(grep "//npm.pkg.github.com/:_authToken" "${rc}" 2>/dev/null | head -1 | cut -d'=' -f2-)
    [ -n "${t:-}" ] && emit_token "$t"
  fi
done

exit 1

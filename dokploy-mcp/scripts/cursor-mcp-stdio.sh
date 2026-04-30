#!/usr/bin/env bash
set -euo pipefail

readonly script_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
readonly repo="$(cd "$script_dir/.." && pwd)"
readonly root="$(cd "$script_dir/../.." && pwd)"
readonly entry="$repo/dist/index.js"

. "$script_dir/cursor-mcp-login-path.sh"

if [ ! -f "$entry" ]; then
  cursor_mcp_ensure_npm || {
    echo "dokploy-mcp: npm não encontrado. Instale Node/npm ou execute: cd dokploy-mcp && npm ci && npm run build" >&2
    exit 1
  }
  cd "$repo"
  npm ci
  npm run build
fi

exec node "$entry"

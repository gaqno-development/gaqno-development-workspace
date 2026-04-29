#!/usr/bin/env bash
set -euo pipefail

readonly script_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
readonly root="$(cd "$script_dir/.." && pwd)"
. "$root/scripts/cursor-mcp-login-path.sh"

readonly uri="${DATABASE_URI:?DATABASE_URI ausente}"

cursor_mcp_ensure_uvx_or_npx || {
  echo "postgres-mcp: uvx ou npx não encontrado. Instale uv (https://docs.astral.sh/uv) ou Node/npm." >&2
  exit 1
}

if command -v uvx >/dev/null 2>&1; then
  exec uvx postgres-mcp --access-mode=unrestricted
fi
exec npx -y @modelcontextprotocol/server-postgres "$uri"

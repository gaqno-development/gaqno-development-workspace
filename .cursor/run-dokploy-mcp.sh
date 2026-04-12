#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if command -v node >/dev/null 2>&1; then
  exec node "$ROOT/dokploy-mcp/dist/index.js"
fi
export PATH="/nix/store/cy7gdi3aq4v0rk60bxjcxvjip7pq4r9x-home-manager-path/bin:${PATH:-/usr/bin:/bin}"
exec node "$ROOT/dokploy-mcp/dist/index.js"

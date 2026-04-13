#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/mcp-path.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export LOG_LEVEL="${LOG_LEVEL:-debug}"
export MCP_TRANSPORT="${MCP_TRANSPORT:-stdio}"
exec node "$ROOT/dokploy-mcp/dist/index.js"

cursor_mcp_prepend_path() {
  local d="$1"
  [ -d "$d" ] || return 0
  export PATH="$d:$PATH"
}

cursor_mcp_prepend_windows_node_paths() {
  cursor_mcp_prepend_path "/mnt/c/Program Files/nodejs"
  cursor_mcp_prepend_path "/mnt/c/Program Files (x86)/nodejs"
}

cursor_mcp_load_nvm() {
  local d="${NVM_DIR:-$HOME/.nvm}"
  [ -s "$d/nvm.sh" ] || return 1
  . "$d/nvm.sh"
  nvm use default --silent 2>/dev/null || nvm use node --silent 2>/dev/null || true
  return 0
}

cursor_mcp_load_fnm() {
  command -v fnm >/dev/null 2>&1 || return 1
  eval "$(fnm env)"
  return 0
}

cursor_mcp_load_mise() {
  local m="$HOME/.local/bin/mise"
  [ -x "$m" ] || return 1
  eval "$("$m" activate bash)"
  return 0
}

cursor_mcp_load_asdf() {
  [ -f "$HOME/.asdf/asdf.sh" ] || return 1
  . "$HOME/.asdf/asdf.sh"
  return 0
}

cursor_mcp_expand_dev_paths() {
  cursor_mcp_prepend_path "$HOME/.cargo/bin"
  cursor_mcp_prepend_path "$HOME/.volta/bin"
  cursor_mcp_prepend_path "$HOME/.local/bin"
  cursor_mcp_prepend_windows_node_paths
  cursor_mcp_load_nvm || true
  cursor_mcp_load_fnm || true
  cursor_mcp_load_mise || true
  cursor_mcp_load_asdf || true
}

cursor_mcp_ensure_npm() {
  command -v npm >/dev/null 2>&1 && return 0
  cursor_mcp_expand_dev_paths
  command -v npm >/dev/null 2>&1
}

cursor_mcp_ensure_uvx_or_npx() {
  command -v uvx >/dev/null 2>&1 && return 0
  command -v npx >/dev/null 2>&1 && return 0
  cursor_mcp_expand_dev_paths
  command -v uvx >/dev/null 2>&1 && return 0
  command -v npx >/dev/null 2>&1
}

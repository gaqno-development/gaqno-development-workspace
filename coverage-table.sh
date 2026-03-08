#!/bin/bash
#
# Mostra uma tabela com cada projeto da workspace e sua taxa de coverage.
# Roda test:coverage em cada projeto que tiver o script.
# Uso: ./coverage-table.sh [projeto1 projeto2 ...]
#      Sem args = todos os projetos com test:coverage (pode demorar vários minutos).
#      COVERAGE_TIMEOUT=60 para limitar segundos por projeto (default 120).
#
set -e

COVERAGE_TIMEOUT="${COVERAGE_TIMEOUT:-120}"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Projetos que têm test:coverage no package.json
get_projects_with_coverage() {
  local dir
  for dir in "$BASE_DIR"/*/ ; do
    [ -d "$dir" ] || continue
    local name="${dir%/}"
    name="${name##*/}"
    # Ignora node_modules e pastas que não são projetos
    [[ "$name" =~ ^node_modules$|^\. ]] && continue
    [ -f "$dir/package.json" ] || continue
    grep -qE '"test:coverage"\s*:' "$dir/package.json" 2>/dev/null || continue
    echo "$name"
  done
  # Inclui pacotes no root (ex: @gaqno-backcore)
  for dir in "$BASE_DIR"/@*/ ; do
    [ -d "$dir" ] || continue
    local name="${dir%/}"
    name="${name##*/}"
    [ -f "$dir/package.json" ] || continue
    grep -qE '"test:coverage"\s*:' "$dir/package.json" 2>/dev/null || continue
    echo "$name"
  done
}

# Extrai % da linha "All files" do Vitest (Stmts, Branch, Funcs, Lines)
parse_vitest_coverage() {
  local output="$1"
  echo "$output" | awk -F'|' '/All files[[:space:]]*\|/ {
    gsub(/^[[:space:]]+|[[:space:]]+$/,"",$2); gsub(/^[[:space:]]+|[[:space:]]+$/,"",$3)
    gsub(/^[[:space:]]+|[[:space:]]+$/,"",$4); gsub(/^[[:space:]]+|[[:space:]]+$/,"",$5)
    if ($2 != "") printf "%.1f\t%.1f\t%.1f\t%.1f", $2+0, $3+0, $4+0, $5+0
    exit
  }'
}

# Extrai % do coverage-summary.json do Jest (total)
parse_jest_coverage_summary() {
  local dir="$1"
  local json="$dir/coverage/coverage-summary.json"
  [ -f "$json" ] || return 1
  local stmts branches funcs lines
  stmts=$(jq -r '.total.statements.pct // empty' "$json" 2>/dev/null)
  branches=$(jq -r '.total.branches.pct // empty' "$json" 2>/dev/null)
  funcs=$(jq -r '.total.functions.pct // empty' "$json" 2>/dev/null)
  lines=$(jq -r '.total.lines.pct // empty' "$json" 2>/dev/null)
  [ -n "$stmts" ] || return 1
  printf "%.1f\t%.1f\t%.1f\t%.1f" "${stmts:-0}" "${branches:-0}" "${funcs:-0}" "${lines:-0}"
}

# Roda coverage no projeto e retorna uma linha: STMTS BRANCH FUNCS LINES (tab-sep) ou vazio
# Timeout garantido: timeout (GNU), gtimeout (macOS brew coreutils) ou perl alarm
# Não imprime loading (quem chama imprime e sobrescreve com \r)
run_coverage() {
  local project="$1"
  local repo_path="$BASE_DIR/$project"
  local log
  log=$(mktemp)
  trap "rm -f '$log'" RETURN

  if command -v timeout &>/dev/null; then
    (cd "$repo_path" && timeout "$COVERAGE_TIMEOUT" npm run test:coverage 2>&1) > "$log" 2>&1 || true
  elif command -v gtimeout &>/dev/null; then
    (cd "$repo_path" && gtimeout "$COVERAGE_TIMEOUT" npm run test:coverage 2>&1) > "$log" 2>&1 || true
  else
    (cd "$repo_path" && perl -e 'alarm shift; system shift' "$COVERAGE_TIMEOUT" "npm run test:coverage 2>&1") > "$log" 2>&1 || true
  fi

  local content
  content=$(cat "$log")

  # 1) Vitest: linha "All files"
  local parsed
  parsed=$(parse_vitest_coverage "$content")
  if [ -n "$parsed" ]; then
    echo "$parsed"
    return 0
  fi

  # 2) Jest: coverage-summary.json (alguns projetos geram com json-summary)
  parsed=$(parse_jest_coverage_summary "$repo_path")
  if [ -n "$parsed" ]; then
    echo "$parsed"
    return 0
  fi

  echo ""
}

# Cabeçalho da tabela
print_header() {
  printf "\n%-28s | %7s | %7s | %7s | %7s\n" "Projeto" "Stmts" "Branch" "Funcs" "Lines"
  echo "------------------------------|---------|---------|---------|---------"
}

main() {
  local projects
  if [ $# -gt 0 ]; then
    # Lista explícita: só os projetos passados como argumentos
    projects=("$@")
  else
    projects=($(get_projects_with_coverage | sort -u))
  fi
  if [ ${#projects[@]} -eq 0 ]; then
    echo "Nenhum projeto com script test:coverage encontrado."
    exit 0
  fi

  print_header
  local stmts branch funcs lines total current
  total=${#projects[@]}
  current=0
  for project in "${projects[@]}"; do
    REPO_PATH="$BASE_DIR/$project"
    current=$((current + 1))
    if [ ! -d "$REPO_PATH" ]; then
      continue
    fi
    if [ ! -f "$REPO_PATH/package.json" ]; then
      printf "%-28s |    —   |    —   |    —   |   — \n" "$project"
      continue
    fi
    printf "   ⏳ [ %2d/%2d ] %s (timeout %ss)...\r" "$current" "$total" "$project" "$COVERAGE_TIMEOUT" >&2
    local result
    result=$(run_coverage "$project")
    if [ -n "$result" ]; then
      stmts=$(echo "$result" | cut -f1)
      branch=$(echo "$result" | cut -f2)
      funcs=$(echo "$result" | cut -f3)
      lines=$(echo "$result" | cut -f4)
      printf "\r%-28s | %5.1f%% | %5.1f%% | %5.1f%% | %5.1f%%\n" "$project" "$stmts" "$branch" "$funcs" "$lines"
    else
      printf "\r%-28s |    —   |    —   |    —   |   — \n" "$project"
    fi
  done
  echo "" >&2
  echo ""
}

main "$@"

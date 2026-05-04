#!/bin/bash
#
# Push all submodules from the workspace.
# After clone or sparse submodules: checkout each submodule default branch, then git submodule sync --recursive
# Para cada repo com alterações: roda testes, depois add/commit/push.
# Repos sem alterações são ignorados (não roda testes).
# Cada repo tem seus próprios workflows em .github/workflows/ — CI dispara no repo individual.
# Sem npm no PATH: tenta NVM em ~/.nvm; senão pula testes (ou export SKIP_REPO_TESTS=1).
# Repositórios com Dockerfile: exige docker no PATH antes do build (mensagem explícita se faltar).
# SKIP_DOCKER_VALIDATION=1 — pula o docker build antes do commit/push (use só quando necessário).
# Cores: export NO_COLOR=1 ou stdout não-TTY desativa ANSI.
#
set -e

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  _P_DIM=$'\033[2m'
  _P_BOLD=$'\033[1m'
  _P_RESET=$'\033[0m'
  _P_CYAN=$'\033[36m'
  _P_GREEN=$'\033[32m'
  _P_YELLOW=$'\033[33m'
  _P_RED=$'\033[31m'
  _P_BLUE=$'\033[34m'
  _P_MAG=$'\033[35m'
else
  _P_DIM="" _P_BOLD="" _P_RESET=""
  _P_CYAN="" _P_GREEN="" _P_YELLOW="" _P_RED="" _P_BLUE="" _P_MAG=""
fi

push_rule() {
  printf '%s\n' "${_P_CYAN}${_P_BOLD}────────────────────────────────────────────────────────────${_P_RESET}"
}

push_repo_title() {
  printf '\n%s▶%s %s%s%s\n' "${_P_CYAN}${_P_BOLD}" "${_P_RESET}" "${_P_BOLD}" "$1" "${_P_RESET}"
  push_rule
}

push_file_hint() {
  printf '      %s%s%s\n' "${_P_DIM}" "$1" "${_P_RESET}"
}

push_skip() {
  printf '   %s %s\n' "${_P_YELLOW}⊙${_P_RESET}" "$1"
}

push_ok() {
  printf '   %s %s\n' "${_P_GREEN}✓${_P_RESET}" "$1"
}

push_warn_line() {
  printf '   %s %s\n' "${_P_YELLOW}!${_P_RESET}" "$1"
}

push_err() {
  printf '   %s %s\n' "${_P_RED}✗${_P_RESET}" "$1"
}

push_info() {
  printf '   %s %s\n' "${_P_BLUE}·${_P_RESET}" "$1"
}

push_parent_section() {
  printf '\n%s\n' "${_P_MAG}${_P_BOLD}━━ Parent workspace ━━${_P_RESET}"
}

LM_STUDIO_HOST="${LM_STUDIO_HOST:-http://localhost:1234/v1}"
LM_STUDIO_MODEL="${LM_STUDIO_MODEL:-google/gemma-3-1b}"
CUSTOM_MESSAGE="$1"
TEST_TIMEOUT_SEC="${TEST_TIMEOUT_SEC:-300}"

# Fallback compatível com commitlint (type(scope): subject)
fallback_commit_message() {
  local scope="${1:-update}"
  echo "chore($scope): update"
}

# Force subject-case rule: subject must be lowercase (no PascalCase/Start-Case)
normalize_commit_message() {
  local msg="$1"
  if [[ "$msg" =~ ^([^:]+:[[:space:]]*)(.+)$ ]]; then
    local prefix="${BASH_REMATCH[1]}"
    local subject="${BASH_REMATCH[2]}"
    subject=$(echo "$subject" | tr '[:upper:]' '[:lower:]')
    echo "${prefix}${subject}"
  else
    echo "$msg"
  fi
}

strip_llm_commit_wrappers() {
  local msg="$1"
  msg=$(echo "$msg" | xargs)
  if [[ "$msg" =~ ^\`(.+)\`$ ]]; then
    msg="${BASH_REMATCH[1]}"
    msg=$(echo "$msg" | xargs)
  fi
  echo "$msg"
}

is_valid_conventional_commit_header() {
  local msg="$1"
  [[ -z "$msg" || "$msg" == "null" ]] && return 1
  local pattern='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?(!)?:[[:space:]]*[^[:space:]].*$'
  [[ "$msg" =~ $pattern ]]
}

generate_semantic_commit() {
  local repo_path="$1"
  local repo_name="$2"
  local diff
  diff=$(cd "$repo_path" && git diff --cached --stat 2>/dev/null; git diff --stat 2>/dev/null | head -30)
  diff=$(echo "$diff" | head -c 2000)

  if [ -z "$diff" ]; then
    fallback_commit_message "$repo_name"
    return
  fi

  if ! command -v jq &>/dev/null || ! command -v curl &>/dev/null; then
    fallback_commit_message "$repo_name"
    return
  fi

  local prompt="Generate a single-line conventional commit message (feat:, fix:, chore:, docs:, refactor:, etc.) for these changes. Reply with ONLY the commit message, no quotes or explanation.

Changes:
$diff"

  local payload
  payload=$(jq -n \
    --arg model "$LM_STUDIO_MODEL" \
    --arg content "$prompt" \
    '{model: $model, messages: [{role: "user", content: $content}], temperature: 0.3, max_tokens: 100}')

  local response
  response=$(curl -s --max-time 30 "$LM_STUDIO_HOST/chat/completions" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null)

  local msg
  msg=$(echo "$response" | jq -r '.choices[0].message.content // empty' 2>/dev/null | head -1 | xargs)
  msg=$(strip_llm_commit_wrappers "$msg")

  if is_valid_conventional_commit_header "$msg"; then
    echo "$msg"
  else
    if [ -n "$msg" ] && [ "$msg" != "null" ]; then
      echo "   ⚠️  LM Studio returned an invalid conventional header ('${msg}'); using fallback." >&2
    fi
    fallback_commit_message "$repo_name"
  fi
}

ensure_npm_in_path() {
  if command -v npm &>/dev/null; then
    return 0
  fi
  if [ -s "${NVM_DIR:=$HOME/.nvm}/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  fi
  command -v npm &>/dev/null
}

resolve_origin_default_branch() {
  local b
  b=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
  if [ -n "$b" ]; then
    echo "$b"
    return 0
  fi
  for cand in main master trunk; do
    if git rev-parse --verify "origin/$cand" &>/dev/null; then
      echo "$cand"
      return 0
    fi
  done
  echo "main"
}

run_repo_tests() {
  local repo_path="$1"
  local repo_name="$2"
  local coverage_log
  coverage_log=$(mktemp)
  trap "rm -f '$coverage_log'" RETURN

  if [ ! -f "$repo_path/package.json" ]; then
    return 0
  fi
  if ! grep -qE '"test"\s*:' "$repo_path/package.json" 2>/dev/null; then
    return 0
  fi

  if [[ -n "${SKIP_REPO_TESTS:-}" ]]; then
    push_info "SKIP_REPO_TESTS — skipping tests for $repo_name"
    return 0
  fi
  if ! ensure_npm_in_path; then
    push_warn_line "npm not found — skipping tests (install Node or SKIP_REPO_TESTS=1)"
    return 0
  fi

  local use_coverage=""
  if grep -qE '"test:coverage"\s*:' "$repo_path/package.json" 2>/dev/null; then
    use_coverage="1"
  fi

  local test_exit_code
  if command -v timeout &>/dev/null; then
    if [ -n "$use_coverage" ]; then
      (cd "$repo_path" && timeout "$TEST_TIMEOUT_SEC" npm run test:coverage 2>&1) | tee "$coverage_log"
    else
      (cd "$repo_path" && timeout "$TEST_TIMEOUT_SEC" npm run test 2>&1) | tee "$coverage_log"
    fi
    test_exit_code=${PIPESTATUS[0]}
  else
    if [ -n "$use_coverage" ]; then
      (cd "$repo_path" && npm run test:coverage 2>&1) | tee "$coverage_log" &
    else
      (cd "$repo_path" && npm run test 2>&1) | tee "$coverage_log" &
    fi
    local pid=$!
    (sleep "$TEST_TIMEOUT_SEC"; kill -9 "$pid" 2>/dev/null; exit 0) & local killer=$!
    wait "$pid" 2>/dev/null
    test_exit_code=$?
    kill "$killer" 2>/dev/null
    wait "$killer" 2>/dev/null
    if [ $test_exit_code -eq 124 ] || [ $test_exit_code -eq 137 ] || [ $test_exit_code -eq 143 ]; then
      printf '%s\n' "   ${_P_YELLOW}!${_P_RESET} Tests timed out after ${TEST_TIMEOUT_SEC}s" >&2
    fi
  fi

  if [ $test_exit_code -ne 0 ]; then
    cat "$coverage_log" >&2
    return 1
  fi

  printf '\n   %sCoverage — last lines%s (%s)\n' "${_P_CYAN}${_P_BOLD}" "${_P_RESET}" "$repo_name"
  tail -n 35 "$coverage_log" | sed 's/^/      ┊ /'
  return 0
}

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NPM_TOKEN="${NPM_TOKEN:-}"
if [ -z "${NPM_TOKEN}" ]; then
  NPM_TOKEN=$("${BASE_DIR}/gaqno-resolve-npm-token.sh" "${BASE_DIR}" 2>/dev/null) || true
fi

REPOS_FROM_GIT=($(git -C "$BASE_DIR" config --file .gitmodules --get-regexp path 2>/dev/null | awk '{ print $2 }' || true))
if [ ${#REPOS_FROM_GIT[@]} -gt 0 ]; then
  REPOS=("${REPOS_FROM_GIT[@]}")
elif [ -d "$BASE_DIR/.git/modules" ]; then
  REPOS=($(ls -1 "$BASE_DIR/.git/modules" 2>/dev/null | grep -v '^\.$' || true))
else
  REPOS=(
    gaqno-admin-service
    gaqno-admin-ui
    gaqno-ai-service
    gaqno-ai-ui
    gaqno-crm-ui
    gaqno-customer-service
    gaqno-consumer-ui
    gaqno-erp-ui
    gaqno-finance-service
    gaqno-finance-ui
    gaqno-intelligence-service
    gaqno-intelligence-ui
    gaqno-landing-ui
    gaqno-lenin-ui
    gaqno-omnichannel-service
    gaqno-omnichannel-ui
    gaqno-pdv-service
    gaqno-pdv-ui
    gaqno-rpg-service
    gaqno-rpg-ui
    gaqno-saas-service
    gaqno-saas-ui
    gaqno-shell-ui
    gaqno-shop
    gaqno-shop-admin
    gaqno-shop-service
    gaqno-sso-service
    gaqno-sso-ui
    gaqno-wellness-service
    gaqno-wellness-ui
  )
fi

PUSHED_PACKAGE=0
PUSHED_PACKAGES=()
for repo in "${REPOS[@]}"; do
  REPO_PATH="$BASE_DIR/$repo"
  
  if [ ! -d "$REPO_PATH" ]; then
    push_skip "Skipping $repo (directory does not exist)"
    continue
  fi
  
  if [ ! -f "$REPO_PATH/.git" ] && [ ! -d "$REPO_PATH/.git" ]; then
    push_skip "Skipping $repo (not a git repository)"
    continue
  fi
  
  push_repo_title "$repo"
  cd "$REPO_PATH"

  TRACKED_COUNT=$(git ls-files 2>/dev/null | head -1 | wc -l)
  if [ "$TRACKED_COUNT" -eq 0 ]; then
    push_warn_line "Skipping $repo — no tracked files (uninitialized submodule?). Run: git submodule update --init $repo"
    continue
  fi

  DELETED_COUNT=$(git status --porcelain 2>/dev/null | grep -c '^.D\|^D ' || true)
  PRESENT_COUNT=$(find . -mindepth 1 -maxdepth 1 ! -name '.git' | head -1 | wc -l)
  if [ "$DELETED_COUNT" -gt 0 ] && [ "$PRESENT_COUNT" -eq 0 ]; then
    push_err "Aborting $repo — all tracked files are missing from worktree."
    push_info "This would push an empty-tree commit and wipe the remote."
    push_info "Run: git submodule update --init --force $repo  (then retry)"
    continue
  fi

  if [ -z "$(git status --porcelain)" ]; then
    push_ok "No changes to commit"
    continue
  fi

  if [ -f "$REPO_PATH/Dockerfile" ] || [ -f "$REPO_PATH/Dockerfile.monorepo" ]; then
    if [[ -n "${SKIP_DOCKER_VALIDATION:-}" ]]; then
      push_warn_line "SKIP_DOCKER_VALIDATION — skipping Docker build for $repo"
    else
      push_info "Docker build (cache)…"
      BUILD_LOG="$BASE_DIR/build-logs/${repo}-push-build.log"
      mkdir -p "$BASE_DIR/build-logs"
      DOCKER_FILE="$REPO_PATH/Dockerfile"
      DOCKER_CTX="$REPO_PATH"
      if [ -f "$REPO_PATH/Dockerfile.monorepo" ]; then
        DOCKER_FILE="$REPO_PATH/Dockerfile.monorepo"
        DOCKER_CTX="$BASE_DIR"
      fi
      NPM_TOKEN_ARG=""
      if [ -n "${NPM_TOKEN:-}" ]; then
        NPM_TOKEN_ARG="--build-arg NPM_TOKEN=${NPM_TOKEN}"
      fi
      if [ -z "${NPM_TOKEN_ARG}" ]; then
        push_warn_line "NPM_TOKEN not resolved — export NPM_TOKEN, use ./gaqno-resolve-npm-token.sh sources (.npmrc, .cursor/mcp.json dokploy-mcp.env.NPM_TOKEN, Dokploy project.all env), or submodule .npmrc"
      fi
      if ! command -v docker &>/dev/null; then
        push_err "docker not found in PATH — skipping commit/push for $repo"
        push_warn_line "Install Docker (or enable WSL integration) so ./build-all.sh / push-all can run docker build."
        push_warn_line "Or set SKIP_DOCKER_VALIDATION=1 to skip this check (not recommended for services you ship as images)."
        printf '\n'
        continue
      fi
      if ! docker info &>/dev/null; then
        push_err "Docker daemon unreachable (permission denied or engine stopped) — skipping commit/push for $repo"
        push_warn_line "If you added user to group docker: close this terminal, open a new WSL session, or run: newgrp docker"
        push_warn_line "Then verify: docker ps   (Docker Desktop on Windows must be running.)"
        push_warn_line "Or set SKIP_DOCKER_VALIDATION=1 to skip this check (not recommended for services you ship as images)."
        printf '\n'
        continue
      fi
      if ! docker build -f "$DOCKER_FILE" $NPM_TOKEN_ARG -t "${repo}:test" "$DOCKER_CTX" > "$BUILD_LOG" 2>&1; then
        push_err "Docker build failed — skipping commit/push for $repo"
        push_file_hint "Log file:"
        push_file_hint "$BUILD_LOG"
        push_file_hint "Tip: tail -80 \"$BUILD_LOG\""
        printf '\n'
        continue
      fi
      push_ok "Docker build OK"
    fi
  fi

  push_info "Running tests (required before commit/push)…"
  if ! run_repo_tests "$REPO_PATH" "$repo"; then
    push_err "Tests failed — skipping commit/push for $repo"
    printf '\n'
    continue
  fi
  push_ok "Tests OK (see messages above if skipped)"

  push_info "Staging changes…"
  git add .

  GUARD_SCRIPT="$BASE_DIR/guard-destructive-commit.sh"
  if [ -x "$GUARD_SCRIPT" ]; then
    if ! "$GUARD_SCRIPT" "$REPO_PATH"; then
      push_err "Destructive-commit guard refused — aborting $repo"
      push_file_hint "Inspect: git -C $REPO_PATH status"
      git reset HEAD -- . >/dev/null 2>&1 || true
      continue
    fi
  fi

  if [ -n "$CUSTOM_MESSAGE" ]; then
    COMMIT_MESSAGE="$CUSTOM_MESSAGE"
  else
    push_info "Generating semantic commit message…"
    COMMIT_MESSAGE=$(generate_semantic_commit "$REPO_PATH" "$repo")
    printf '   %s→ %s%s\n' "${_P_DIM}" "${COMMIT_MESSAGE}" "${_P_RESET}"
  fi
  COMMIT_MESSAGE="${COMMIT_MESSAGE%.}"
  COMMIT_MESSAGE=$(normalize_commit_message "$COMMIT_MESSAGE")

  push_info "Commit: '${COMMIT_MESSAGE}'"
  export GAQNO_TESTS_ALREADY_RAN=1
  if ! git commit -m "$COMMIT_MESSAGE"; then
    push_warn_line "Commit failed (husky/commitlint may have rejected; fix and retry)"
    printf '\n'
    continue
  fi

  push_info "Pushing to remote…"
  branch=$(git branch --show-current)
  push_ok_flag=0
  if [ -n "$branch" ]; then
    if git push -u origin "$branch"; then
      push_ok_flag=1
    else
      push_warn_line "Push failed (check if remote is configured)"
    fi
  else
    def_branch=$(resolve_origin_default_branch)
    push_warn_line "Detached HEAD — pushing to origin/$def_branch (typical for submodules)"
    if git push -u origin "HEAD:${def_branch}"; then
      push_ok_flag=1
    else
      push_warn_line "Push failed. Try: cd $REPO_PATH && git checkout $def_branch && git cherry-pick HEAD@{1} && git push"
    fi
  fi
  if [ "$push_ok_flag" = "1" ]; then
    case "$repo" in
      @gaqno-types|@gaqno-mastra-runtime|@gaqno-backcore|@gaqno-frontcore|@gaqno-agent)
        PUSHED_PACKAGE=1
        PUSHED_PACKAGES+=("$repo")
        ;;
    esac
  fi

  push_ok "Done — $repo"
  printf '\n'
done

cd "$BASE_DIR"
PACKAGE_DIRS=("@gaqno-types" "@gaqno-mastra-runtime" "@gaqno-backcore" "@gaqno-frontcore" "@gaqno-agent")

# Only consider a package "changed" if it was actually pushed in this run,
# not merely because another package changed. This prevents phantom version
# bumps on packages that have no real code changes.
for pkg in "${PACKAGE_DIRS[@]}"; do
  for pushed in "${PUSHED_PACKAGES[@]}"; do
    if [ "$pkg" = "$pushed" ]; then
      PUSHED_PACKAGE=1
      break
    fi
  done
done

if [ "$PUSHED_PACKAGE" = "1" ]; then
  printf '\n%s\n' "${_P_MAG}${_P_BOLD}Packages — version bump & publish${_P_RESET}"
  push_rule
  push_info "Checking publishable versions…"
  for pkg in "${PACKAGE_DIRS[@]}"; do
    PKG_PATH="$BASE_DIR/$pkg"
    if [ ! -d "$PKG_PATH" ] || [ ! -f "$PKG_PATH/package.json" ]; then
      continue
    fi

    # Only bump packages that were actually pushed in this run
    ACTUALLY_PUSHED=0
    for pushed in "${PUSHED_PACKAGES[@]}"; do
      if [ "$pkg" = "$pushed" ]; then ACTUALLY_PUSHED=1; break; fi
    done
    if [ "$ACTUALLY_PUSHED" = "0" ]; then
      continue
    fi

    LOCAL_VER=$(node -p "require('$PKG_PATH/package.json').version" 2>/dev/null || true)
    case "$pkg" in
      @gaqno-types)     NPM_NAME="@gaqno-development/types" ;;
      @gaqno-mastra-runtime) NPM_NAME="@gaqno-development/mastra-runtime" ;;
      @gaqno-backcore)  NPM_NAME="@gaqno-development/backcore" ;;
      @gaqno-frontcore) NPM_NAME="@gaqno-development/frontcore" ;;
      @gaqno-agent)     NPM_NAME="@gaqno-development/gaqno-agent" ;;
      *) continue ;;
    esac
    PUBLISHED_VER=$(npm view "$NPM_NAME" version 2>/dev/null || true)
    if [ -n "$LOCAL_VER" ] && [ "$LOCAL_VER" = "$PUBLISHED_VER" ]; then
      push_info "Bump patch em $pkg ($LOCAL_VER) para publicação"
      (cd "$PKG_PATH" && npm version patch --no-git-tag-version) || true
      # Commit and push the bump immediately so it doesn't linger as dirty state
      (cd "$PKG_PATH" && git add package.json && git commit -m "chore: bump version for publish" && git push) || true
    fi
  done
  printf '\n'
  push_info "Publishing packages (npm — Dokploy/deploy picks up versions)…"
  if [ -f "$BASE_DIR/publish-packages.sh" ]; then
    "$BASE_DIR/publish-packages.sh" || push_warn_line "Publish failed (npm auth / versions)"
  else
    (cd "$BASE_DIR" && npm run release:packages) || push_warn_line "Publish failed (npm auth / versions)"
  fi
  printf '\n'
fi

push_parent_section
push_info "Submodule references in parent repo…"
cd "$BASE_DIR"
if [ -n "$(git status --porcelain)" ]; then
  push_info "Staging submodule updates…"
  git add .

  if [ -n "$CUSTOM_MESSAGE" ]; then
    PARENT_MESSAGE=$(normalize_commit_message "$CUSTOM_MESSAGE")
  else
    PARENT_MESSAGE="chore: update submodule references"
  fi

  push_info "Commit: '${PARENT_MESSAGE}'"
  push_file_hint "(pre-commit hooks may print workspace checks below)"
  git commit -m "$PARENT_MESSAGE" || true
  push_info "Pushing parent to remote…"
  git push || push_warn_line "Parent push failed"
  push_ok "Parent repo updated"
else
  push_ok "No submodule reference changes"
fi

if [ "$PUSHED_PACKAGE" = "1" ]; then
  printf '\n'
  push_file_hint "Packages were published above before the parent push."
fi

push_rule
printf '%s\n\n' "${_P_GREEN}${_P_BOLD}All repositories processed.${_P_RESET}"
push_file_hint "Each submodule triggers its own GitHub Actions workflow."

exit 0

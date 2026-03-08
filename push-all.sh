#!/bin/bash
#
# Push all submodules from the workspace.
# Para cada repo com alterações: roda testes, depois add/commit/push.
# Repos sem alterações são ignorados (não roda testes).
# Cada repo tem seus próprios workflows em .github/workflows/ — CI dispara no repo individual.
#
set -e

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

  if [ -n "$msg" ] && [ "$msg" != "null" ]; then
    echo "$msg"
  else
    fallback_commit_message "$repo_name"
  fi
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

  local use_coverage=""
  if grep -qE '"test:coverage"\s*:' "$repo_path/package.json" 2>/dev/null; then
    use_coverage="1"
  fi

  local test_exit_code
  if command -v timeout &>/dev/null; then
    if [ -n "$use_coverage" ]; then
      (cd "$repo_path" && timeout "$TEST_TIMEOUT_SEC" npm run test:coverage 2>&1) > "$coverage_log" 2>&1
    else
      (cd "$repo_path" && timeout "$TEST_TIMEOUT_SEC" npm run test 2>&1) > "$coverage_log" 2>&1
    fi
    test_exit_code=$?
  else
    if [ -n "$use_coverage" ]; then
      (cd "$repo_path" && npm run test:coverage 2>&1) > "$coverage_log" 2>&1 &
    else
      (cd "$repo_path" && npm run test 2>&1) > "$coverage_log" 2>&1 &
    fi
    local pid=$!
    (sleep "$TEST_TIMEOUT_SEC"; kill -9 "$pid" 2>/dev/null; exit 0) & local killer=$!
    wait "$pid" 2>/dev/null
    test_exit_code=$?
    kill "$killer" 2>/dev/null
    wait "$killer" 2>/dev/null
    if [ $test_exit_code -eq 124 ] || [ $test_exit_code -eq 137 ] || [ $test_exit_code -eq 143 ]; then
      echo "   ⏱️  Tests timed out after ${TEST_TIMEOUT_SEC}s" >&2
    fi
  fi

  if [ $test_exit_code -ne 0 ]; then
    cat "$coverage_log" >&2
    return 1
  fi

  echo "   📊 Coverage ($repo_name):"
  tail -n 35 "$coverage_log" | sed 's/^/      /'
  return 0
}

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
    gaqno-sso-service
    gaqno-sso-ui
    gaqno-wellness-service
    gaqno-wellness-ui
  )
fi

PUSHED_PACKAGE=0
for repo in "${REPOS[@]}"; do
  REPO_PATH="$BASE_DIR/$repo"
  
  if [ ! -d "$REPO_PATH" ]; then
    echo "⚠️  Skipping $repo (directory does not exist)"
    continue
  fi
  
  if [ ! -f "$REPO_PATH/.git" ] && [ ! -d "$REPO_PATH/.git" ]; then
    echo "⚠️  Skipping $repo (not a git repository)"
    continue
  fi
  
  echo "📦 Processing $repo..."
  cd "$REPO_PATH"
  
  if [ -z "$(git status --porcelain)" ]; then
    echo "   ✓ No changes to commit"
    continue
  fi

  echo "   🧪 Running tests (há alterações; testes obrigatórios antes de commit/push)..."
  if ! run_repo_tests "$REPO_PATH" "$repo"; then
    echo "   ❌ Tests failed — skipping commit/push for $repo"
    echo ""
    continue
  fi
  echo "   ✓ Tests passed"

  echo "   ➕ Adding all changes..."
  git add .

  if [ -n "$CUSTOM_MESSAGE" ]; then
    COMMIT_MESSAGE="$CUSTOM_MESSAGE"
  else
    echo "   🤖 Generating semantic commit message..."
    COMMIT_MESSAGE=$(generate_semantic_commit "$REPO_PATH" "$repo")
    echo "   💬 Generated: $COMMIT_MESSAGE"
  fi
  COMMIT_MESSAGE="${COMMIT_MESSAGE%.}"
  COMMIT_MESSAGE=$(normalize_commit_message "$COMMIT_MESSAGE")

  echo "   💾 Committing with message: '$COMMIT_MESSAGE'"
  export GAQNO_TESTS_ALREADY_RAN=1
  if ! git commit -m "$COMMIT_MESSAGE"; then
    echo '   ⚠️  Commit failed (husky/commitlint may have rejected; fix and retry)'
    echo ""
    continue
  fi

  echo "   🚀 Pushing to remote..."
  if ! git push -u origin HEAD; then
    echo "   ⚠️  Push failed (check if remote is configured)"
  else
    case "$repo" in
      @gaqno-types|@gaqno-backcore|@gaqno-frontcore|@gaqno-agent) PUSHED_PACKAGE=1 ;;
    esac
  fi

  echo "   ✅ Done with $repo"
  echo ""
done

cd "$BASE_DIR"
PACKAGE_DIRS=("@gaqno-types" "@gaqno-backcore" "@gaqno-frontcore" "@gaqno-agent")
for pkg in "${PACKAGE_DIRS[@]}"; do
  if [ -d "$BASE_DIR/$pkg" ] && [ -n "$(git -C "$BASE_DIR" status --porcelain "$pkg" 2>/dev/null)" ]; then
    PUSHED_PACKAGE=1
    break
  fi
done

if [ "$PUSHED_PACKAGE" = "1" ]; then
  echo "📦 Pacotes com alterações detectados; garantindo versão publicável..."
  for pkg in "${PACKAGE_DIRS[@]}"; do
    PKG_PATH="$BASE_DIR/$pkg"
    if [ ! -d "$PKG_PATH" ] || [ ! -f "$PKG_PATH/package.json" ]; then
      continue
    fi
    if [ -z "$(git -C "$BASE_DIR" status --porcelain "$pkg" 2>/dev/null)" ]; then
      continue
    fi
    LOCAL_VER=$(node -p "require('$PKG_PATH/package.json').version" 2>/dev/null || true)
    case "$pkg" in
      @gaqno-types)     NPM_NAME="@gaqno-development/types" ;;
      @gaqno-backcore)  NPM_NAME="@gaqno-development/backcore" ;;
      @gaqno-frontcore) NPM_NAME="@gaqno-development/frontcore" ;;
      @gaqno-agent)     NPM_NAME="@gaqno-development/gaqno-agent" ;;
      *) continue ;;
    esac
    PUBLISHED_VER=$(npm view "$NPM_NAME" version 2>/dev/null || true)
    if [ -n "$LOCAL_VER" ] && [ "$LOCAL_VER" = "$PUBLISHED_VER" ]; then
      echo "   📌 Bump patch em $pkg ($LOCAL_VER → patch) para permitir publicação"
      (cd "$PKG_PATH" && npm version patch --no-git-tag-version) || true
    fi
  done
  echo ""
  echo "📦 Publishing packages (Coolify/deploy gets the new version on npm)..."
  if [ -f "$BASE_DIR/publish-packages.sh" ]; then
    "$BASE_DIR/publish-packages.sh" || echo "   ⚠️  Publish failed (check npm auth and versions)"
  else
    (cd "$BASE_DIR" && npm run release:packages) || echo "   ⚠️  Publish failed (check npm auth and versions)"
  fi
  echo ""
fi

echo "📦 Updating parent repo with submodule references..."
cd "$BASE_DIR"
if [ -n "$(git status --porcelain)" ]; then
  echo "   ➕ Staging submodule updates..."
  git add .

  if [ -n "$CUSTOM_MESSAGE" ]; then
    PARENT_MESSAGE=$(normalize_commit_message "$CUSTOM_MESSAGE")
  else
    PARENT_MESSAGE="chore: update submodule references"
  fi

  echo "   💾 Committing with message: '$PARENT_MESSAGE'"
  git commit -m "$PARENT_MESSAGE" || true
  echo "   🚀 Pushing parent to remote..."
  git push || echo "   ⚠️  Parent push failed"
  echo "   ✅ Parent repo updated"
else
  echo "   ✓ No submodule reference changes"
fi

if [ "$PUSHED_PACKAGE" = "1" ]; then
  echo ""
  echo "   ℹ️  Packages were already published above (before parent push)."
fi

echo ""
echo "🎉 All repositories processed!"
echo "   (Workflows em cada repo — CI/PR validation disparam no repositório individual)"


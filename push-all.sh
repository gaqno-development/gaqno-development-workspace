#!/bin/bash
#
# Push all submodules from the workspace.
# IMPORTANTE: Push apenas pelo workspace para que GitHub Actions disparem.
# Ver docs/WORKSPACE-WORKFLOW.md
#
set -e

LM_STUDIO_HOST="${LM_STUDIO_HOST:-http://localhost:1234/v1}"
LM_STUDIO_MODEL="${LM_STUDIO_MODEL:-google/gemma-3-1b}"
CUSTOM_MESSAGE="$1"

generate_semantic_commit() {
  local repo_path="$1"
  local diff
  diff=$(cd "$repo_path" && git diff --cached --stat 2>/dev/null; git diff --stat 2>/dev/null | head -30)
  diff=$(echo "$diff" | head -c 2000)

  if [ -z "$diff" ]; then
    echo "Update changes"
    return
  fi

  if ! command -v jq &>/dev/null || ! command -v curl &>/dev/null; then
    echo "Update changes"
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
    echo "Update changes"
  fi
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
    gaqno-erp-ui
    gaqno-finance-service
    gaqno-finance-ui
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
    gaqno-warehouse-service
    gaqno-warehouse-ui
  )
fi

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
  
  echo "   ➕ Adding all changes..."
  git add .

  if [ -n "$CUSTOM_MESSAGE" ]; then
    COMMIT_MESSAGE="$CUSTOM_MESSAGE"
  else
    echo "   🤖 Generating semantic commit message..."
    COMMIT_MESSAGE=$(generate_semantic_commit "$REPO_PATH")
    echo "   💬 Generated: $COMMIT_MESSAGE"
  fi

  echo "   💾 Committing with message: '$COMMIT_MESSAGE'"
  git commit -m "$COMMIT_MESSAGE" || {
    echo "   ⚠️  Commit failed (might be empty or already committed)"
  }
  
  echo "   🚀 Pushing to remote..."
  git push || {
    echo "   ⚠️  Push failed (check if remote is configured)"
  }
  
  echo "   ✅ Done with $repo"
  echo ""
done

echo "📦 Updating parent repo with submodule references..."
cd "$BASE_DIR"
if [ -n "$(git status --porcelain)" ]; then
  echo "   ➕ Staging submodule updates..."
  git add .

  if [ -n "$CUSTOM_MESSAGE" ]; then
    PARENT_MESSAGE="$CUSTOM_MESSAGE"
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

echo ""
echo "🎉 All repositories processed!"
echo "   (Push via workspace garante que GitHub Actions disparem — docs/WORKSPACE-WORKFLOW.md)"


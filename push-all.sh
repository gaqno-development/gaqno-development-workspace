#!/bin/bash

set -e

COMMIT_MESSAGE="${1:-Update changes}"

REPOS=(
  "gaqno-ai"
  "gaqno-ai-service"
  "gaqno-crm"
  "gaqno-erp"
  "gaqno-finance"
  "gaqno-finance-service"
  "gaqno-pdv"
  "gaqno-pdv-service"
  "gaqno-rpg"
  "gaqno-rpg-service"
  "gaqno-shell"
  "gaqno-sso"
  "gaqno-sso-service"
)

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

echo "🎉 All repositories processed!"


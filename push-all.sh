#!/bin/bash

set -e

COMMIT_MESSAGE="${1:-Update changes}"

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

REPOS=($(git -C "$BASE_DIR" config --file .gitmodules --get-regexp path | awk '{ print $2 }'))

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

echo "📦 Updating parent repo with submodule references..."
cd "$BASE_DIR"
if [ -n "$(git status --porcelain)" ]; then
  echo "   ➕ Staging submodule updates..."
  git add .
  echo "   💾 Committing with message: '$COMMIT_MESSAGE'"
  git commit -m "$COMMIT_MESSAGE" || true
  echo "   🚀 Pushing parent to remote..."
  git push || echo "   ⚠️  Parent push failed"
  echo "   ✅ Parent repo updated"
else
  echo "   ✓ No submodule reference changes"
fi

echo ""
echo "🎉 All repositories processed!"


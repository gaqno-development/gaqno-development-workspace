#!/usr/bin/env bash
#
# Guard against destructive commits that would wipe a repository.
#
# Aborts the commit if the staged changes match any of the following patterns:
#   1. Staged tree is empty while HEAD has content (entire repo cleared).
#   2. 10+ files staged for deletion with 0 additions or modifications.
#   3. A critical root file (Dockerfile, package.json, src/, etc.) is staged
#      for deletion without any counterpart file being added.
#
# Can be invoked:
#   - Directly as a git pre-commit hook (no args — reads the staged tree of cwd).
#   - Programmatically with the repo path as arg 1 (used by push-all.sh).
#
# Override (DANGEROUS — only for intentional resets):
#   GAQNO_ALLOW_DESTRUCTIVE=1 git commit ...
#
set -u

REPO_PATH="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
MIN_DELETIONS="${GAQNO_MIN_DELETIONS:-10}"

if [ ! -d "$REPO_PATH/.git" ] && [ ! -f "$REPO_PATH/.git" ]; then
  exit 0
fi

cd "$REPO_PATH" || exit 0

if [ "${GAQNO_ALLOW_DESTRUCTIVE:-0}" = "1" ]; then
  echo "⚠️  GAQNO_ALLOW_DESTRUCTIVE=1 — skipping destructive-commit guard" >&2
  exit 0
fi

HEAD_TREE=$(git rev-parse HEAD^{tree} 2>/dev/null || echo "")
if [ -z "$HEAD_TREE" ]; then
  exit 0
fi

STAGED_TREE=$(git write-tree 2>/dev/null || echo "")
EMPTY_TREE=$(git hash-object -t tree /dev/null 2>/dev/null || echo "4b825dc642cb6eb9a060e54bf8d69288fbee4904")

if [ -n "$STAGED_TREE" ] && [ "$STAGED_TREE" = "$EMPTY_TREE" ] && [ "$HEAD_TREE" != "$EMPTY_TREE" ]; then
  echo "🚫 ABORT: Staged tree is EMPTY but HEAD has content." >&2
  echo "   This commit would wipe the repository." >&2
  echo "   If intentional: GAQNO_ALLOW_DESTRUCTIVE=1 git commit ..." >&2
  exit 1
fi

STAGED_DELETIONS=$(git diff --cached --name-only --diff-filter=D 2>/dev/null | wc -l | tr -d ' ')
STAGED_ADDITIONS=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | wc -l | tr -d ' ')
STAGED_MODIFICATIONS=$(git diff --cached --name-only --diff-filter=M 2>/dev/null | wc -l | tr -d ' ')
STAGED_RENAMES=$(git diff --cached --name-only --diff-filter=R 2>/dev/null | wc -l | tr -d ' ')
NON_DELETIONS=$((STAGED_ADDITIONS + STAGED_MODIFICATIONS + STAGED_RENAMES))

if [ "$STAGED_DELETIONS" -ge "$MIN_DELETIONS" ] && [ "$NON_DELETIONS" -eq 0 ]; then
  echo "🚫 ABORT: Commit stages $STAGED_DELETIONS deletions with 0 additions/modifications." >&2
  echo "   This looks like a mass-delete that would wipe working code." >&2
  echo ""
  echo "   Sample of staged deletions:" >&2
  git diff --cached --name-only --diff-filter=D 2>/dev/null | head -15 | sed 's/^/     - /' >&2
  echo ""
  echo "   If intentional (e.g. directory move): GAQNO_ALLOW_DESTRUCTIVE=1 git commit ..." >&2
  exit 1
fi

CRITICAL_PATHS="Dockerfile package.json tsconfig.json nest.config.js vite.config.ts"
for critical in $CRITICAL_PATHS; do
  deleted=$(git diff --cached --name-only --diff-filter=D 2>/dev/null | grep -Fx "$critical" || true)
  added=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | grep -Fx "$critical" || true)
  if [ -n "$deleted" ] && [ -z "$added" ]; then
    echo "🚫 ABORT: Critical file '$critical' is staged for deletion." >&2
    echo "   This would break the repo's build/runtime." >&2
    echo "   If intentional: GAQNO_ALLOW_DESTRUCTIVE=1 git commit ..." >&2
    exit 1
  fi
done

exit 0

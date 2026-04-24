#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ ! -f .gitmodules ]]; then
  exit 0
fi
mapfile -t paths < <(git config --file .gitmodules --get-regexp path 2>/dev/null | awk '{ print $2 }' || true)
if [[ ${#paths[@]} -eq 0 ]]; then
  exit 0
fi
failed=0
for path in "${paths[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "verify-submodules-non-empty: missing path $path" >&2
    failed=1
    continue
  fi
  if [[ ! -f "$path/.git" && ! -d "$path/.git" ]]; then
    echo "verify-submodules-non-empty: not a git worktree: $path" >&2
    failed=1
    continue
  fi
  if ! git -C "$path" rev-parse HEAD >/dev/null 2>&1; then
    echo "verify-submodules-non-empty: invalid repo: $path" >&2
    failed=1
    continue
  fi
  if [[ -z "$(git -C "$path" ls-tree -r --name-only HEAD 2>/dev/null | head -1)" ]]; then
    echo "verify-submodules-non-empty: empty tree at HEAD: $path (would break Dokploy/Swarm builds)" >&2
    failed=1
  fi
  if [[ "${VERIFY_SUBMODULE_ON_BRANCH:-}" == "1" ]]; then
    if ! git -C "$path" symbolic-ref -q HEAD &>/dev/null; then
      echo "verify-submodules-non-empty: detached HEAD at $path (local: bash scripts/submodule-ensure-on-default-branch.sh)" >&2
      failed=1
    fi
  fi
done
exit "$failed"

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .gitmodules ]]; then
  echo "No .gitmodules at $ROOT"
  exit 0
fi

mapfile -t paths < <(git config --file .gitmodules --get-regexp path 2>/dev/null | awk '{ print $2 }' || true)
if [[ ${#paths[@]} -eq 0 ]]; then
  exit 0
fi

default_branch() {
  git -C "$1" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true
}

for path in "${paths[@]}"; do
  if [[ ! -e "$path/.git" ]]; then
    echo "skip $path (not initialized — run: git submodule update --init \"$path\")"
    continue
  fi
  if ! git -C "$path" rev-parse HEAD &>/dev/null; then
    echo "skip $path (invalid git)"
    continue
  fi
  if ! git -C "$path" remote get-url origin &>/dev/null; then
    echo "skip $path (no origin)"
    continue
  fi
  git -C "$path" fetch origin --prune --quiet 2>/dev/null || true
  br="$(default_branch "$path")"
  if [[ -z "$br" ]]; then
    for cand in main master trunk; do
      if git -C "$path" rev-parse "origin/$cand" &>/dev/null; then
        br="$cand"
        break
      fi
    done
  fi
  if [[ -z "$br" ]]; then
    echo "skip $path (could not resolve origin default branch)"
    continue
  fi
  if git -C "$path" symbolic-ref -q HEAD &>/dev/null; then
    cur="$(git -C "$path" symbolic-ref HEAD | sed 's@^refs/heads/@@')"
    detached=""
  else
    cur=""
    detached=1
  fi
  if [[ -n "$detached" ]] || [[ "$cur" != "$br" ]]; then
    echo "$path: checkout $br (was detached or on $cur)"
    git -C "$path" checkout "$br" 2>/dev/null || git -C "$path" checkout -B "$br" "origin/$br"
  fi
  git -C "$path" pull --ff-only "origin" "$br" 2>/dev/null || echo "$path: pull left as-is (resolve conflicts manually if needed)"
done

echo "Done. If you changed submodule URLs: git submodule sync --recursive"
echo "Dokploy/CI without SSH to submodules: git config url.https://github.com/.insteadOf git@github.com:"
echo "Strict local check (fails if any submodule detached): VERIFY_SUBMODULE_ON_BRANCH=1 bash scripts/verify-submodules-non-empty.sh"

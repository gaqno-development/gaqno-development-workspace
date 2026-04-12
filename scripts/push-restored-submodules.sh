#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "Pushing each submodule current branch to origin with --force-with-lease (needed after undoing empty commits)."
git submodule foreach '
  b="$(git branch --show-current)"
  echo ">>> $name branch=$b"
  git push -u origin "$b" --force-with-lease
'
echo "Done. Then commit the superproject: git add -A && git commit -m \"chore: bump submodule SHAs after restore\" && git push"

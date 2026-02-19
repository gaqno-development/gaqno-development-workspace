#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
[ -f .env ] && set -a && . ./.env && set +a
[ -f gaqno-shell-ui/.env.local ] && set -a && . ./gaqno-shell-ui/.env.local && set +a

NPM_TOKEN="${NPM_TOKEN:-}"
BUILD_ARG=""
[ -n "$NPM_TOKEN" ] && BUILD_ARG="--build-arg NPM_TOKEN=$NPM_TOKEN"

PROJECTS=(
  gaqno-shell-ui
  gaqno-sso-ui
  gaqno-ai-ui
  gaqno-crm-ui
  gaqno-erp-ui
  gaqno-finance-ui
  gaqno-pdv-ui
  gaqno-rpg-ui
  gaqno-omnichannel-ui
  gaqno-admin-ui
  gaqno-saas-ui
  gaqno-landing-ui
  gaqno-lenin-ui
  gaqno-sso-service
  gaqno-ai-service
  gaqno-admin-service
  gaqno-finance-service
  gaqno-omnichannel-service
  gaqno-pdv-service
  gaqno-rpg-service
  gaqno-saas-service
  gaqno-lead-enrichment-service
)

FAILED=()
PASSED=()

for dir in "${PROJECTS[@]}"; do
  if [ ! -f "$dir/Dockerfile" ]; then
    continue
  fi
  echo "=========================================="
  echo "Building $dir ..."
  echo "=========================================="
  if (cd "$dir" && docker build $BUILD_ARG -t "gaqno-${dir}:local" .); then
    PASSED+=("$dir")
    echo "OK $dir"
  else
    FAILED+=("$dir")
    echo "FAILED $dir"
  fi
  echo ""
done

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Passed: ${#PASSED[@]} - ${PASSED[*]}"
echo "Failed: ${#FAILED[@]} - ${FAILED[*]}"
[ ${#FAILED[@]} -gt 0 ] && exit 1
exit 0

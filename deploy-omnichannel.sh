#!/usr/bin/env bash
set -euo pipefail

echo "Deploy GAQNO Omnichannel UI (Dokploy webhook)"
echo ""

if [ -z "${DOKPLOY_DEPLOY_WEBHOOK_URL:-}" ]; then
  echo "Set DOKPLOY_DEPLOY_WEBHOOK_URL to the Deploy Webhook URL from Dokploy (application → Webhooks)."
  exit 1
fi

curl -fsS -X POST "$DOKPLOY_DEPLOY_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"ref\":\"refs/heads/main\",\"sha\":\"${COMMIT_SHA:-}\"}"

echo ""
echo "Webhook request sent."

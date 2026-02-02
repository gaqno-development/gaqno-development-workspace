#!/usr/bin/env bash
# =============================================================================
# Production seed – run on Coolify server (where Postgres host is reachable)
# =============================================================================
#
# Prerequisites: node, psql, full monorepo cloned on server. Run from workspace root.
#
# 1. Get DATABASE_URL from Coolify → gaqno-sso-service → Environment.
#    Use the same host (e.g. postgres internal hostname). Replace /gaqno_sso
#    with /postgres for the create-databases step.
#
# 2. SSH to Coolify server, cd to repo, then:
#
#    export DATABASE_URL='postgresql://postgres:PASSWORD@HOST:5432/postgres'
#    ./docs/seed-production-run.sh
#
# 3. Or run inside a Coolify one-off container (same network as Postgres):
#    Coolify → gaqno-sso-service → Execute / Run Command:
#    cd /app && ./docs/seed-production-run.sh
#    (DATABASE_URL is already set in the container)
#
# =============================================================================

set -e
WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKSPACE"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is required."
  echo ""
  echo "Get it from Coolify → gaqno-sso-service → Environment → DATABASE_URL"
  echo "Use the same connection string (replace /gaqno_sso with /postgres for step 1)."
  echo ""
  echo "Example:"
  echo "  export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@postgres:5432/postgres'"
  echo "  ./docs/seed-production-run.sh"
  exit 1
fi

BASE="${DATABASE_URL%%\?*}"
BASE="${BASE%/}"
if [[ "$BASE" =~ :[0-9]+/.+ ]]; then
  BASE="${BASE%/*}"
fi
SSO_URL="${BASE}/gaqno_sso"
POSTGRES_URL="${BASE}/postgres"

echo "=== Step 1: Create databases ==="
for db in gaqno_sso gaqno_ai gaqno_finance gaqno_pdv gaqno_rpg gaqno_omnichannel; do
  psql "$POSTGRES_URL" -c "CREATE DATABASE $db;" 2>/dev/null || echo "  (skip: $db exists)"
done

echo ""
echo "=== Step 2: SSO schema (push-db) ==="
DATABASE_URL="$SSO_URL" node "$WORKSPACE/gaqno-sso-service/push-db.js"

echo ""
echo "=== Step 3: SSO enum ==="
psql "$SSO_URL" -f "$WORKSPACE/gaqno-sso-service/scripts/seed-production-enum.sql" 2>/dev/null || true

echo ""
echo "=== Step 4: SSO seed (tenant, permissions, roles, user) ==="
psql "$SSO_URL" -f "$WORKSPACE/gaqno-sso-service/scripts/seed-production.sql"

echo ""
echo "=== Step 5: Finance schema + seed ==="
DATABASE_URL="${BASE}/gaqno_finance" node "$WORKSPACE/gaqno-finance-service/push-db.js"
TENANT_ID=$(psql "$SSO_URL" -tAc "SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1" 2>/dev/null | tr -d ' \n\r')
DATABASE_URL="${BASE}/gaqno_finance" node "$WORKSPACE/gaqno-finance-service/seed-categories.js" "$TENANT_ID"

echo ""
echo "=== Step 6: Omnichannel schema + seed ==="
DATABASE_URL="${BASE}/gaqno_omnichannel" node "$WORKSPACE/gaqno-omnichannel-service/push-db.js"
DATABASE_URL="${BASE}/gaqno_omnichannel" TENANT_ID="$TENANT_ID" node "$WORKSPACE/gaqno-omnichannel-service/scripts/seed-agent-channels.js"

echo ""
echo "=== Step 7: RPG schema + seed ==="
DATABASE_URL="${BASE}/gaqno_rpg" node "$WORKSPACE/gaqno-rpg-service/push-db.js"
DATABASE_URL="${BASE}/gaqno_rpg" node "$WORKSPACE/gaqno-rpg-service/seed-default-campaign.js"

echo ""
echo "✅ Production seed complete."

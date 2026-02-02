#!/usr/bin/env bash
# Run Finance, Omnichannel, and RPG production seeds.
# Ensures all tables exist (runs push-db.js) before seeding.
#
# Prerequisites: DBs created (docs/pgadmin/create-databases.sh), SSO DB seeded
# (gaqno-sso-service/scripts/seed-server.sh or seed-production.sql) so tenant
# gaqno-development exists.
#
# Usage: export DATABASE_URL='postgres://user:pass@host:5432/postgres'
#        ./docs/seed-all-production.sh
# Or: script loads DATABASE_URL from workspace .env if not set.

set -e
WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
if [ -z "$DATABASE_URL" ] && [ -f "$WORKSPACE/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$WORKSPACE/.env"
  set +a
fi
if [ -z "$DATABASE_URL" ]; then
  echo "Set DATABASE_URL (e.g. postgres://user:pass@host:5432/postgres) or add it to $WORKSPACE/.env"
  exit 1
fi

BASE="${DATABASE_URL%%\?*}"
BASE="${BASE%/}"
# Only strip last path component if URL has a db path (e.g. :5432/postgres)
if [[ "$BASE" =~ :[0-9]+/.+ ]]; then
  BASE="${BASE%/*}"
fi
SSO_URL="${BASE}/gaqno_sso"
FINANCE_URL="${BASE}/gaqno_finance"
RPG_URL="${BASE}/gaqno_rpg"
OMNI_URL="${BASE}/gaqno_omnichannel"

TENANT_ID=$(psql "$SSO_URL" -tAc "SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1" 2>/dev/null) || true
TENANT_ID=$(echo "$TENANT_ID" | tr -d ' \n\r')

if [ -z "$TENANT_ID" ]; then
  echo "Tenant gaqno-development not found."
  echo "  - If you see a connection error above, check DATABASE_URL and that the host is reachable."
  echo "  - If the DB connects, run SSO seed first: seed-production.sql or gaqno-sso-service/scripts/seed-server.sh"
  exit 1
fi

echo "Tenant ID: $TENANT_ID"
echo ""

echo "0/5 Finance: ensuring schema (push-db)..."
DATABASE_URL="$FINANCE_URL" node "$WORKSPACE/gaqno-finance-service/push-db.js"

echo ""
echo "1/5 Finance: default categories..."
DATABASE_URL="$FINANCE_URL" node "$WORKSPACE/gaqno-finance-service/seed-categories.js" "$TENANT_ID"

echo ""
echo "2/5 Omnichannel: ensuring schema (push-db)..."
DATABASE_URL="$OMNI_URL" node "$WORKSPACE/gaqno-omnichannel-service/push-db.js"

echo ""
echo "3/5 Omnichannel: agent channels (tom, gabs)..."
DATABASE_URL="$OMNI_URL" TENANT_ID="$TENANT_ID" node "$WORKSPACE/gaqno-omnichannel-service/scripts/seed-agent-channels.js"

echo ""
echo "4/5 RPG: ensuring schema (push-db)..."
DATABASE_URL="$RPG_URL" node "$WORKSPACE/gaqno-rpg-service/push-db.js"

echo ""
echo "5/5 RPG: default campaign and session..."
DATABASE_URL="$RPG_URL" node "$WORKSPACE/gaqno-rpg-service/seed-default-campaign.js"

echo ""
echo "Done. All schemas ensured and seeds completed."

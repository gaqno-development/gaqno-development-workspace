#!/usr/bin/env bash
# Full production seed: creates DBs, SSO schema+seed, then Finance/Omnichannel/RPG schema+seed.
# Every table used is created (push-db) and seeded.
#
# Usage: export DATABASE_URL='postgresql://user:pass@host:5432/postgres'
#        ./docs/seed-all.sh
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
  echo "Set DATABASE_URL (e.g. postgresql://user:pass@host:5432/postgres) or add to $WORKSPACE/.env"
  exit 1
fi

BASE="${DATABASE_URL%%\?*}"
BASE="${BASE%/}"
# Only strip last path component if URL has a db path (e.g. :5432/postgres)
# When URL ends with :5432 (no path), %/* would wrongly strip the host
if [[ "$BASE" =~ :[0-9]+/.+ ]]; then
  BASE="${BASE%/*}"
fi
SSO_URL="${BASE}/gaqno_sso"

echo "=== Step 1: Create databases ==="
POSTGRES_URL="${BASE}/postgres"
for db in gaqno_sso gaqno_ai gaqno_finance gaqno_pdv gaqno_rpg gaqno_omnichannel; do
  psql "$POSTGRES_URL" -c "CREATE DATABASE $db;" 2>/dev/null || echo "  (skip: $db exists)"
done

echo ""
echo "=== Step 2: SSO schema (push-db) ==="
DATABASE_URL="$SSO_URL" node "$WORKSPACE/gaqno-sso-service/push-db.js"

echo ""
echo "=== Step 3: SSO enum (seed-production-enum) ==="
psql "$SSO_URL" -f "$WORKSPACE/gaqno-sso-service/scripts/seed-production-enum.sql" 2>/dev/null || true

echo ""
echo "=== Step 4: SSO seed (tenant, permissions, roles, user) ==="
psql "$SSO_URL" -f "$WORKSPACE/gaqno-sso-service/scripts/seed-production.sql"

echo ""
echo "=== Step 5: Finance, Omnichannel, RPG (schema + seed) ==="
"$WORKSPACE/docs/seed-all-production.sh"

echo ""
echo "Done. All databases created, schemas applied, and seeds completed."

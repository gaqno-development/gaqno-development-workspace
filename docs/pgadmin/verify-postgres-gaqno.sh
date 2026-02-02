#!/usr/bin/env bash
# Verify Postgres-Gaqno: all app DBs exist and (optional) gaqno_sso has schema.
# Usage: DATABASE_URL='postgres://user:pass@host:5432/postgres' ./docs/pgadmin/verify-postgres-gaqno.sh

set -e
if [ -z "$DATABASE_URL" ]; then
  echo "Set DATABASE_URL (e.g. postgres://postgres:pass@host:5432/postgres)"
  exit 1
fi

BASE="${DATABASE_URL%/*}"
DBS="gaqno_sso gaqno_ai gaqno_finance gaqno_pdv gaqno_rpg gaqno_omnichannel"
FAIL=0

echo "Checking databases on $BASE..."
for db in $DBS; do
  if psql "${BASE}/${db}" -tAc "SELECT 1" 2>/dev/null | grep -q 1; then
    echo "  OK $db"
  else
    echo "  MISSING $db"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 0 ]; then
  echo ""
  echo "Checking gaqno_sso schema (sso_tenants)..."
  if psql "${BASE}/gaqno_sso" -tAc "SELECT 1 FROM sso_tenants LIMIT 1" 2>/dev/null | grep -q 1; then
    echo "  OK sso_tenants exists"
  else
    echo "  WARN sso_tenants missing or empty (run migrations + seed)"
  fi
  echo ""
  echo "Postgres-Gaqno verification passed."
else
  echo ""
  echo "Run docs/pgadmin/create-databases.sql (connected to postgres) to create missing DBs."
  exit 1
fi

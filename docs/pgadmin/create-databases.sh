#!/usr/bin/env bash
# Create all app databases. Each CREATE DATABASE runs in its own connection
# (PostgreSQL does not allow CREATE DATABASE inside a transaction block).
# Usage: DATABASE_URL='postgres://user:pass@host:5432/postgres' ./docs/pgadmin/create-databases.sh

set -e
if [ -z "$DATABASE_URL" ]; then
  echo "Set DATABASE_URL (e.g. postgres://postgres:pass@host:5432/postgres)"
  exit 1
fi

for db in gaqno_sso gaqno_ai gaqno_finance gaqno_pdv gaqno_rpg gaqno_omnichannel; do
  psql "$DATABASE_URL" -c "CREATE DATABASE $db;" 2>/dev/null || echo "  (skip: $db exists)"
done
echo "Done."

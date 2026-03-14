#!/bin/bash
set -e

DATABASES=(
  gaqno_sso_db
  gaqno_ai_db
  gaqno_admin_db
  gaqno_consumer_db
  gaqno_crm_db
  gaqno_customer_db
  gaqno_erp_db
  gaqno_finance_db
  gaqno_intelligence_db
  gaqno_lead_enrichment_db
  gaqno_omnichannel_db
  gaqno_pdv_db
  gaqno_rpg_db
  gaqno_wellness_db
)

for db in "${DATABASES[@]}"; do
  if psql -U "$POSTGRES_USER" -tc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1; then
    echo "Database $db already exists — skipping"
  else
    psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db"
    echo "Created database $db"
  fi
done

echo "All databases ready."

-- =============================================================================
-- Run in database gaqno_finance_db BEFORE 02-finance.sql (seed).
-- Creates enums and finance_categories table if the finance service has not
-- run push-db on this database yet.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM('pago', 'a_pagar', 'em_atraso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM('none', 'fifth_business_day', 'day_15', 'last_day', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type transaction_type NOT NULL,
  color VARCHAR(50),
  icon VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_categories_tenant_idx ON finance_categories(tenant_id);

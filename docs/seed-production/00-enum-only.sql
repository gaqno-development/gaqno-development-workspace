-- =============================================================================
-- RUN THIS FIRST on database gaqno_sso.
-- Then COMMIT the transaction (pgAdmin: Commit button, or end transaction).
-- Then run 01-sso-seed.sql in the same or a new query window.
-- (PostgreSQL does not allow using new enum values until they are committed.)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module') THEN
    ALTER TYPE module ADD VALUE IF NOT EXISTS 'AI';
    ALTER TYPE module ADD VALUE IF NOT EXISTS 'OMNICHANNEL';
    ALTER TYPE module ADD VALUE IF NOT EXISTS 'RPG';
  ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sso_module') THEN
    ALTER TYPE sso_module ADD VALUE IF NOT EXISTS 'AI';
    ALTER TYPE sso_module ADD VALUE IF NOT EXISTS 'OMNICHANNEL';
    ALTER TYPE sso_module ADD VALUE IF NOT EXISTS 'RPG';
  ELSE
    RAISE EXCEPTION 'Enum "module" or "sso_module" not found. Run DB migrations first.';
  END IF;
END $$;

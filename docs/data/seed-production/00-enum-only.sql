-- =============================================================================
-- Only needed if you used push-db/migrations (not 00-sso-schema.sql).
-- If you ran 00-sso-schema.sql first, SKIP this file — the module enum already has AI, OMNICHANNEL, RPG.
--
-- When needed: run this, then COMMIT, then run 01-sso-seed.sql.
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
    RAISE EXCEPTION 'Enum "module" or "sso_module" not found. Run 00-sso-schema.sql first.';
  END IF;
END $$;

-- Migration script to convert isPublic from JSONB to BOOLEAN
-- Run this script on your PostgreSQL database before deploying the code changes

-- Step 1: Convert existing JSONB values to boolean
-- This handles both string values ('true'/'false') and boolean values
UPDATE rpg_campaigns 
SET is_public = CASE 
  WHEN is_public::text = 'true' OR is_public::text = '"true"' THEN true
  WHEN is_public::text = 'false' OR is_public::text = '"false"' THEN false
  ELSE false
END;

-- Step 2: Drop the existing index
DROP INDEX IF EXISTS rpg_campaigns_public_idx;

-- Step 3: Alter the column type from JSONB to BOOLEAN
ALTER TABLE rpg_campaigns 
ALTER COLUMN is_public TYPE BOOLEAN 
USING (CASE 
  WHEN is_public::text = 'true' OR is_public::text = '"true"' THEN true
  WHEN is_public::text = 'false' OR is_public::text = '"false"' THEN false
  ELSE false
END);

-- Step 4: Set the default value
ALTER TABLE rpg_campaigns 
ALTER COLUMN is_public SET DEFAULT false;

-- Step 5: Recreate the index on the boolean column
CREATE INDEX IF NOT EXISTS rpg_campaigns_public_idx ON rpg_campaigns(is_public);

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'rpg_campaigns' 
  AND column_name = 'is_public';


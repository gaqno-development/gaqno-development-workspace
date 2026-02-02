-- =============================================================================
-- Run in database gaqno_omnichannel BEFORE 03-omnichannel.sql (seed).
-- Creates enum and omni_channels table if the omnichannel service has not
-- run push-db on this database yet.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE omni_channel_type AS ENUM('whatsapp', 'instagram', 'web', 'email', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS omni_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type omni_channel_type NOT NULL,
  external_id VARCHAR(255),
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS omni_channels_tenant_idx ON omni_channels(tenant_id);
CREATE INDEX IF NOT EXISTS omni_channels_type_idx ON omni_channels(type);

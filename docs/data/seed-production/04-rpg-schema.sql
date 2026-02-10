-- =============================================================================
-- Run in database gaqno_rpg_db BEFORE 04-rpg.sql (seed).
-- Creates enums and rpg_campaigns / rpg_sessions tables if the RPG service
-- has not run push-db on this database yet.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM('draft', 'active', 'paused', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS rpg_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  tenant_id UUID,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  concept JSONB,
  world JSONB,
  initial_narrative JSONB,
  npcs JSONB NOT NULL DEFAULT '[]',
  hooks JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN NOT NULL DEFAULT false,
  status campaign_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rpg_campaigns_tenant_idx ON rpg_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS rpg_campaigns_user_idx ON rpg_campaigns(user_id);
CREATE INDEX IF NOT EXISTS rpg_campaigns_public_idx ON rpg_campaigns(is_public);

CREATE TABLE IF NOT EXISTS rpg_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  tenant_id UUID,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES rpg_campaigns(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status session_status NOT NULL DEFAULT 'draft',
  room_code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rpg_sessions_tenant_idx ON rpg_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS rpg_sessions_user_idx ON rpg_sessions(user_id);
CREATE INDEX IF NOT EXISTS rpg_sessions_campaign_idx ON rpg_sessions(campaign_id);
CREATE UNIQUE INDEX IF NOT EXISTS rpg_sessions_room_code_key ON rpg_sessions(room_code);

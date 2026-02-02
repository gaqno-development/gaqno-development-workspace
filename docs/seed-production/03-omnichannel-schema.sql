-- =============================================================================
-- Run in database gaqno_omnichannel_db BEFORE 03-omnichannel.sql (seed).
-- Full schema matching gaqno-omnichannel-service Drizzle schema.
-- Run this if the omnichannel service has not run push-db on this database yet.
-- =============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE omni_conversation_status AS ENUM('open', 'pending', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE omni_channel_type AS ENUM('whatsapp', 'instagram', 'web', 'email', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE omni_message_direction AS ENUM('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE omni_agent_presence_status AS ENUM('online', 'away', 'busy', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE omni_team_type AS ENUM('ai_only', 'humans_only', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE omni_team_member_type AS ENUM('human', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables (order respects FK dependencies)
CREATE TABLE IF NOT EXISTS omni_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'basic',
  settings JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_orgs_name_idx ON omni_organizations(name);

CREATE TABLE IF NOT EXISTS omni_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  limits JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omni_usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  period VARCHAR(20) NOT NULL,
  counts JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_usage_tenant_period_idx ON omni_usage_counters(tenant_id, period);

CREATE TABLE IF NOT EXISTS omni_agent_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  status omni_agent_presence_status NOT NULL DEFAULT 'offline',
  availability BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_agent_presence_user_idx ON omni_agent_presence(user_id);
CREATE INDEX IF NOT EXISTS omni_agent_presence_tenant_idx ON omni_agent_presence(tenant_id);

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

CREATE TABLE IF NOT EXISTS omni_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  display_name VARCHAR(255),
  metadata JSONB,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_customers_tenant_idx ON omni_customers(tenant_id);

CREATE TABLE IF NOT EXISTS omni_customer_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES omni_customers(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES omni_channels(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  profile JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_customer_identities_customer_idx ON omni_customer_identities(customer_id);
CREATE INDEX IF NOT EXISTS omni_customer_identities_channel_external_idx ON omni_customer_identities(channel_id, external_id);

CREATE TABLE IF NOT EXISTS omni_customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES omni_customers(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_customer_tags_customer_idx ON omni_customer_tags(customer_id);

CREATE TABLE IF NOT EXISTS omni_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type omni_team_type NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_teams_tenant_idx ON omni_teams(tenant_id);

CREATE TABLE IF NOT EXISTS omni_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES omni_teams(id) ON DELETE CASCADE,
  member_type omni_team_member_type NOT NULL,
  user_id UUID,
  agent_slug VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_team_members_team_idx ON omni_team_members(team_id);

CREATE TABLE IF NOT EXISTS omni_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES omni_channels(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES omni_customers(id) ON DELETE SET NULL,
  team_id UUID REFERENCES omni_teams(id),
  status omni_conversation_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_conversations_tenant_idx ON omni_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS omni_conversations_channel_idx ON omni_conversations(channel_id);
CREATE INDEX IF NOT EXISTS omni_conversations_team_idx ON omni_conversations(team_id);
CREATE INDEX IF NOT EXISTS omni_conversations_status_idx ON omni_conversations(status);

CREATE TABLE IF NOT EXISTS omni_conversation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES omni_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  agent_slug VARCHAR(100),
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_assignments_conversation_idx ON omni_conversation_assignments(conversation_id);

CREATE TABLE IF NOT EXISTS omni_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES omni_conversations(id) ON DELETE CASCADE,
  direction omni_message_direction NOT NULL,
  body TEXT,
  payload JSONB,
  tags JSONB DEFAULT '[]'::jsonb,
  idempotency_key VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_messages_conversation_idx ON omni_messages(conversation_id);
CREATE INDEX IF NOT EXISTS omni_messages_idempotency_idx ON omni_messages(idempotency_key);

CREATE TABLE IF NOT EXISTS omni_business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_business_hours_tenant_idx ON omni_business_hours(tenant_id);

CREATE TABLE IF NOT EXISTS omni_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_faq_tenant_idx ON omni_faq(tenant_id);
CREATE INDEX IF NOT EXISTS omni_faq_sort_idx ON omni_faq(tenant_id, sort_order);

CREATE TABLE IF NOT EXISTS omni_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_routing_rules_tenant_idx ON omni_routing_rules(tenant_id);

CREATE TABLE IF NOT EXISTS omni_sla_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  first_response_minutes INTEGER NOT NULL,
  resolution_minutes INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_sla_rules_tenant_idx ON omni_sla_rules(tenant_id);

CREATE TABLE IF NOT EXISTS omni_sla_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES omni_conversations(id) ON DELETE CASCADE,
  sla_rule_id UUID REFERENCES omni_sla_rules(id) ON DELETE SET NULL,
  breach_type VARCHAR(50) NOT NULL,
  breached_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS omni_sla_breaches_conversation_idx ON omni_sla_breaches(conversation_id);

-- Run in database gaqno_ai_db.
-- Schema only (no seed data). ai_usage is populated at runtime when users make AI requests.

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  tenant_id UUID,
  user_id UUID,
  model VARCHAR(255),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_tenant_idx ON ai_usage(tenant_id);
CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_created_at_idx ON ai_usage(created_at);

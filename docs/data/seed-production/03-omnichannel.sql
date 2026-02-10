-- Run in database gaqno_omnichannel_db.
-- REQUIRED: Run 03-omnichannel-schema.sql first (creates omni_channels, omni_conversations, omni_teams, etc.).
-- Default tenant (gaqno-development): bc987094-6cf0-4f9d-9d1a-9d8932e92b8f

SET app.tenant_id = 'bc987094-6cf0-4f9d-9d1a-9d8932e92b8f';

INSERT INTO omni_channels (tenant_id, type, config, is_active)
SELECT current_setting('app.tenant_id')::uuid, 'agent'::omni_channel_type, '{"agentSlug":"tom"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM omni_channels WHERE tenant_id = current_setting('app.tenant_id')::uuid AND type = 'agent' AND config->>'agentSlug' = 'tom');

INSERT INTO omni_channels (tenant_id, type, config, is_active)
SELECT current_setting('app.tenant_id')::uuid, 'agent'::omni_channel_type, '{"agentSlug":"gabs"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM omni_channels WHERE tenant_id = current_setting('app.tenant_id')::uuid AND type = 'agent' AND config->>'agentSlug' = 'gabs');

-- Example: psql "postgresql://user:pass@host:5432/gaqno_omnichannel_db" -f 03-omnichannel.sql

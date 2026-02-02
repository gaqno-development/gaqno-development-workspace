-- Run in database gaqno_omnichannel.
-- If you get "relation omni_channels does not exist", run 03-omnichannel-schema.sql first.
-- Edit the UUID below (from gaqno_sso: SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1), then run this script.

SET app.tenant_id = 'bc987094-6cf0-4f9d-9d1a-9d8932e92b8f';

INSERT INTO omni_channels (tenant_id, type, config, is_active)
SELECT current_setting('app.tenant_id')::uuid, 'agent'::omni_channel_type, '{"agentSlug":"tom"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM omni_channels WHERE tenant_id = current_setting('app.tenant_id')::uuid AND type = 'agent' AND config->>'agentSlug' = 'tom');

INSERT INTO omni_channels (tenant_id, type, config, is_active)
SELECT current_setting('app.tenant_id')::uuid, 'agent'::omni_channel_type, '{"agentSlug":"gabs"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM omni_channels WHERE tenant_id = current_setting('app.tenant_id')::uuid AND type = 'agent' AND config->>'agentSlug' = 'gabs');

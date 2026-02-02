-- =============================================================================
-- ALL PRODUCTION SEED SQL — run on server Postgres (one DB per section)
-- =============================================================================
--
-- IMPORTANT (gaqno_sso): PostgreSQL does not allow using new enum values until
-- they are committed. Run 00-enum-only.sql first → COMMIT → then run this file
-- from STEP 1, OR run 01-sso-seed.sql after 00-enum-only.sql + commit.
--
-- Order:
--   0) gaqno_sso — 00-enum-only.sql (run, then COMMIT)
--   1) gaqno_sso — full SSO seed (this file from here, or 01-sso-seed.sql)
--   2) Get tenant UUID, replace __TENANT_ID__ in steps 3–4
--   3) gaqno_finance — categories
--   4) gaqno_omnichannel — agent channels
--   5) gaqno_rpg — default campaign and session
-- =============================================================================


-- =============================================================================
-- STEP 1 — Connect to gaqno_sso. (Run 00-enum-only.sql and COMMIT first.)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO sso_tenants (id, name, status, plan, metadata, created_at, updated_at)
SELECT gen_random_uuid(), 'gaqno-development', 'active', 'enterprise', '{"companyName":"gaqno development"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM sso_tenants WHERE name = 'gaqno-development');

INSERT INTO sso_permissions (key, module, description, is_system, created_at)
VALUES
  ('pdv.access', 'PDV', 'Access PDV module', true, NOW()),
  ('pdv.sales.create', 'PDV', 'Create sales in PDV', true, NOW()),
  ('pdv.sales.read', 'PDV', 'View sales in PDV', true, NOW()),
  ('pdv.sales.update', 'PDV', 'Update sales in PDV', true, NOW()),
  ('pdv.sales.delete', 'PDV', 'Delete sales in PDV', true, NOW()),
  ('pdv.products.manage', 'PDV', 'Manage PDV products', true, NOW()),
  ('pdv.inventory.read', 'PDV', 'View PDV inventory', true, NOW()),
  ('pdv.settings.write', 'PDV', 'Update PDV settings', true, NOW()),
  ('crm.access', 'CRM', 'Access CRM module', true, NOW()),
  ('crm.contacts.read', 'CRM', 'View CRM contacts', true, NOW()),
  ('crm.contacts.write', 'CRM', 'Create/update CRM contacts', true, NOW()),
  ('crm.contacts.delete', 'CRM', 'Delete CRM contacts', true, NOW()),
  ('crm.deals.read', 'CRM', 'View CRM deals', true, NOW()),
  ('crm.deals.manage', 'CRM', 'Manage CRM deals', true, NOW()),
  ('crm.pipeline.manage', 'CRM', 'Manage CRM pipeline', true, NOW()),
  ('crm.settings.write', 'CRM', 'Update CRM settings', true, NOW()),
  ('erp.access', 'ERP', 'Access ERP module', true, NOW()),
  ('erp.inventory.read', 'ERP', 'View ERP inventory', true, NOW()),
  ('erp.inventory.write', 'ERP', 'Update ERP inventory', true, NOW()),
  ('erp.inventory.manage', 'ERP', 'Full inventory management', true, NOW()),
  ('erp.orders.read', 'ERP', 'View orders', true, NOW()),
  ('erp.orders.manage', 'ERP', 'Manage orders', true, NOW()),
  ('erp.settings.write', 'ERP', 'Update ERP settings', true, NOW()),
  ('finance.access', 'FINANCE', 'Access Finance module', true, NOW()),
  ('finance.transactions.read', 'FINANCE', 'View transactions', true, NOW()),
  ('finance.transactions.write', 'FINANCE', 'Create/update transactions', true, NOW()),
  ('finance.reports.view', 'FINANCE', 'View financial reports', true, NOW()),
  ('finance.reports.export', 'FINANCE', 'Export financial reports', true, NOW()),
  ('finance.accounts.manage', 'FINANCE', 'Manage financial accounts', true, NOW()),
  ('finance.investments.read', 'FINANCE', 'View investments', true, NOW()),
  ('finance.settings.write', 'FINANCE', 'Update Finance settings', true, NOW()),
  ('admin.access', 'ADMIN', 'Access Admin module', true, NOW()),
  ('admin.users.read', 'ADMIN', 'View users', true, NOW()),
  ('admin.users.manage', 'ADMIN', 'Manage users', true, NOW()),
  ('admin.roles.read', 'ADMIN', 'View roles', true, NOW()),
  ('admin.roles.manage', 'ADMIN', 'Manage roles', true, NOW()),
  ('admin.settings.read', 'ADMIN', 'View settings', true, NOW()),
  ('admin.settings.write', 'ADMIN', 'Update settings', true, NOW()),
  ('admin.branches.manage', 'ADMIN', 'Manage branches', true, NOW()),
  ('admin.tenants.manage', 'ADMIN', 'Manage tenants', true, NOW()),
  ('admin.domains.read', 'ADMIN', 'View domains', true, NOW()),
  ('admin.domains.manage', 'ADMIN', 'Create/update/delete domains', true, NOW()),
  ('admin.domains.verify', 'ADMIN', 'Verify domains', true, NOW()),
  ('admin.domains.ssl_check', 'ADMIN', 'Check SSL certificates', true, NOW()),
  ('admin.tenants.costs.read', 'ADMIN', 'View tenant costs (from SaaS service)', true, NOW()),
  ('admin.usage.read', 'ADMIN', 'View user usage (administration)', true, NOW()),
  ('ai.access', 'AI', 'Access AI module', true, NOW()),
  ('ai.books.read', 'AI', 'View AI books/analytics', true, NOW()),
  ('ai.books.manage', 'AI', 'Manage AI books', true, NOW()),
  ('ai.insights.view', 'AI', 'View AI insights', true, NOW()),
  ('ai.avatar.create', 'AI', 'Create AI avatars', true, NOW()),
  ('ai.portrait.create', 'AI', 'Create portrait videos', true, NOW()),
  ('ai.settings.write', 'AI', 'Update AI settings', true, NOW()),
  ('rpg.access', 'RPG', 'Access RPG module', true, NOW()),
  ('rpg.campaigns.read', 'RPG', 'View RPG campaigns', true, NOW()),
  ('rpg.campaigns.manage', 'RPG', 'Manage RPG campaigns', true, NOW()),
  ('rpg.sessions.read', 'RPG', 'View RPG sessions', true, NOW()),
  ('rpg.sessions.manage', 'RPG', 'Manage RPG sessions', true, NOW()),
  ('rpg.characters.read', 'RPG', 'View RPG characters', true, NOW()),
  ('rpg.characters.manage', 'RPG', 'Manage RPG characters', true, NOW()),
  ('omnichannel.access', 'OMNICHANNEL', 'Access Omnichannel module', true, NOW()),
  ('omnichannel.inbox.read', 'OMNICHANNEL', 'View Omnichannel inbox', true, NOW()),
  ('omnichannel.settings.write', 'OMNICHANNEL', 'Update Omnichannel settings', true, NOW()),
  ('platform.all', 'PLATFORM', 'Full platform access (super admin)', true, NOW()),
  ('platform.debug.read', 'PLATFORM', 'View debug information', true, NOW()),
  ('platform.logs.read', 'PLATFORM', 'View system logs', true, NOW()),
  ('platform.impersonate', 'PLATFORM', 'Impersonate users', true, NOW()),
  ('dashboard.access', 'PLATFORM', 'Access root dashboard', true, NOW())
ON CONFLICT (key) DO NOTHING;

INSERT INTO sso_roles (id, name, key, description, scope, tenant_id, is_system, created_at, updated_at)
SELECT gen_random_uuid(), 'Super Admin', 'SUPER_ADMIN', 'Platform super administrator with full access', 'GLOBAL', NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM sso_roles WHERE key = 'SUPER_ADMIN' AND tenant_id IS NULL);

INSERT INTO sso_role_permissions (id, role_id, permission_id, conditions, created_at)
SELECT gen_random_uuid(), r.id, p.id, NULL, NOW()
FROM sso_roles r
CROSS JOIN sso_permissions p
WHERE r.key = 'SUPER_ADMIN' AND r.tenant_id IS NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO sso_users (id, email, password_hash, status, first_name, last_name, tenant_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'gabriel.aquino@outlook.com',
  crypt('Qesdaw312@', gen_salt('bf', 10)),
  'active',
  'Gabriel',
  'Aquino',
  (SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM sso_users WHERE email = 'gabriel.aquino@outlook.com');

UPDATE sso_users
SET status = 'active', tenant_id = (SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1), updated_at = NOW()
WHERE email = 'gabriel.aquino@outlook.com';

INSERT INTO sso_user_roles (id, user_id, role_id, branch_id, granted_at)
SELECT gen_random_uuid(), u.id, r.id, NULL, NOW()
FROM sso_users u
CROSS JOIN sso_roles r
WHERE u.email = 'gabriel.aquino@outlook.com' AND r.key = 'SUPER_ADMIN' AND r.tenant_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM sso_user_roles ur
  WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.branch_id IS NULL
);

INSERT INTO sso_whitelabel_configs (id, tenant_id, domain, company_name, app_name, primary_color, secondary_color, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'portal.gaqno.com.br', 'gaqno development', 'Gaqno Platform', '#000000', '#ffffff', NOW(), NOW()
FROM sso_tenants t
WHERE t.name = 'gaqno-development'
AND NOT EXISTS (SELECT 1 FROM sso_whitelabel_configs w WHERE w.tenant_id = t.id);


-- =============================================================================
-- STEP 2 — Connect to gaqno_sso, run this query, copy the UUID.
-- Then replace __TENANT_ID__ in STEP 3 and STEP 4 with that UUID.
-- =============================================================================

SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1;


-- =============================================================================
-- STEP 3 — Connect to gaqno_finance. Replace __TENANT_ID__ with the UUID from step 2.
-- =============================================================================

INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Moradia', 'expense'::transaction_type, '#3b82f6', '🏠'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Moradia');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Empréstimos', 'expense'::transaction_type, '#ef4444', '💳'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Empréstimos');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Carro', 'expense'::transaction_type, '#f59e0b', '🚗'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Carro');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Alimentação', 'expense'::transaction_type, '#10b981', '🍽️'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Alimentação');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Lazer', 'expense'::transaction_type, '#8b5cf6', '🎮'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Lazer');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Educação', 'expense'::transaction_type, '#06b6d4', '📚'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Educação');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Assinaturas', 'expense'::transaction_type, '#ec4899', '📱'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Assinaturas');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Saúde', 'expense'::transaction_type, '#f43f5e', '🏥'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Saúde');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Transporte', 'expense'::transaction_type, '#6366f1', '🚌'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Transporte');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Roupas', 'expense'::transaction_type, '#a855f7', '👕'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Roupas');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Salário', 'income'::transaction_type, '#22c55e', '💰'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Salário');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Freelance', 'income'::transaction_type, '#14b8a6', '💼'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Freelance');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Investimentos', 'income'::transaction_type, '#0ea5e9', '📈'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Investimentos');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT '__TENANT_ID__'::uuid, 'Outros', 'expense'::transaction_type, '#6b7280', '📦'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = '__TENANT_ID__'::uuid AND name = 'Outros');


-- =============================================================================
-- STEP 4 — Connect to gaqno_omnichannel. Replace __TENANT_ID__ with the UUID from step 2.
-- =============================================================================

INSERT INTO omni_channels (tenant_id, type, config, is_active)
SELECT '__TENANT_ID__'::uuid, 'agent'::omni_channel_type, '{"agentSlug":"tom"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM omni_channels WHERE tenant_id = '__TENANT_ID__'::uuid AND type = 'agent' AND config->>'agentSlug' = 'tom');

INSERT INTO omni_channels (tenant_id, type, config, is_active)
SELECT '__TENANT_ID__'::uuid, 'agent'::omni_channel_type, '{"agentSlug":"gabs"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM omni_channels WHERE tenant_id = '__TENANT_ID__'::uuid AND type = 'agent' AND config->>'agentSlug' = 'gabs');


-- =============================================================================
-- STEP 5 — Connect to gaqno_rpg. Run as-is (no tenant replacement).
-- =============================================================================

INSERT INTO rpg_campaigns (user_id, name, description, concept, world, initial_narrative, npcs, hooks, is_public, status)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  'A Ascensão do Lich Rei',
  'Uma campanha épica de fantasia onde os heróis devem impedir um Lich Rei de ressuscitar um antigo império de mortos-vivos. Aventure-se pelas terras de Eldoria e descubra os segredos sombrios que ameaçam toda a vida.',
  '{"theme":"Luta contra a morte e a corrupção","tone":"Sombrio, heroico, com momentos de esperança","setting":"Reino de Eldoria, um mundo de fantasia medieval com ruínas antigas e florestas místicas. O Lich Rei Malachar, outrora um poderoso mago real, busca ressuscitar seu império caído através de necromancia proibida."}'::jsonb,
  '{"name":"Eldoria","geography":"Eldoria é um reino vasto com três regiões principais: as Planícies Centrais onde fica a capital Pedraverde, as Florestas Sombrias ao norte habitadas por criaturas místicas, e as Montanhas Gélidas ao leste onde repousam as ruínas do antigo Império de Malachar. Rios sinuosos conectam as cidades, e estradas antigas levam a masmorras esquecidas.","magic":"Magia arcana e divina é comum, mas a necromancia é proibida e temida. Apenas magos licenciados podem praticar magia nas cidades. Artefatos mágicos são raros e valiosos, muitos deles escondidos nas ruínas do antigo império. O Lich Rei busca artefatos específicos para completar seu ritual de ressurreição em massa.","history":"Há mil anos, o Império de Malachar dominava Eldoria. Malachar, então um mago real ambicioso, mergulhou na necromancia proibida para conquistar a imortalidade. Seu império caiu em uma guerra cataclísmica, mas Malachar sobreviveu como Lich. Agora, após séculos de planejamento, ele busca ressuscitar seu exército de mortos-vivos e reconquistar Eldoria."}'::jsonb,
  '{"opening":"A paz reina em Eldoria há séculos, mas sussurros de escuridão começam a surgir das Criptas Esquecidas. Na cidade de Pedraverde, os heróis se encontram na Taverna do Urso Dourado quando um mensageiro coberto de poeira e terror entra correndo. Ele traz notícias terríveis: aldeias fronteiriças foram atacadas por hordas de mortos-vivos, e um artefato antigo - o Coração de Malachar - foi roubado do Templo Sagrado. O mensageiro cai morto antes de terminar, mas suas últimas palavras ecoam: Ele está voltando... o Lich Rei desperta.","inciting_incident":"Investigando os ataques, os heróis descobrem que os mortos-vivos estão sendo reanimados por uma magia poderosa e antiga. O Coração de Malachar, um artefato que contém a essência do Lich Rei, foi roubado por cultistas que servem ao antigo imperador. Testemunhas relatam ver uma figura encapuzada liderando os ataques - possivelmente o próprio Lich ou seu tenente mais leal, o Necromante Vorak. Se o ritual de ressurreição for completado, todo Eldoria cairá sob o domínio dos mortos-vivos.","first_quest":"Os heróis devem rastrear os cultistas até as Criptas Esquecidas, recuperar o Coração de Malachar antes que o ritual seja completado, e descobrir a localização da Fortaleza do Lich. A jornada os levará através de florestas assombradas, ruínas antigas e masmorras traiçoeiras. Eles precisarão da ajuda de aliados como o Mago Thaddeus, que conhece os segredos da necromancia, e da Capitã Elara, que pode fornecer recursos e informações sobre os ataques."}'::jsonb,
  '[{"name":"Gareth, o Mestre da Taverna","role":"Informante e Mentor","description":"Um ex-aventureiro aposentado que gerencia a Taverna do Urso Dourado.","motivation":"Proteger Eldoria e vingar seus companheiros."},{"name":"Capitã Elara","role":"Líder Militar e Aliada","description":"Capitã da guarda real de Pedraverde.","motivation":"Proteger os cidadãos de Eldoria."},{"name":"Mago Thaddeus","role":"Conselheiro Mágico","description":"Um mago erudito que estuda a história de Malachar.","motivation":"Prevenir que a necromancia destrua Eldoria."},{"name":"Necromante Vorak","role":"Tenente do Lich Rei","description":"Principal servidor vivo do Lich Rei.","motivation":"Completar o ritual de ressurreição."},{"name":"Lich Rei Malachar","role":"Vilão Principal","description":"O antigo imperador que se transformou em Lich.","motivation":"Ressuscitar seu império caído."},{"name":"Padre Marcus","role":"Guia Espiritual e Curandeiro","description":"Clerigo do Templo Sagrado de Pedraverde.","motivation":"Recuperar o artefato sagrado."}]'::jsonb,
  '["O Coração de Malachar foi levado para as Criptas Esquecidas.","O Mago Thaddeus descobriu que Malachar precisa de três artefatos.","Padre Marcus revela que existe uma arma sagrada no Templo."]'::jsonb,
  true,
  'active'::campaign_status
WHERE NOT EXISTS (SELECT 1 FROM rpg_campaigns WHERE name = 'A Ascensão do Lich Rei' AND is_public = true);

INSERT INTO rpg_sessions (user_id, campaign_id, name, description, status, room_code)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  (SELECT id FROM rpg_campaigns WHERE name = 'A Ascensão do Lich Rei' AND is_public = true LIMIT 1),
  'Sessão Inicial',
  'Sessão de desenvolvimento ligada à campanha padrão.',
  'draft'::session_status,
  'DEVSESSION'
WHERE NOT EXISTS (SELECT 1 FROM rpg_sessions WHERE room_code = 'DEVSESSION');

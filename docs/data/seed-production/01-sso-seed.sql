-- =============================================================================
-- Run AFTER 00-enum-only.sql and after COMMITTING that transaction.
-- Connect to database gaqno_sso_db. Run 00-enum-only.sql → Commit → then run this.
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

-- Copy the returned UUID; use it to replace bc987094-6cf0-4f9d-9d1a-9d8932e92b8f in 02-finance.sql and 03-omnichannel.sql
SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1;

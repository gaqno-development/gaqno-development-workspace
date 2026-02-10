-- Run in database gaqno_finance_db.
-- If you get "relation finance_categories does not exist", run 02-finance-schema.sql first.
-- Edit the UUID below (from gaqno_sso_db: SELECT id FROM sso_tenants WHERE name = 'gaqno-development' LIMIT 1), then run this script.

SET app.tenant_id = 'bc987094-6cf0-4f9d-9d1a-9d8932e92b8f';

INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Moradia', 'expense'::transaction_type, '#3b82f6', '🏠'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Moradia');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Empréstimos', 'expense'::transaction_type, '#ef4444', '💳'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Empréstimos');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Carro', 'expense'::transaction_type, '#f59e0b', '🚗'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Carro');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Alimentação', 'expense'::transaction_type, '#10b981', '🍽️'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Alimentação');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Lazer', 'expense'::transaction_type, '#8b5cf6', '🎮'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Lazer');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Educação', 'expense'::transaction_type, '#06b6d4', '📚'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Educação');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Assinaturas', 'expense'::transaction_type, '#ec4899', '📱'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Assinaturas');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Saúde', 'expense'::transaction_type, '#f43f5e', '🏥'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Saúde');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Transporte', 'expense'::transaction_type, '#6366f1', '🚌'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Transporte');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Roupas', 'expense'::transaction_type, '#a855f7', '👕'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Roupas');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Salário', 'income'::transaction_type, '#22c55e', '💰'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Salário');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Freelance', 'income'::transaction_type, '#14b8a6', '💼'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Freelance');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Investimentos', 'income'::transaction_type, '#0ea5e9', '📈'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Investimentos');
INSERT INTO finance_categories (tenant_id, name, type, color, icon)
SELECT current_setting('app.tenant_id')::uuid, 'Outros', 'expense'::transaction_type, '#6b7280', '📦'
WHERE NOT EXISTS (SELECT 1 FROM finance_categories WHERE tenant_id = current_setting('app.tenant_id')::uuid AND name = 'Outros');

-- =============================================================================
-- SSO schema for gaqno_sso_db. Run this FIRST before 00-enum-only.sql and 01-sso-seed.sql.
-- Creates all tables and enums. Use when DB is fresh (no migrations run).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE "tenant_status" AS ENUM('active', 'suspended', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "user_status" AS ENUM('active', 'invited', 'blocked', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "role_scope" AS ENUM('GLOBAL', 'TENANT', 'BRANCH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "module" AS ENUM('CRM', 'PDV', 'ERP', 'FINANCE', 'ADMIN', 'AI', 'PLATFORM', 'OMNICHANNEL', 'RPG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "sso_tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "status" "tenant_status" DEFAULT 'active' NOT NULL,
  "plan" varchar(50) DEFAULT 'basic',
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "tenants_name_idx" ON "sso_tenants" ("name");

CREATE TABLE IF NOT EXISTS "sso_branches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "code" varchar(50),
  "address" text,
  "city" varchar(100),
  "state" varchar(50),
  "zip_code" varchar(20),
  "phone" varchar(50),
  "email" varchar(255),
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "branches_tenant_idx" ON "sso_branches" ("tenant_id");
CREATE INDEX IF NOT EXISTS "branches_code_idx" ON "sso_branches" ("code");

CREATE TABLE IF NOT EXISTS "sso_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" varchar(255),
  "tenant_id" uuid REFERENCES "sso_tenants"("id") ON DELETE SET NULL,
  "status" "user_status" DEFAULT 'invited' NOT NULL,
  "first_name" varchar(100),
  "last_name" varchar(100),
  "phone" varchar(50),
  "avatar" text,
  "metadata" jsonb,
  "last_login_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "sso_users" ("email");
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "sso_users" ("tenant_id");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "sso_users" ("status");

CREATE TABLE IF NOT EXISTS "sso_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "key" varchar(100) NOT NULL,
  "description" text,
  "scope" "role_scope" DEFAULT 'TENANT' NOT NULL,
  "tenant_id" uuid REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "is_system" boolean DEFAULT false NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "roles_key_tenant_unique" ON "sso_roles" ("key", "tenant_id");
CREATE INDEX IF NOT EXISTS "roles_scope_idx" ON "sso_roles" ("scope");
CREATE INDEX IF NOT EXISTS "roles_tenant_idx" ON "sso_roles" ("tenant_id");

CREATE TABLE IF NOT EXISTS "sso_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL,
  "module" "module" NOT NULL,
  "description" text,
  "is_system" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_key_unique" ON "sso_permissions" ("key");
CREATE INDEX IF NOT EXISTS "permissions_module_idx" ON "sso_permissions" ("module");

CREATE TABLE IF NOT EXISTS "sso_user_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "sso_users"("id") ON DELETE CASCADE,
  "role_id" uuid NOT NULL REFERENCES "sso_roles"("id") ON DELETE CASCADE,
  "branch_id" uuid REFERENCES "sso_branches"("id") ON DELETE SET NULL,
  "granted_by" uuid REFERENCES "sso_users"("id") ON DELETE SET NULL,
  "granted_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp,
  "metadata" jsonb
);
CREATE INDEX IF NOT EXISTS "user_roles_user_idx" ON "sso_user_roles" ("user_id");
CREATE INDEX IF NOT EXISTS "user_roles_role_idx" ON "sso_user_roles" ("role_id");
CREATE INDEX IF NOT EXISTS "user_roles_branch_idx" ON "sso_user_roles" ("branch_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_role_branch_unique" ON "sso_user_roles" ("user_id", "role_id", "branch_id");

CREATE TABLE IF NOT EXISTS "sso_role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "role_id" uuid NOT NULL REFERENCES "sso_roles"("id") ON DELETE CASCADE,
  "permission_id" uuid NOT NULL REFERENCES "sso_permissions"("id") ON DELETE CASCADE,
  "conditions" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permission_unique" ON "sso_role_permissions" ("role_id", "permission_id");
CREATE INDEX IF NOT EXISTS "role_permissions_role_idx" ON "sso_role_permissions" ("role_id");
CREATE INDEX IF NOT EXISTS "role_permissions_permission_idx" ON "sso_role_permissions" ("permission_id");

CREATE TABLE IF NOT EXISTS "sso_refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "sso_users"("id") ON DELETE CASCADE,
  "token" varchar(500) NOT NULL,
  "device_id" varchar(255),
  "device_info" text,
  "ip_address" varchar(45),
  "user_agent" text,
  "expires_at" timestamp NOT NULL,
  "last_used_at" timestamp,
  "is_revoked" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_unique" ON "sso_refresh_tokens" ("token");
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_idx" ON "sso_refresh_tokens" ("user_id");

CREATE TABLE IF NOT EXISTS "sso_feature_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "module" "module" NOT NULL,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "config" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_tenant_module_unique" ON "sso_feature_flags" ("tenant_id", "module");
CREATE INDEX IF NOT EXISTS "feature_flags_tenant_idx" ON "sso_feature_flags" ("tenant_id");

CREATE TABLE IF NOT EXISTS "sso_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "action" varchar(100) NOT NULL,
  "actor_id" uuid REFERENCES "sso_users"("id") ON DELETE SET NULL,
  "target_id" uuid,
  "target_type" varchar(50),
  "tenant_id" uuid REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "branch_id" uuid REFERENCES "sso_branches"("id") ON DELETE SET NULL,
  "ip_address" varchar(45),
  "user_agent" text,
  "data" jsonb,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "audit_events_actor_idx" ON "sso_audit_events" ("actor_id");
CREATE INDEX IF NOT EXISTS "audit_events_tenant_idx" ON "sso_audit_events" ("tenant_id");
CREATE INDEX IF NOT EXISTS "audit_events_action_idx" ON "sso_audit_events" ("action");
CREATE INDEX IF NOT EXISTS "audit_events_created_idx" ON "sso_audit_events" ("created_at");

CREATE TABLE IF NOT EXISTS "sso_whitelabel_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "domain" varchar(255),
  "logo_url" text,
  "favicon_url" text,
  "primary_color" varchar(7) DEFAULT '#000000',
  "secondary_color" varchar(7) DEFAULT '#ffffff',
  "company_name" varchar(255) NOT NULL,
  "app_name" varchar(100),
  "font_family" varchar(100),
  "custom_css" text,
  "config" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "whitelabel_configs_tenant_idx" ON "sso_whitelabel_configs" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "whitelabel_configs_domain_unique" ON "sso_whitelabel_configs" ("domain");

CREATE TABLE IF NOT EXISTS "sso_dashboard_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "sso_users"("id") ON DELETE SET NULL,
  "tenant_id" uuid NOT NULL REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "widgets" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "layout" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "dashboard_preferences_tenant_idx" ON "sso_dashboard_preferences" ("tenant_id");
CREATE INDEX IF NOT EXISTS "dashboard_preferences_user_idx" ON "sso_dashboard_preferences" ("user_id");

CREATE TABLE IF NOT EXISTS "sso_menu_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "role_id" uuid REFERENCES "sso_roles"("id") ON DELETE CASCADE,
  "item_id" varchar(100) NOT NULL,
  "parent_id" varchar(100),
  "label" varchar(255),
  "href" varchar(500),
  "icon" varchar(100),
  "required_permissions" jsonb,
  "sort_order" varchar(20) DEFAULT '0' NOT NULL,
  "is_hidden" boolean DEFAULT false NOT NULL,
  "is_custom" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "menu_overrides_tenant_role_item_unique" ON "sso_menu_overrides" ("tenant_id", "item_id") WHERE "role_id" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "menu_overrides_tenant_role_item_nonnull_unique" ON "sso_menu_overrides" ("tenant_id", "role_id", "item_id") WHERE "role_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "menu_overrides_tenant_idx" ON "sso_menu_overrides" ("tenant_id");
CREATE INDEX IF NOT EXISTS "menu_overrides_role_idx" ON "sso_menu_overrides" ("role_id");

DO $$ BEGIN CREATE TYPE "verification_method" AS ENUM('dns', 'file', 'meta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ssl_certificate_status" AS ENUM('valid', 'expiring', 'expired', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "sso_domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "sso_tenants"("id") ON DELETE CASCADE,
  "domain" varchar(255) NOT NULL,
  "is_verified" boolean DEFAULT false NOT NULL,
  "verification_method" "verification_method",
  "verification_token" varchar(255),
  "ssl_certificate_issued_at" timestamp,
  "ssl_certificate_expires_at" timestamp,
  "ssl_certificate_status" "ssl_certificate_status" DEFAULT 'none',
  "ssl_last_checked_at" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "domains_domain_unique" ON "sso_domains" ("domain");
CREATE INDEX IF NOT EXISTS "domains_tenant_idx" ON "sso_domains" ("tenant_id");

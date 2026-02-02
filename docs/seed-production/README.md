# Production seed – tables created and seeded

## Quick start (recommended)

**Full seed (all DBs, schemas, seeds):**

```bash
export DATABASE_URL='postgresql://user:pass@host:5432/postgres'
./docs/seed-all.sh
```

This creates all databases, runs `push-db.js` for each service (ensuring every table exists), then seeds SSO, Finance, Omnichannel, and RPG.

**Finance/Omnichannel/RPG only** (SSO already seeded):

```bash
export DATABASE_URL='postgresql://user:pass@host:5432/postgres'
./docs/seed-all-production.sh
```

Runs `push-db.js` before each seed so all tables exist.

---

## Tables created (push-db) and seeded

| Database              | Schema (push-db.js)                                                      | Seed                                         |
| --------------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| **gaqno_sso**         | sso_tenants, sso_users, sso_permissions, sso_roles, sso_user_roles, etc. | Tenant, permissions, roles, super admin user |
| **gaqno_finance**     | finance_categories, finance_subcategories, finance_transactions, etc.    | Default categories                           |
| **gaqno_omnichannel** | omni_channels, omni_conversations, omni_messages, omni_teams, etc.       | Agent channels (tom, gabs)                   |
| **gaqno_rpg**         | rpg_campaigns, rpg_sessions, etc.                                        | Default campaign and session                 |

---

## SQL-based (manual)

### gaqno_sso (run in this order)

1. **`00-enum-only.sql`** — Connect to **gaqno_sso**, run, then **COMMIT** (pgAdmin: Commit button).
2. **`01-sso-seed.sql`** — Same database, run after commit.

### gaqno_finance

Run **`02-finance-schema.sql`** first if tables don't exist. Then:

```bash
psql "postgresql://user:pass@host:5432/gaqno_finance" -c "SET app.tenant_id = 'YOUR-UUID';" -f 02-finance.sql
```

### gaqno_omnichannel

Run **`03-omnichannel-schema.sql`** first if tables don't exist (or use `push-db.js` for full schema). Then:

```bash
psql "postgresql://user:pass@host:5432/gaqno_omnichannel" -c "SET app.tenant_id = 'YOUR-UUID';" -f 03-omnichannel.sql
```

### gaqno_rpg

Run **`04-rpg-schema.sql`** first if tables don't exist. Then:

```bash
psql "postgresql://user:pass@host:5432/gaqno_rpg" -f 04-rpg.sql
```

---

## Option: Single file (00-all-seed.sql)

Use **`00-all-seed.sql`** from Step 1 onward (after **00-enum-only.sql** + commit). Run each section in the right database. Replace `__TENANT_ID__` in steps 3–4 with the UUID from step 2.

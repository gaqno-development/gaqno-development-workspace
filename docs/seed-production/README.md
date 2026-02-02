# Production seed – SQL via pgAdmin

All seeding is done via SQL in pgAdmin. No shell scripts.

---

## 1. Create databases

Connect to **postgres** in pgAdmin. Run each `CREATE DATABASE` from `docs/pgadmin/create-databases.sql` separately (pgAdmin cannot run multiple `CREATE DATABASE` in one block).

---

## 2. Tables and seed order

| Database                 | Schema file               | Seed file          |
| ------------------------ | ------------------------- | ------------------ |
| **gaqno_sso_db**         | 00-sso-schema.sql         | 01-sso-seed.sql    |
| **gaqno_finance_db**     | 02-finance-schema.sql     | 02-finance.sql     |
| **gaqno_omnichannel_db** | 03-omnichannel-schema.sql | 03-omnichannel.sql |
| **gaqno_rpg_db**         | 04-rpg-schema.sql         | 04-rpg.sql         |
| **gaqno_ai_db**          | 05-ai-schema.sql          | (none)             |

---

## 3. gaqno_sso_db (run in this order)

1. **`00-sso-schema.sql`** — Connect to **gaqno_sso_db**, run (creates all tables and enums).
2. **`01-sso-seed.sql`** — Same database, run after schema.

---

## 4. gaqno_finance_db

1. Run **`02-finance-schema.sql`** (creates tables).
2. Run **`02-finance.sql`** (uses default tenant `bc987094-6cf0-4f9d-9d1a-9d8932e92b8f`).

---

## 5. gaqno_omnichannel_db

1. Run **`03-omnichannel-schema.sql`** (creates omni_channels, omni_conversations, omni_teams, omni_team_members, etc.).
2. Run **`03-omnichannel.sql`** (agent channels tom, gabs; uses default tenant `bc987094-6cf0-4f9d-9d1a-9d8932e92b8f`).

---

## 6. gaqno_rpg_db

1. Run **`04-rpg-schema.sql`** (creates tables).
2. Run **`04-rpg.sql`** (default campaign and session).

---

## 7. gaqno_ai_db

Run **`05-ai-schema.sql`** (creates ai_usage table). No seed data — usage is recorded at runtime.

---

## Option: Single file (00-all-seed.sql)

Use **`00-all-seed.sql`** from Step 1 onward (after **00-enum-only.sql** + commit). Run each section in the correct database. Replace `__TENANT_ID__` in steps 3–4 with the tenant UUID from step 2.

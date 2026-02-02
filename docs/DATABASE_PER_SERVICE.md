# One Database Per Service

Each backend service must use its **own dedicated database**. The default `postgres` database must not contain application tables.

## Database Mapping

| Service                   | Database              | Table prefixes   |
| ------------------------- | --------------------- | ---------------- |
| gaqno-sso-service         | `gaqno_sso_db`        | `sso_*`          |
| gaqno-ai-service          | `gaqno_ai_db`         | `ai_*`           |
| gaqno-finance-service     | `gaqno_finance_db`    | `finance_*`      |
| gaqno-pdv-service         | `gaqno_pdv_db`        | `pdv_*`          |
| gaqno-rpg-service         | `gaqno_rpg_db`        | `rpg_*`, `dnd_*` |
| gaqno-omnichannel-service | `gaqno_omnichannel_db`| `omni_*`         |

## Correct DATABASE_URL Format

```
postgresql://user:password@host:5432/<database_name>
```

Example for production:

```
DATABASE_URL=postgresql://postgres:xxx@72.61.221.19:5432/gaqno_rpg_db
```

## If Tables Are in `postgres`

If services were previously pointed at `postgres`, their tables may exist there. To fix:

### Option A: Fresh Start (no data to keep)

1. Ensure each database exists: `docs/pgadmin/create-databases.sql`
2. Update each service `.env` to use the correct database (see above)
3. Run `push-db.js` for each service against its database
4. Run seed scripts for each service

### Option B: Migrate Existing Data

1. Identify tables in `postgres` by prefix (see table above)
2. For each service, dump and restore:

```bash
# Example: migrate RPG tables from postgres to gaqno_rpg_db
pg_dump -h HOST -U postgres -d postgres -t 'rpg_*' -t 'dnd_*' --schema-only -f rpg_schema.sql
psql -h HOST -U postgres -d gaqno_rpg_db -f rpg_schema.sql

pg_dump -h HOST -U postgres -d postgres -t 'rpg_*' -t 'dnd_*' --data-only -f rpg_data.sql
psql -h HOST -U postgres -d gaqno_rpg_db -f rpg_data.sql
```

3. Update service `.env` to point to the correct database
4. Restart services

### Verify in pgAdmin

- `postgres` database: should only have system catalogs, no `sso_*`, `finance_*`, `pdv_*`, `rpg_*`, `dnd_*`, or `omni_*` tables
- Each `gaqno_*_db` database: should contain only its service tables

## Seed on Deploy

Each backend runs **push-db** (schema) and optionally **seed** on container startup. Seeds are **idempotent** (skip if data already exists). See `COOLIFY_ENV_CONFIG.md` for `SEED_TENANT_ID` setup.

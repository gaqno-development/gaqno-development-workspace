# Database

Database names, tables, and setup.

## Database per Service

Each backend uses its **own database**. Never use the default `postgres` for application tables.

| Service                   | Database               | Table prefixes   |
| ------------------------- | ---------------------- | ---------------- |
| gaqno-sso-service         | `gaqno_sso_db`         | `sso_*`          |
| gaqno-ai-service          | `gaqno_ai_db`          | `ai_*`           |
| gaqno-finance-service     | `gaqno_finance_db`     | `finance_*`      |
| gaqno-pdv-service         | `gaqno_pdv_db`         | `pdv_*`          |
| gaqno-rpg-service         | `gaqno_rpg_db`         | `rpg_*`, `dnd_*` |
| gaqno-omnichannel-service | `gaqno_omnichannel_db` | `omni_*`         |

## Create Databases

Run each `CREATE DATABASE` separately (cannot run in transaction). Scripts em [../data/pgadmin/](../data/):

- `../data/pgadmin/create-databases.sql` – Create all databases
- `../data/pgadmin/drop-and-recreate-databases.sql` – Drop and recreate

```sql
CREATE DATABASE gaqno_sso_db;
CREATE DATABASE gaqno_ai_db;
CREATE DATABASE gaqno_finance_db;
CREATE DATABASE gaqno_pdv_db;
CREATE DATABASE gaqno_rpg_db;
CREATE DATABASE gaqno_omnichannel_db;
```

## DATABASE_URL Format

```
postgresql://user:password@host:5432/<database_name>
```

Example: `postgresql://postgres:xxx@host:5432/gaqno_rpg_db`

## Schema and Seed

Each service runs `push-db.js` on container startup (schema). Some run seed scripts. See [../guides/backend.md](../guides/backend.md) for seed configuration.

## Scripts e dados

- [../data/README.md](../data/README.md) – Índice de pgadmin e seed-production

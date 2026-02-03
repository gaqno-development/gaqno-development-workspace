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

Run each `CREATE DATABASE` separately (cannot run in transaction). See `pgadmin/create-databases.sql`:

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

Each service runs `push-db.js` on container startup (schema). Some run seed scripts. See [BACKEND.md](BACKEND.md) for seed configuration.

## pgadmin

- `pgadmin/create-databases.sql` – Create all databases
- `pgadmin/drop-and-recreate-databases.sql` – Drop and recreate
- `pgadmin/servers.json` – pgAdmin server config

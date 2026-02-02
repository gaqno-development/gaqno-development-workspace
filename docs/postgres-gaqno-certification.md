# Postgres-Gaqno Configuration Certification

**Last checked:** 2026-01-31  
**Coolify databases (MCP):** `list_databases` returns only **redis-gaqno**. postgresql-gaqno is not in this project’s DB list (may be another project/server).  
**Postgres in use:** Host `kwokwsos8o8w44kk0os0g0s0`, port 5432, user **postgres**. Password must match **gaqno-sso-service** `DATABASE_URL` in Coolify (env_vars).

---

## 1. Current state (from Coolify MCP)

| Item                      | Status                                                               |
| ------------------------- | -------------------------------------------------------------------- |
| PostgreSQL in MCP list    | **Not listed** – only redis-gaqno; postgresql-gaqno may be elsewhere |
| pgAdmin service           | `gaqno-pgadmin` – running, healthy                                   |
| Postgres host             | `kwokwsos8o8w44kk0os0g0s0`, port 5432                                |
| Username (apps + pgAdmin) | **postgres** (from gaqno-sso-service DATABASE_URL)                   |
| Password                  | Same as in Coolify **gaqno-sso-service** → `DATABASE_URL` (env_vars) |

**If pgAdmin reports “password authentication failed for user postgres”:** the password you enter in pgAdmin must be **exactly** the one in Coolify for gaqno-sso-service `DATABASE_URL`. After a DB restart, if the Postgres instance was recreated with a new password, either: (1) set the Postgres password back to the value in Coolify, or (2) update Coolify env (all apps using this DB) and use the new password in pgAdmin.

---

## 2. Required configuration (canonical)

### 2.1 One database per application

| Database name         | Used by                   |
| --------------------- | ------------------------- |
| `gaqno_sso_db`        | gaqno-sso-service         |
| `gaqno_finance_db`    | gaqno-finance-service     |
| `gaqno_pdv_db`        | gaqno-pdv-service         |
| `gaqno_rpg_db`        | gaqno-rpg-service         |
| `gaqno_ai_db`         | gaqno-ai-service          |
| `gaqno_omnichannel_db`| gaqno-omnichannel-service |

All must exist on the same Postgres server. Creation script: `docs/pgadmin/create-databases.sql` (run once connected to `postgres`).

### 2.2 Connection string pattern

- **External (current):**  
  `postgres://postgres:<PASSWORD>@<HOST>:5432/<DATABASE_NAME>`
- **If using Coolify Postgres (internal):**  
  `postgresql://gaqno:<POSTGRES_PASSWORD>@postgres:5432/<DATABASE_NAME>`

Replace `<DATABASE_NAME>` with one of: `gaqno_sso_db`, `gaqno_finance_db`, `gaqno_pdv_db`, `gaqno_rpg_db`, `gaqno_ai_db`, `gaqno_omnichannel_db`.

### 2.3 Application env vars (Coolify)

| Application               | Env var                                  | Expected value                      |
| ------------------------- | ---------------------------------------- | ----------------------------------- |
| gaqno-sso-service         | `DATABASE_URL`                           | `...@<HOST>:5432/gaqno_sso_db`         |
| gaqno-finance-service     | `DATABASE_URL` or `FINANCE_DATABASE_URL` | `...@<HOST>:5432/gaqno_finance_db`     |
| gaqno-pdv-service         | `DATABASE_URL`                           | `...@<HOST>:5432/gaqno_pdv_db`         |
| gaqno-rpg-service         | `DATABASE_URL`                           | `...@<HOST>:5432/gaqno_rpg_db`         |
| gaqno-ai-service          | `DATABASE_URL`                           | `...@<HOST>:5432/gaqno_ai_db`          |
| gaqno-omnichannel-service | `DATABASE_URL`                           | `...@<HOST>:5432/gaqno_omnichannel_db` |

Use the same host and credentials for all; only the database name changes.

### 2.4 Security

- [ ] Port 5432 **not** exposed publicly (internal/Coolify network only or VPN).
- [ ] Strong `POSTGRES_PASSWORD` / URL password; use Coolify Secrets, not plain env in repo.
- [ ] pgAdmin `servers.json` does **not** store passwords (current setup is correct).

### 2.5 pgAdmin alignment

- **File:** `docs/pgadmin/servers.json`
- **Servers 1–6:** Host `kwokwsos8o8w44kk0os0g0s0`, Port 5432, Username `postgres`, `MaintenanceDB` = same as table above per server.
- **Server 7:** Local dev – Host `localhost`, Username `gaqno`, `MaintenanceDB` `gaqno_sso_db`.

If you change the production host or user, update `servers.json` and re-import in pgAdmin (or redeploy with `PGADMIN_SERVER_JSON_FILE`).

---

## 3. Checklist: “Postgres-Gaqno properly configured”

Use this to certify the current or new Postgres instance.

- [ ] **Databases exist:** All 6 databases from §2.1 exist (run `create-databases.sql` if needed).
- [ ] **SSO schema:** `gaqno_sso_db` has schema applied (e.g. `gaqno-sso-service` deploy or `push-db.js`).
- [ ] **SSO seed:** Tenant, permissions, SUPER_ADMIN, and super user exist (run `gaqno-sso-service/scripts/seed-production.sql` if needed).
- [ ] **Apps point to correct DB:** Each backend has `DATABASE_URL` (or `FINANCE_DATABASE_URL`) to the right database name (§2.3).
- [ ] **Network:** Only trusted networks can reach Postgres (no public 5432).
- [ ] **Credentials:** Passwords in Coolify Secrets or secure storage; not in repo or `servers.json`.
- [ ] **pgAdmin:** `docs/pgadmin/servers.json` matches actual host/port/user and DB names; passwords entered at first connect.

---

## 4. postgresql-gaqno in Coolify (existing)

**postgresql-gaqno** exists in Coolify. Ensure:

- **Image:** e.g. `postgres:16-alpine`; persistent volume enabled; port 5432 **not** exposed publicly.
- **Env:** `POSTGRES_USER` (e.g. `gaqno` or `postgres`), `POSTGRES_PASSWORD` (Coolify Secret), `POSTGRES_DB=gaqno_sso_db` (default).
- **Init:** Run `docs/pgadmin/create-databases.sql` once (connect to `postgres` DB) to create `gaqno_sso_db`, `gaqno_ai_db`, `gaqno_finance_db`, `gaqno_pdv_db`, `gaqno_rpg_db`, `gaqno_omnichannel_db`.
- **Apps:** Each backend’s `DATABASE_URL` uses the Coolify internal hostname for postgresql-gaqno and the correct database name (§2.3).
- **pgAdmin:** `docs/pgadmin/servers.json` host = internal hostname or public proxy host for postgresql-gaqno; re-import after changes.

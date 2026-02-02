# pgAdmin: create all servers at once

pgAdmin can load server definitions from a JSON file so you don’t add them manually.

## Option A: Import in pgAdmin (one-time)

1. Open **https://pgadmin.gaqno.com.br** and log in.
2. **Tools** → **Import/Export Servers…**
3. **Import** tab → **Filename**: choose `docs/pgadmin/servers.json` from this repo.
4. Optionally check **Remove all the existing servers?** if you want this file to replace current servers.
5. **Next** → select the server(s) to import → **Finish**.
6. First time you connect to **gaqno_sso (Production)**, pgAdmin will ask for the **password** (from your Postgres `DATABASE_URL` in Coolify). You can check “Save password” so you don’t re-enter it.

Passwords are not stored in the JSON for security.

---

## Creating app databases (one-time)

Each server in `servers.json` uses a dedicated database (gaqno_sso, gaqno_ai, gaqno_finance, etc.). If you see **FATAL: database "gaqno_xxx" does not exist** when connecting:

**Option A – pgAdmin:** `CREATE DATABASE` cannot run inside a transaction block. Connect to database **postgres**, open Query Tool, and run **each line** of `create-databases.sql` separately (do not run the whole script with F5).

**Option B – shell:** From the repo root, run:
`DATABASE_URL='postgres://user:pass@host:5432/postgres' ./docs/pgadmin/create-databases.sh`
(requires `psql`; each database is created in its own connection.)

Then retry connecting to the other servers in pgAdmin.

---

## Option B: Coolify – load servers on every startup

So that pgAdmin always shows the same servers (e.g. after a new deploy), you can mount the JSON and tell pgAdmin to replace servers on startup.

1. **Add the JSON to Coolify**  
   Copy `docs/pgadmin/servers.json` to a path the Coolify server can read (e.g. upload or clone this repo on the server), or build it into a small image that mounts the file.

2. **Configure the pgAdmin service** (pgadmin-gaqno) in Coolify:
   - **Storage / Volumes**: mount the host path that contains `servers.json` into the container, e.g.  
     `/path/on/host/docs/pgadmin/servers.json` → `/pgadmin4/servers.json`
   - **Environment variables**:
     - `PGADMIN_SERVER_JSON_FILE` = `/pgadmin4/servers.json`
     - `PGADMIN_REPLACE_SERVERS_ON_STARTUP` = `True`

3. **Redeploy** the pgAdmin service.

On each startup, pgAdmin will replace its server list with the one from `servers.json`. You still need to enter (and optionally save) the Postgres password the first time you connect to each server.

---

## Adding more servers

Edit `servers.json`. The format is:

```json
{
  "Servers": {
    "1": {
      "Name": "Display name",
      "Group": "Group name",
      "Host": "hostname.or.ip",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "postgres",
      "ConnectionParameters": { "sslmode": "prefer", "connect_timeout": 10 }
    },
    "2": { ... }
  }
}
```

Use a different numeric key for each server (`"1"`, `"2"`, …). Required: `Name`, `Group`, `Host`, `Port`, `Username`, `MaintenanceDB`, and in `ConnectionParameters` at least `sslmode`.  
Then either re-import in pgAdmin (Option A) or redeploy with the updated file (Option B).

# Dokploy: monitoring stack from Git (replace raw compose)

Today the `monitoring-stack` compose in Dokploy can be **`sourceType: raw`** (YAML stored only in Dokploy). This guide switches it to **GitHub** + `monitoring/docker-compose.dokploy.yml` from `gaqno-development/gaqno-development-workspace` so the stack matches the repo and secrets live in Dokploy **Environment**, not inside YAML.

## 1. Copy environment values

In Dokploy, open the current **monitoring-stack** compose and note any literals (tunnel token, Grafana admin, Cloudflare token, Postgres exporter DSN, etc.). You will re-enter them as **variables** in step 4 — do **not** commit them to Git.

## 2. Point the compose at GitHub

In Dokploy → project **gaqno-production** → **Compose** → **monitoring-stack** → **Source** (or equivalent):

| Field | Value |
|--------|--------|
| Provider | GitHub (same app used by other services) |
| Owner | `gaqno-development` |
| Repository | `gaqno-development-workspace` |
| Branch | `main` |
| Compose path | `monitoring/docker-compose.dokploy.yml` |
| Submodules | Off (not required for `monitoring/`) |

Save. Dokploy should clone the repo and use that file as the compose definition.

## 3. Build context

The compose builds Grafana from `monitoring/grafana/`. Dokploy must run `docker compose` with the **repository root** as working directory and `-f monitoring/docker-compose.dokploy.yml`. If the UI offers “build directory” or “root directory”, set it to the **repo root** (not only `monitoring/`), so `build.context: ./grafana` resolves to `monitoring/grafana`.

## 4. Environment variables (required)

Set these on the **compose** resource (Dokploy injects them into `docker compose` — no `.env` file in Git):

| Variable | Purpose |
|----------|---------|
| `CLOUDFLARE_TUNNEL_TOKEN` | cloudflared connector token |
| `CLOUDFLARE_API_TOKEN` | Grafana Infinity / Cloudflare API |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone for DNS dashboards |
| `CLOUDFLARED_EDGE_NETWORK` | Optional; default `dokploy-network` |
| `POSTGRES_EXPORTER_URI` | e.g. `postgres-service-name:5432/dbname?sslmode=disable` |
| `POSTGRES_EXPORTER_USER` | DB user |
| `POSTGRES_EXPORTER_PASS` | DB password |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password (required; no default in compose) |
| `GRAFANA_ADMIN_USER` | Optional; default `admin` |
| `GRAFANA_ROOT_URL` | Public Grafana URL, e.g. `https://grafana.gaqno.com.br` |

See `monitoring/.env.example` for a template.

## 5. Network

The compose expects an **external** Docker network named like `dokploy-network` (see `CLOUDFLARED_EDGE_NETWORK`). That must exist on the Dokploy server so **cloudflared** can join `dokploy-edge` and reach Traefik.

## 6. Deploy

Redeploy the stack. First build may take longer (Grafana image build). Fix any errors from **Deploy logs** (missing env, wrong compose path, network name).

## 7. Rotate secrets

If the previous **raw** compose embedded tokens or passwords in YAML, **rotate** those credentials after migration (they were effectively in Dokploy’s database).

## 8. Optional: `cleanup-monitoring`

Keep as a separate compose or run once manually; it does not need the Git repo.

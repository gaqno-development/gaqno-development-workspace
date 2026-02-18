# gaqno-lead-enrichment-service

Kafka consumer that enriches leads via Pipedrive API (person search by phone) with JIT OAuth token refresh.

## Environment variables

- `DATABASE_URL` – PostgreSQL connection string (table `lead_pipedrive_integrations`).
- `KAFKA_BROKERS` – Comma-separated broker list (e.g. `localhost:9092`).
- `PIPEDRIVE_CLIENT_ID` – Pipedrive OAuth app client ID (runtime only, never in code).
- `PIPEDRIVE_CLIENT_SECRET` – Pipedrive OAuth app client secret (runtime only, never in code).
- `PORT` – HTTP server port (default `4010`).

## Coolify

The app **gaqno-lead-enrichment-service** was created in Coolify via MCP:

- **UUID**: `xc4c0skcc4kg8408sgg8gswc`
- **Domain**: http://xc4c0skcc4kg8408sgg8gswc.gaqno.com.br
- **Repo**: `gaqno-development/gaqno-development-workspace` (monorepo), branch `main`
- **Env vars** `PIPEDRIVE_CLIENT_ID` and `PIPEDRIVE_CLIENT_SECRET` were set via MCP.

**Build (monorepo):** In Coolify, set **Base directory** to `gaqno-lead-enrichment-service`. O build usa o **Dockerfile** normal deste microserviço (`gaqno-lead-enrichment-service/Dockerfile`).

**Deploy:** MCP `deploy` with `tag_or_uuid`: `xc4c0skcc4kg8408sgg8gswc`.

**Logs:** MCP `application_logs` with the same UUID. Add `KAFKA_BROKERS` and `DATABASE_URL` in Coolify if not set.

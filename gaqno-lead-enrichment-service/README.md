# gaqno-lead-enrichment-service

Kafka consumer that enriches leads via Pipedrive API (person search by phone) with JIT OAuth token refresh.

## Environment variables

- `DATABASE_URL` – PostgreSQL connection string (table `lead_pipedrive_integrations`).
- `KAFKA_BROKERS` – Comma-separated broker list (e.g. `localhost:9092`).
- `PIPEDRIVE_CLIENT_ID` – Pipedrive OAuth app client ID (runtime only, never in code).
- `PIPEDRIVE_CLIENT_SECRET` – Pipedrive OAuth app client secret (runtime only, never in code).
- `PORT` – HTTP server port (default `4010`).

## Coolify (Passo 5)

After the application **gaqno-lead-enrichment-service** exists in Coolify:

1. **List app UUID** (if needed):
   - MCP: `list_applications` and find the entry for `gaqno-lead-enrichment-service`; note its `uuid`.

2. **Set env vars** (MCP `env_vars`, resource `application`, action `create`):
   - `PIPEDRIVE_CLIENT_ID` = your Pipedrive client ID
   - `PIPEDRIVE_CLIENT_SECRET` = your Pipedrive client secret (prefer a rotated secret after any exposure)
   - `KAFKA_BROKERS` and `DATABASE_URL` if not already set

3. **Deploy**: MCP `deploy` with `tag_or_uuid` = the application UUID.

4. **Check logs**: MCP `application_logs` to confirm Kafka connection and subscription to `omnichannel.message.received`.

If the app is not yet in Coolify, create it first (same project/server as other gaqno-*-service apps), then run the steps above.

# Gaqno monitoring (Prometheus + Grafana)

## Dashboards

- **Gaqno — Errors by Service**: target health (up/down), scrape duration, and (when services expose metrics) HTTP 4xx/5xx rate per service.
- **Gaqno — Errors by Frontend**: same for frontend apps (shell, sso, ai, crm, erp, finance, pdv, rpg, omnichannel, wellness).

## Using with docker-compose (this repo)

From the workspace root:

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Grafana is at http://localhost:5678. Dashboards and the Prometheus datasource are provisioned automatically.

## Using with Coolify

If Grafana runs in Coolify (not from this compose):

1. In Grafana, add a **Prometheus** datasource pointing to your Prometheus URL (e.g. `http://prometheus:9090` if on the same Docker network).
2. **Import** the dashboards:
   - Go to **Dashboards** → **New** → **Import**.
   - Upload or paste the JSON from:
     - `monitoring/grafana/dashboards/gaqno-errors-by-service.json`
     - `monitoring/grafana/dashboards/gaqno-errors-by-frontend.json`
   - Select the Prometheus datasource and import.

## Getting HTTP error metrics (4xx/5xx) per service/frontend

The 4xx/5xx panels only show data when applications expose Prometheus metrics. To enable:

1. In each NestJS service, add `@willsoto/nestjs-prometheus` (or similar) and expose a `/metrics` endpoint with `http_requests_total` (and optionally `http_request_duration_seconds`).
2. In Prometheus, add a scrape job per service/frontend, e.g.:

```yaml
scrape_configs:
  - job_name: sso-service
    static_configs:
      - targets: ['sso-service:4001']
    metrics_path: /metrics
  # repeat for pdv-service, ai-service, finance-service, rpg-service, omnichannel-service, wellness-service
  # and for frontends (shell:3000, sso:3001, ai:3002, ...) if they expose /metrics
```

After that, the “HTTP 5xx error rate by service” and “HTTP 4xx error rate by frontend” panels will populate.

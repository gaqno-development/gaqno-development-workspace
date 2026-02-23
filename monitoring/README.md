# Gaqno monitoring (Prometheus + Grafana)

## Dashboards

Three **exclusive** dashboards (use the Overview to jump between them):

| Dashboard | Audience | Content |
|-----------|----------|--------|
| **Gaqno — Front** | Frontend | **Saúde:** Error rate %, LCP P75, API P95, usuários ativos, sessões com erro %. **Performance:** Core Web Vitals (placeholder), latência API, bundle (placeholder). **Erros:** 4xx/5xx por app, erros JS/por browser (placeholder), 5xx backend. **Negócio:** conversão, checkout, funil (placeholders). Dados atuais: Prometheus (4xx/5xx). LCP, RUM e negócio exigem Sentry/OpenTelemetry/analytics. |
| **Gaqno — Backend** | Backend | **Saúde:** Error rate %, Latência P95, RPS, CPU/Mem (containers). **Latência:** por serviço (P50/P95), por endpoint/versão (placeholders). **Erros:** 5xx por serviço, Exceptions (placeholder), Top serviços com erro. **Banco:** Longest running tx, Conexões por database, Replication lag (postgres_exporter). **Infra:** Pods, Restart, HPA (placeholders K8s), CPU/Mem por container (cAdvisor), RPS por serviço. |
| **Gaqno — DevOps** | Ops / Infra | **DORA:** Deployment frequency, Lead time, Change failure rate, MTTR (placeholders). **CI/CD:** Sucesso pipeline, Tempo build/deploy, Qualidade (placeholders). **Infra:** Targets down/up, Host CPU/Mem, Load, Pods restart (placeholder K8s), Prometheus samples, Scrape targets/duration, Containers CPU/Mem (cAdvisor). **Segurança:** Vulnerabilidades, Certificados, Secrets (placeholders). **Custo:** Gasto por ambiente/namespace (placeholders). |

**Gaqno — Overview**: entry point with links to Front, Backend, DevOps.

## Using with docker-compose (this repo)

From the workspace root:

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Grafana is at http://localhost:5678. Dashboards and the Prometheus datasource are provisioned automatically. The stack includes **node-exporter** (host CPU, memory, load), **cAdvisor** (per-container CPU and memory), and **postgres-exporter** (Postgres metrics). Ensure Prometheus can reach `node-exporter:9100`, `cadvisor:8080`, and `postgres-exporter:9187`.

### postgres_exporter

The compose runs one **postgres-exporter** instance. Set these env vars so it can connect to your Postgres (override in `.env` or the shell):

- `POSTGRES_EXPORTER_URI` — default `localhost:5432/postgres?sslmode=disable` (host:port/database). Use the hostname of your Postgres (e.g. `postgres:5432` if Postgres is in the same Docker network).
- `POSTGRES_EXPORTER_USER` — Postgres user (default `postgres`).
- `POSTGRES_EXPORTER_PASS` — Postgres password.

For multiple Postgres instances (e.g. one per service), run one exporter per instance and add a scrape job per target in `monitoring/prometheus.yml`.

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

1. In each NestJS service, expose a `/metrics` endpoint with `http_requests_total` and `http_request_duration_seconds` (e.g. **gaqno-sso-service** uses `prom-client` and exposes `GET /v1/metrics`; see `gaqno-sso-service/src/metrics/`).
2. In Prometheus, add a scrape job per service/frontend, e.g.:

```yaml
scrape_configs:
  - job_name: sso-service
    static_configs:
      - targets: ['host.docker.internal:4001']   # or sso-service:4001 if on same network
    metrics_path: /v1/metrics
  # repeat for other *-service (pdv, ai, finance, rpg, omnichannel, wellness)
  # and for frontends if they expose /metrics
```

After that, the “HTTP 5xx error rate by service” and “HTTP 4xx error rate by frontend” panels will populate.

## Front dashboard: métricas avançadas (LCP, RUM, negócio)

O **Gaqno — Front** segue o layout: **Linha 1 — Saúde geral** (Error rate %, LCP P75, API P95, Usuários ativos, Sessões com erro %), **Linha 2 — Performance** (Core Web Vitals, latência API, bundle), **Linha 3 — Erros** (4xx/5xx por app, top erros JS, 5xx backend), **Linha 4 — Negócio** (conversão, checkout, funil). Hoje só 4xx/5xx e 5xx backend vêm do Prometheus; o resto são placeholders.

Para preencher os placeholders:

| Métrica | Fonte sugerida |
|--------|-----------------|
| **LCP P75, CLS, INP** | RUM: Sentry, OpenTelemetry browser, Datadog RUM → exportar para Prometheus ou usar data source Sentry/Datadog no Grafana |
| **API latência P95** | Expor `http_request_duration_seconds` (histogram) no `/metrics` dos *-ui ou *-service e dar scrape no Prometheus |
| **Usuários ativos (DAU/MAU)** | Analytics (GA, PostHog, Mixpanel) ou backend de sessões → Prometheus/Loki |
| **Sessões com erro %** | RUM contando sessões com ≥1 erro / total de sessões |
| **Top erros JS / por navegador** | Sentry (data source Grafana) ou Loki com logs de erro |
| **Conversão, checkout, funil** | Analytics ou eventos no backend exportados para Grafana |
| **Bundle size / tempo download** | Build metrics (Webpack/Vite) ou RUM resource timing → Prometheus/Loki |

Métricas mais importantes para começar: **Error rate %**, **LCP P75**, **API latência P95**, **Sessões com erro %**, **Conversão principal**.

## Backend dashboard: Golden Signals + Banco + Infra

O **Gaqno — Backend** segue o modelo SRE: **Linha 1 — Saúde geral** (Error rate %, Latência P95, RPS, CPU e Memória dos containers), **Linha 2 — Latência detalhada** (por serviço P50/P95, placeholders para por endpoint e por versão), **Linha 3 — Erros** (5xx por serviço, Exceptions placeholder, Top serviços com erro), **Linha 4 — Banco** (Longest running tx, Conexões por database, Replication lag — dados do **postgres_exporter**), **Linha 5 — Infra** (Pods, Restart, HPA — placeholders para K8s; CPU/Mem por container e RPS por serviço com cAdvisor e Prometheus).

Regra prática: **5xx > 1%** já é alerta.

Para preencher os placeholders:

| Métrica | Fonte sugerida |
|--------|-----------------|
| **Latência P50/P95 por endpoint** | Histogram `http_request_duration_seconds` com label `path` ou `route` (ex.: NestJS Prometheus) |
| **Latência por versão** | Label `version` no histogram ou em `http_requests_total` |
| **Exceptions por tipo** | Métricas de exceção no app (exception filter → Prometheus) ou Loki |
| **Slow queries, Conexões, Replication lag** | postgres_exporter (já no compose; configurar `POSTGRES_EXPORTER_*`); ou métricas do pool no app (`db_pool_*` em gaqno-sso-service) |
| **Pods, Restarts, HPA** | Kubernetes + kube-state-metrics (kube_pod_*, horizontalpodautoscaler_status_*) |

## DevOps dashboard: DORA + CI/CD + Infra + Segurança + Custo

O **Gaqno — DevOps** segue o layout: **Linha 1 — DORA** (Deployment frequency, Lead time, Change failure rate, MTTR), **Linha 2 — CI/CD** (Sucesso pipeline, Tempo build, Tempo deploy, Qualidade), **Linha 3 — Infra** (Targets, Host CPU/Mem, Load, Pods restart, Scrape, Containers CPU/Mem), **Linha 4 — Segurança** (Vulnerabilidades, Certificados, Secrets), **Linha 5 — Custo** (Gasto por ambiente, por namespace/serviço).

Para preencher os placeholders:

| Métrica | Fonte sugerida |
|--------|-----------------|
| **DORA (deploy freq, lead time, CFR, MTTR)** | API do pipeline (GitHub Actions, Coolify, Argo CD), Sleuth/LinearB, ou métricas custom → Prometheus |
| **CI/CD (sucesso, tempo build/deploy)** | prometheus-github-actions-exporter, GitLab CI API, Jenkins metrics |
| **Pods restart / Nodes** | Kubernetes + kube-state-metrics |
| **Vulnerabilidades** | Trivy, Snyk, Dependabot → relatórios ou Prometheus |
| **Certificados** | cert-exporter, Blackbox probe (expiry) |
| **Custo** | Kubecost (K8s), cloud billing (AWS/GCP), Infracost → Grafana |

### Implementar DORA e CI/CD

Para preencher os painéis DORA e CI/CD no dashboard DevOps:

1. **Criar token** com escopo de leitura para workflows/deployments (GitHub) ou equivalente no Coolify/Argo CD.
2. **Escolher fonte**: exporter que preenche Prometheus (ex.: prometheus-github-actions-exporter) ou data source do Grafana (ex.: GitHub).
3. **Configurar** o Prometheus para scrape o exporter ou adicionar o data source no Grafana e apontar os painéis da Linha 1 (DORA) e Linha 2 (CI/CD) para as métricas corretas.


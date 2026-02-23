# Gaqno monitoring (Prometheus + Grafana)

## Dashboards

Three **exclusive** dashboards (use the Overview to jump between them):

| Dashboard | Audience | Content |
|-----------|----------|--------|
| **Gaqno — Front** | Frontend | **Saúde:** Error rate %, LCP P75, API P95, usuários ativos, sessões com erro %. **Performance:** Core Web Vitals (placeholder), latência API, **bundle size (Vite, CI → Pushgateway)**. **Erros:** 4xx/5xx por app, erros JS/por browser (placeholder), 5xx backend. **Negócio:** conversão, checkout, funil (placeholders). Dados atuais: Prometheus (4xx/5xx). LCP, RUM e negócio exigem Sentry/OpenTelemetry/analytics. |
| **Gaqno — Backend** | Backend | **Saúde:** Error rate %, Latência P95, RPS, CPU/Mem (containers). **Latência:** por serviço (P50/P95), por endpoint/versão (placeholders). **Erros:** 5xx por serviço, Exceptions (placeholder), Top serviços com erro. **Banco:** Longest running tx, Conexões por database, Replication lag (postgres_exporter). **Infra:** Pods, Restart, HPA (placeholders K8s), CPU/Mem por container (cAdvisor), RPS por serviço. |
| **Gaqno — DevOps** | Ops / Infra | **DORA:** Deployment frequency, Lead time, Change failure rate, MTTR (placeholders). **CI/CD:** Sucesso pipeline, Tempo build/deploy, Qualidade (placeholders). **Infra:** Targets down/up, Host CPU/Mem, Load, Prometheus samples, Scrape targets/duration, Containers CPU/Mem (cAdvisor). **Cloudflare Tunnel:** requests/s, errors/s, active streams (requer cloudflared --metrics). **Segurança:** Vulnerabilidades, Certificados, Secrets (placeholders). **Custo:** Gasto por ambiente/namespace (placeholders). |

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

**Usando o Coolify MCP**: você pode obter `DATABASE_URL` no Coolify (MCP `env_vars`, aplicação `gaqno-sso-service`) e gerar `.env.monitoring` com:

```bash
DATABASE_URL='postgresql://...' node scripts/configure-postgres-exporter-env.mjs
# ou: node scripts/configure-postgres-exporter-env.mjs 'postgresql://...'
```

Depois: `docker compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d`. O arquivo `.env.monitoring` está no `.gitignore`.

For multiple Postgres instances (e.g. one per service), run one exporter per instance and add a scrape job per target in `monitoring/prometheus.yml`.

## Using with Coolify

O serviço **gaqno-grafana** no Coolify já está configurado com:

- **node-exporter**, **prometheus**, **postgres-exporter** e **grafana**
- Variáveis de ambiente no recurso: `POSTGRES_EXPORTER_URI`, `POSTGRES_EXPORTER_USER`, `POSTGRES_EXPORTER_PASS` (para o Postgres do SSO; obtidas via Coolify MCP a partir da aplicação gaqno-sso-service)
- Prometheus faz scrape de: prometheus, node-exporter e postgres-exporter

O compose usado no Coolify está em `monitoring/docker-compose.coolify.yml`. Inclui **cloudflared** (Cloudflare Tunnel): o container sobe com `--metrics 0.0.0.0:60123` e o Prometheus faz scrape em `cloudflared:60123`. Configure no Coolify a variável **`CLOUDFLARE_TUNNEL_TOKEN`** (token do connector em Cloudflare Zero Trust → Tunnels → Run connector).

**Grafana** está em **http://grafana.gaqno.com.br** (porta 5678). O compose do Coolify provisiona o **datasource Prometheus** via variáveis de ambiente (`GF_DATASOURCES_DEFAULT_*`) apontando para `http://prometheus:9090`. Os dashboards precisam ser importados manualmente:

1. **Importe** os dashboards: **Dashboards** → **New** → **Import** e faça upload dos JSON em `monitoring/grafana/dashboards/`:
   - **Gaqno — Backend**: `gaqno-dashboard-backend.json`
   - **Gaqno — Front**: `gaqno-dashboard-front.json`
   - **Gaqno — DevOps**: `gaqno-dashboard-devops.json` (inclui Deployment frequency e Lead time com dados do GitHub Actions + Pushgateway)
   - Overview/erros: `gaqno-errors-by-service.json`, `gaqno-errors-by-frontend.json`

Para **atualizar** um dashboard já importado: use **Import** de novo com o mesmo JSON e escolha **Overwrite**. Assim você passa a ter as últimas alterações do repositório (ex.: painéis DORA reais, correções de PromQL nos Targets down/up).

## Troubleshooting: no data on dashboards

Se **todos** os painéis mostram "No data":

1. **Datasource Prometheus**  
   Em Grafana: **Connections** → **Data sources**. Deve existir um **Prometheus** com URL **`http://prometheus:9090`** e **Save & test** em verde. Se não existir ou estiver com URL errada (ex.: localhost), adicione ou edite para `http://prometheus:9090` (nome do serviço na rede Docker).

2. **Prometheus está coletando**  
   Abra **http://&lt;seu-prometheus&gt;:9090/targets** (ou o URL do Prometheus que o Coolify expõe). Verifique se os targets **node-exporter**, **prometheus**, **postgres-exporter** estão **UP**. Se estiverem Down, o Grafana não terá métricas (rede, container parado ou scrape config incorreta).

3. **Intervalo de tempo**  
   No canto superior direito do Grafana, use **Last 15 minutes** ou **Last 1 hour**; "No data" pode ser intervalo no passado sem métricas.

4. **Coolify: datasource automático**  
   O `docker-compose.coolify.yml` define variáveis `GF_DATASOURCES_DEFAULT_*` para criar o Prometheus ao subir o Grafana. Após alterar o compose, faça **Redeploy** do serviço gaqno-grafana para o Grafana recarregar e criar o datasource.

Alguns painéis (ex.: DORA, Bundle size, Cloudflare Tunnel) só terão dados quando houver deploys no CI, builds com Pushgateway ou o tunnel ativo; o resto (CPU, memória, targets) depende só do Prometheus e dos exporters.

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
| **Bundle size** | **Implementado:** todos os *-ui usam Vite; no CI, após `turbo run build`, o script `scripts/push-bundle-size-metrics.mjs` envia `frontend_bundle_size_bytes{app}` para o Pushgateway (requer `PROMETHEUS_PUSHGATEWAY_URL`). Painel **Bundle size (Vite total)** no dashboard Front. Tempo de download: RUM (resource timing) → Prometheus/Loki. |

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

O **Gaqno — DevOps** segue o layout: **Linha 1 — DORA** (Deployment frequency, Lead time, Change failure rate, MTTR), **Linha 2 — CI/CD** (Sucesso pipeline, Tempo build, Tempo deploy, Qualidade), **Linha 3 — Infra** (Targets, Host CPU/Mem, Load, Scrape, Containers CPU/Mem), **Cloudflare Tunnel** (requests/s, errors/s, active streams), **Linha 4 — Segurança** (Vulnerabilidades, Certificados, Secrets), **Linha 5 — Custo** (Gasto por ambiente, por namespace/serviço).

### Cloudflare Tunnel (cloudflared)

Para ver os painéis **Tunnel requests/s**, **Tunnel errors/s** e **Tunnel active streams** no dashboard DevOps:

1. No host onde o `cloudflared` roda, inicie o tunnel com métricas: `cloudflared tunnel --metrics <host>:60123 run <tunnel-name>`. Use `0.0.0.0:60123` se o Prometheus estiver em outra máquina/rede. Ver [Monitor Cloudflare Tunnel with Grafana](https://developers.cloudflare.com/cloudflare-one/tutorials/grafana/) e [Tunnel metrics](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/monitor-tunnels/metrics/).
2. No `monitoring/prometheus.yml` (e no compose do Coolify, se usar), descomente o job `cloudflared` e defina `targets` com o host e porta do endpoint de métricas (ex.: `host.docker.internal:60123` ou o IP do servidor cloudflared).
3. Reinicie o Prometheus e reimporte o dashboard DevOps para ver a seção **Cloudflare Tunnel**.

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

**Deployment frequency e Lead time (implementados)**  
O workflow **CD** (.github/workflows/cd.yml) envia métricas para um **Pushgateway** após cada deploy bem-sucedido:

- **Deployment frequency**: número de runs do workflow CD com sucesso nas últimas 24h e 7 dias (via API do GitHub).
- **Lead time**: tempo entre o commit e o fim do job de CD (commit → deploy).

O stack de monitoramento inclui o serviço **pushgateway** (porta 9091). O Prometheus faz scrape do Pushgateway; os painéis **Deployment frequency (7d)** e **Lead time (commit → deploy)** no dashboard DevOps usam as métricas `cicd_deployments_last_7d` e `cicd_deployment_lead_time_seconds`.

Para as métricas serem enviadas a partir do GitHub Actions:

1. Expor o Pushgateway (ex.: `https://pushgateway.gaqno.com.br` ou URL interna acessível pelos runners).
2. Em **Settings → Secrets and variables → Actions** do repositório, criar o secret **`PROMETHEUS_PUSHGATEWAY_URL`** com a URL base do Pushgateway (ex.: `https://pushgateway.gaqno.com.br`). O job de CD faz `POST $PROMETHEUS_PUSHGATEWAY_URL/metrics/job/cd/instance/github_actions`. Se o secret não estiver definido, o passo é ignorado.

Demais placeholders DORA/CI/CD:

1. **Criar token** com escopo de leitura para workflows/deployments (GitHub) ou equivalente no Coolify/Argo CD.
2. **Escolher fonte**: exporter que preenche Prometheus (ex.: prometheus-github-actions-exporter) ou data source do Grafana (ex.: GitHub).
3. **Configurar** o Prometheus para scrape o exporter ou adicionar o data source no Grafana e apontar os painéis da Linha 1 (DORA) e Linha 2 (CI/CD) para as métricas corretas.


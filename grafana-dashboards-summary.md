# Grafana Dashboards — Complete Panel Summary

**Source:** `http://72.61.221.19:5678` (Basic auth admin:gaqno2026)

---

## 1. gaqno-dashboard-front (Gaqno — Front)

**UID:** `gaqno-dashboard-front`  
**Title:** Gaqno — Front  
**Refresh:** 10s  
**Time range:** now-1h to now  
**Dashboard variables:** None  

### Panels

| # | Title | Type | Datasource | Targets |
|---|-------|------|------------|---------|
| 1 | *(empty)* | text | — | Markdown: **Front** — Containers de frontend (gaqno-*-ui). Most accessed por tráfego de rede (cAdvisor). CPU e memória por app. |
| 2 | **Most accessed frontends (by traffic)** | bargauge | prometheus | **expr:** `topk(10, sum by (component) ((label_replace(rate(container_network_receive_bytes_total{id=~"/system.slice/docker.*"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") or label_replace(rate(container_network_receive_bytes_total{id=~"/docker/.*"}[5m]),"container_id","$1","id","/docker/(.*)")) * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}) + sum by (component) ((label_replace(rate(container_network_transmit_bytes_total{id=~"/system.slice/docker.*"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") or label_replace(rate(container_network_transmit_bytes_total{id=~"/docker/.*"}[5m]),"container_id","$1","id","/docker/(.*)")) * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}))` **legendFormat:** `{{component}}` |
| 3 | **Frontend containers** | stat | prometheus | **expr:** `count(container_info{component=~"gaqno-.*-ui"})` **legendFormat:** `Containers` |
| 4 | **Top CPU consumers (frontend)** | bargauge | prometheus | **expr:** `topk(10, sum by (component) (label_replace(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*",cpu="total"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}) * 100)` **legendFormat:** `{{component}}` |
| 5 | **CPU % per frontend** | timeseries | prometheus | **expr:** `sum by (component) (label_replace(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*",cpu="total"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}) * 100` **legendFormat:** `{{component}}` |
| 6 | **Total CPU % (frontend)** | stat | prometheus | **expr:** `sum(sum by (component) (label_replace(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*",cpu="total"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}) * 100))` **legendFormat:** `CPU %` |
| 7 | **Total memory (frontend)** | stat | prometheus | **expr:** `sum(sum by (component) (label_replace(container_memory_usage_bytes{id=~"/system.slice/docker.*"},"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}))` **legendFormat:** `Memory` |
| 8 | **Top memory consumers (frontend)** | bargauge | prometheus | **expr:** `topk(10, sum by (component) (label_replace(container_memory_usage_bytes{id=~"/system.slice/docker.*"},"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}))` **legendFormat:** `{{component}}` |
| 9 | **Memory per frontend** | timeseries | prometheus | **expr:** `sum by (component) (label_replace(container_memory_usage_bytes{id=~"/system.slice/docker.*"},"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-ui"}))` **legendFormat:** `{{component}}` |

---

## 2. gaqno-dashboard-backend (Gaqno — Backend)

**UID:** `gaqno-dashboard-backend`  
**Title:** Gaqno — Backend  
**Refresh:** 10s  
**Time range:** now-1h to now  
**Dashboard variables:**  
- `zone_id` (constant, value: `d628a8ac60069acccbc154d173b88717`, hidden)  

### Panels

| # | Title | Type | Datasource | Targets |
|---|-------|------|------------|---------|
| 1 | **Backend containers** | stat | prometheus | **expr:** `count(container_info{component=~"gaqno-.*-service"})` **legendFormat:** `Containers` |
| 2 | **Top CPU consumers (backend)** | bargauge | prometheus | **expr:** `topk(10, sum by (component) (label_replace(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*",cpu="total"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-service"}) * 100)` **legendFormat:** `{{component}}` |
| 3 | **CPU % per service** | timeseries | prometheus | **expr:** `sum by (component) (label_replace(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*",cpu="total"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-service"}) * 100)` **legendFormat:** `{{component}}` |
| 4 | **Total memory (backend)** | stat | prometheus | **expr:** `sum(sum by (component) (label_replace(container_memory_usage_bytes{id=~"/system.slice/docker.*"},"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-service"}))` **legendFormat:** `Memory` |
| 5 | **Total CPU % (backend)** | stat | prometheus | **expr:** `sum(sum by (component) (label_replace(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*",cpu="total"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-service"}) * 100))` **legendFormat:** `CPU %` |
| 6 | **Top memory consumers (backend)** | bargauge | prometheus | **expr:** `topk(10, sum by (component) (label_replace(container_memory_usage_bytes{id=~"/system.slice/docker.*"},"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-service"}))` **legendFormat:** `{{component}}` |
| 7 | **Memory per service** | timeseries | prometheus | **expr:** `sum by (component) (label_replace(container_memory_usage_bytes{id=~"/system.slice/docker.*"},"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component=~"gaqno-.*-service"}))` **legendFormat:** `{{component}}` |
| 8 | **Locks count** | timeseries | prometheus | **expr:** `pg_locks_count{job="postgres-exporter"}` **legendFormat:** `{{mode}}` |
| 9 | **Replication lag (s)** | timeseries | prometheus | **expr:** `pg_replication_lag_seconds{job="postgres-exporter"}` **legendFormat:** `lag` |
| 10 | **Database size** | timeseries | prometheus | **expr:** `pg_database_size_bytes{job="postgres-exporter"}` **legendFormat:** `{{datname}}` |
| 11 | **Conexões por database** | timeseries | prometheus | **expr:** `pg_stat_database_numbackends{job="postgres-exporter"}` **legendFormat:** `{{datname}}` |

---

## 3. gaqno-dashboard-devops (Gaqno — DevOps)

**UID:** `gaqno-dashboard-devops`  
**Title:** Gaqno — DevOps  
**Refresh:** 10s  
**Time range:** now-1h to now  
**Dashboard variables:** None  

### Panels

| # | Title | Type | Datasource | Targets |
|---|-------|------|------------|---------|
| 1 | **Host CPU %** | stat | prometheus | **expr:** `100 * (1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance))` **legendFormat:** `CPU` |
| 2 | **Host CPU %** | timeseries | prometheus | **expr:** `100 * (1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance))` **legendFormat:** `{{instance}}` |
| 3 | **Host Memory %** | timeseries | prometheus | **expr:** `100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))` **legendFormat:** `{{instance}}` |
| 4 | **Containers — CPU % by name (infra only)** | timeseries | prometheus | **expr:** `sum by (component) (label_replace(rate(container_cpu_usage_seconds_total{id=~"/system.slice/docker.*",cpu="total"}[5m]),"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component!~"gaqno-.*-ui\|gaqno-.*-service"}) * 100)` **legendFormat:** `{{component}}` |
| 5 | **Host Memory %** | stat | prometheus | **expr:** `100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))` **legendFormat:** `Mem` |
| 6 | **Scrape duration** | timeseries | prometheus | **expr:** `scrape_duration_seconds` **legendFormat:** `{{job}}` |
| 7 | **Scrape targets (1 = up)** | timeseries | prometheus | **expr:** `up` **legendFormat:** `{{job}}` |
| 8 | **Containers — Memory by name (infra only)** | timeseries | prometheus | **expr:** `sum by (component) (label_replace(container_memory_usage_bytes{id=~"/system.slice/docker.*"},"container_id","$1","id","/system.slice/docker-(.*)\\.scope") * on(container_id) group_left(component) container_info{component!~"gaqno-.*-ui\|gaqno-.*-service"})` **legendFormat:** `{{component}}` |
| 9 | **Targets up** | stat | prometheus | **expr:** `count(up == 1)` **legendFormat:** `Up` |
| 10 | **Prometheus samples (1h)** | stat | prometheus | **expr:** `sum(increase(prometheus_tsdb_head_samples_appended_total[1h]))` **legendFormat:** `Samples` |
| 11 | **Host Load average** | timeseries | prometheus | **expr A:** `node_load1` **legendFormat:** `1m` \| **expr B:** `node_load5` **legendFormat:** `5m` \| **expr C:** `node_load15` **legendFormat:** `15m` |
| 12 | **Targets down** | stat | prometheus | **expr:** `count(up == 0)` **legendFormat:** `Down` |

---

## 4. gaqno-dns-droppage (Gaqno — Saúde DNS)

**UID:** `gaqno-dns-droppage`  
**Title:** Gaqno — Saúde DNS (DevOps, Tunnel, Cloudflare)  
**Refresh:** 30s  
**Time range:** now-24h to now  
**Dashboard variables:**  
- `infinity_datasource` (datasource, yesoreyeram-infinity-datasource, uid: efewzwo46j0n4c)  
- `zone_id` (constant, value: `d628a8ac60069acccbc154d173b88717`)  

### Panels

| # | Title | Type | Datasource | Targets |
|---|-------|------|------------|---------|
| 1 | Saúde DNS — DevOps, Tunnel, Cloudflare | row | — | (row header) |
| 2 | **Códigos DNS e saúde DevOps/Tunnel** | text | — | Markdown explaining NOERROR, SERVFAIL, REFUSED, NXDOMAIN |
| 3 | **Falhas DNS (não-NOERROR)** | stat | yesoreyeram-infinity-datasource (uid: ${infinity_datasource}) | **Type:** graphql **URL:** `https://api.cloudflare.com/client/v4/graphql` **Query:** `query Viewer { viewer { zones(filter: { zoneTag: "${zone_id}" }) { zoneTag dnsAnalyticsAdaptiveGroups(filter: { datetimeMinute_geq: "${__from:date:YYYY-MM-DDTHH:mm:ssZ}", datetimeMinute_leq: "${__to:date:YYYY-MM-DDTHH:mm:ssZ}", dimensions_responseCode_neq: "NOERROR" } limit: 100 orderBy: [count_DESC]) { count dimensions { responseCode } } } } }` |
| 4 | **Total de consultas DNS** | stat | yesoreyeram-infinity-datasource (uid: ${infinity_datasource}) | **Type:** graphql **URL:** `https://api.cloudflare.com/client/v4/graphql` **Query:** `query Viewer { viewer { zones(filter: { zoneTag: "${zone_id}" }) { zoneTag dnsAnalyticsAdaptiveGroups(filter: { datetimeHour_geq: "${__from:date:YYYY-MM-DDTHH:mm:ssZ}", datetimeHour_leq: "${__to:date:YYYY-MM-DDTHH:mm:ssZ}" } limit: 5000) { count } } } }` |
| 5 | **Consultas por código de resposta** | table | yesoreyeram-infinity-datasource (uid: ${infinity_datasource}) | **Type:** graphql **URL:** `https://api.cloudflare.com/client/v4/graphql` **Query:** `query Viewer { viewer { zones(filter: { zoneTag: "${zone_id}" }) { zoneTag dnsAnalyticsAdaptiveGroups(filter: { datetimeMinute_geq: "${__from:date:YYYY-MM-DDTHH:mm:ssZ}", datetimeMinute_leq: "${__to:date:YYYY-MM-DDTHH:mm:ssZ}" } limit: 20 orderBy: [count_DESC]) { count dimensions { responseCode } } } } }` |
| 6 | **Consultas por código ao longo do tempo** | timeseries | yesoreyeram-infinity-datasource (uid: ${infinity_datasource}) | **Type:** graphql **URL:** `https://api.cloudflare.com/client/v4/graphql` **Query:** `query Viewer { viewer { zones(filter: { zoneTag: "${zone_id}" }) { zoneTag dnsAnalyticsAdaptiveGroups(filter: { datetimeMinute_geq: "${__from:date:YYYY-MM-DDTHH:mm:ssZ}", datetimeMinute_leq: "${__to:date:YYYY-MM-DDTHH:mm:ssZ}" } limit: 5000) { count avg { sampleInterval } dimensions { responseCode datetimeFifteenMinutes } } } } }` **Transformations:** prepareTimeSeries (format: multi) |

---

# Legacy Metrics Summary — Needs Migration

The following dashboards use **old cAdvisor/container metrics** that should be migrated to **Docker exporter metrics**:

| Old metric | New metric | Label change |
|------------|------------|--------------|
| `container_cpu_usage_seconds_total` | `docker_container_cpu_percent` (or equivalent) | `component` → `app_name` |
| `container_memory_usage_bytes` | `docker_container_memory_bytes` | `component` → `app_name` |
| `container_network_receive_bytes_total` + `container_network_transmit_bytes_total` | `docker_container_net_rx_bytes` + `docker_container_net_tx_bytes` (if available) | `component` → `app_name` |
| `container_info{component=~"..."}` | Join on `app_name` label | Drop `container_info` join pattern |

## Dashboards using legacy metrics

### gaqno-dashboard-front
- **Most accessed frontends (by traffic):** `container_network_receive_bytes_total`, `container_network_transmit_bytes_total`, `container_info{component=~"gaqno-.*-ui"}`
- **Frontend containers:** `container_info{component=~"gaqno-.*-ui"}`
- **Top CPU consumers (frontend):** `container_cpu_usage_seconds_total`, `container_info{component=~"gaqno-.*-ui"}`
- **CPU % per frontend:** same as above
- **Total CPU % (frontend):** same as above
- **Total memory (frontend):** `container_memory_usage_bytes`, `container_info{component=~"gaqno-.*-ui"}`
- **Top memory consumers (frontend):** same as above
- **Memory per frontend:** same as above

### gaqno-dashboard-backend
- **Backend containers:** `container_info{component=~"gaqno-.*-service"}`
- **Top CPU consumers (backend):** `container_cpu_usage_seconds_total`, `container_info{component=~"gaqno-.*-service"}`
- **CPU % per service:** same as above
- **Total memory (backend):** `container_memory_usage_bytes`, `container_info{component=~"gaqno-.*-service"}`
- **Total CPU % (backend):** same as above
- **Top memory consumers (backend):** same as above
- **Memory per service:** same as above  
- *(PostgreSQL panels use postgres-exporter metrics — not legacy)*

### gaqno-dashboard-devops
- **Containers — CPU % by name (infra only):** `container_cpu_usage_seconds_total`, `container_info{component!~"gaqno-.*-ui|gaqno-.*-service"}`
- **Containers — Memory by name (infra only):** `container_memory_usage_bytes`, `container_info{component!~"gaqno-.*-ui|gaqno-.*-service"}`

### gaqno-dns-droppage
- **No Prometheus/container metrics** — uses Infinity datasource + Cloudflare GraphQL API only. No migration needed for container metrics.

---

# Suggested Migration Queries (app_name-based)

Assuming the new metrics use `app_name` (e.g. `gaqno-crm-ui`, `gaqno-pdv-service`) and are named:

- `docker_container_cpu_percent` (0–100)
- `docker_container_memory_bytes`
- `docker_container_net_rx_bytes`, `docker_container_net_tx_bytes` (or rate thereof)

**Frontend (gaqno-*-ui):**
```promql
# CPU
docker_container_cpu_percent{app_name=~"gaqno-.*-ui"}

# Memory
docker_container_memory_bytes{app_name=~"gaqno-.*-ui"}

# Network traffic (if rates are needed)
rate(docker_container_net_rx_bytes{app_name=~"gaqno-.*-ui"}[5m]) + rate(docker_container_net_tx_bytes{app_name=~"gaqno-.*-ui"}[5m])
```

**Backend (gaqno-*-service):**
```promql
# CPU
docker_container_cpu_percent{app_name=~"gaqno-.*-service"}

# Memory
docker_container_memory_bytes{app_name=~"gaqno-.*-service"}
```

**Infra (exclude frontend and backend):**
```promql
# CPU
docker_container_cpu_percent{app_name!~"gaqno-.*-ui|gaqno-.*-service"}

# Memory
docker_container_memory_bytes{app_name!~"gaqno-.*-ui|gaqno-.*-service"}
```

**Container count:**
```promql
count(docker_container_cpu_percent{app_name=~"gaqno-.*-ui"})
```

---

# Quick Reference — All Prometheus Panels by Metric

| Metric | Dashboards | Panels |
|--------|------------|--------|
| `container_cpu_usage_seconds_total` | front, backend, devops | Multiple CPU bars/timeseries/stats |
| `container_memory_usage_bytes` | front, backend, devops | Multiple memory bars/timeseries/stats |
| `container_network_receive_bytes_total` | front | Most accessed frontends |
| `container_network_transmit_bytes_total` | front | Most accessed frontends |
| `container_info` (component) | front, backend, devops | All container panels |
| `pg_*` | backend | Locks, replication lag, DB size, connections |
| `node_cpu_seconds_total` | devops | Host CPU |
| `node_memory_*` | devops | Host Memory |
| `scrape_duration_seconds`, `up` | devops | Scrape monitoring |
| `node_load*` | devops | Load average |
| `prometheus_tsdb_head_samples_appended_total` | devops | Samples stat |

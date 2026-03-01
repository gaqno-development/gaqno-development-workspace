#!/usr/bin/env python3
"""Build docker-compose YAML with Grafana dashboard provisioning configs embedded."""
import os

DASHBOARDS_DIR = os.path.join(os.path.dirname(__file__), "dashboards")
DASHBOARD_FILES = [
    "gaqno-dashboard-front.json",
    "gaqno-dashboard-backend.json",
    "gaqno-dashboard-devops.json",
    "gaqno-dashboard-dns-droppage.json",
    "gaqno-errors-by-service.json",
    "gaqno-errors-by-frontend.json",
]
# Only the 4 main dashboards (smaller payload for API)
DASHBOARD_FILES_FOUR = [
    "gaqno-dashboard-front.json",
    "gaqno-dashboard-backend.json",
    "gaqno-dashboard-devops.json",
    "gaqno-dashboard-dns-droppage.json",
]

DASHBOARDS_YML = """---
apiVersion: 1
providers:
  - name: Gaqno Monitoring
    orgId: 1
    folder: Gaqno
    folderUid: gaqno
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /etc/grafana/dashboards
---
"""

BASE_COMPOSE = r"""services:
  node-exporter:
    image: 'prom/node-exporter:latest'
    volumes:
      - '/proc:/host/proc:ro'
      - '/sys:/host/sys:ro'
      - '/:/rootfs:ro'
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
  cadvisor:
    image: 'gcr.io/cadvisor/cadvisor:v0.49.1'
    volumes:
      - '/:/rootfs:ro'
      - '/var/run/docker.sock:/var/run/docker.sock:ro'
      - '/sys:/sys:ro'
      - '/var/lib/docker/:/var/lib/docker:ro'
      - '/dev/disk/:/dev/disk:ro'
      - '/sys/fs/cgroup:/sys/fs/cgroup:ro'
    privileged: true
    devices:
      - /dev/kmsg
    restart: unless-stopped
  container-name-mapper:
    image: 'docker:cli'
    volumes:
      - '/var/run/docker.sock:/var/run/docker.sock:ro'
    entrypoint: /bin/sh
    command:
      - '-c'
      - "apk add --no-cache curl jq > /dev/null 2>&1\nwhile true; do\n  metrics=\"\"\n  for cid in $$(docker ps -q --no-trunc); do\n    info=$$(docker inspect \"$$cid\" 2>/dev/null)\n    name=$$(echo \"$$info\" | jq -r '.[0].Name' | sed 's|^/||')\n    image=$$(echo \"$$info\" | jq -r '.[0].Config.Image')\n    short=$$(echo \"$$cid\" | head -c 12)\n    svc=$$(echo \"$$info\" | jq -r '.[0].Config.Labels[\"coolify.resourceName\"] // empty')\n    comp=$$(echo \"$$info\" | jq -r '.[0].Config.Labels[\"coolify.serviceName\"] // empty')\n    if [ -z \"$$svc\" ]; then svc=\"$$name\"; fi\n    if [ -z \"$$comp\" ]; then comp=\"$$name\"; fi\n    metrics=\"$${metrics}container_info{container_id=\\\"$$cid\\\",short_id=\\\"$$short\\\",name=\\\"$$name\\\",service=\\\"$$svc\\\",component=\\\"$$comp\\\",image=\\\"$$image\\\"} 1\n\"\n  done\n  printf \"$$metrics\" | curl -s --data-binary @- \"http://pushgateway:9091/metrics/job/container_info\" 2>/dev/null\n  sleep 30\ndone\n"
    restart: unless-stopped
  prometheus:
    image: 'prom/prometheus:latest'
    volumes:
      - 'prometheus-data:/prometheus'
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    configs:
      -
        source: prometheus_config
        target: /etc/prometheus/prometheus.yml
    restart: unless-stopped
    ports:
      - '9090:9090'
  postgres-exporter:
    image: 'quay.io/prometheuscommunity/postgres-exporter:v0.15.0'
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - 'DATA_SOURCE_URI=${POSTGRES_EXPORTER_URI}'
      - 'DATA_SOURCE_USER=${POSTGRES_EXPORTER_USER}'
      - 'DATA_SOURCE_PASS=${POSTGRES_EXPORTER_PASS}'
  pushgateway:
    image: 'prom/pushgateway:v1.6.2'
    restart: unless-stopped
  grafana:
    image: 'grafana/grafana:latest'
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=gaqno2026
      - GF_USERS_ALLOW_SIGN_UP=false
      - 'GF_SERVER_ROOT_URL=https://grafana.gaqno.com.br/'
      - GF_SERVER_DOMAIN=grafana.gaqno.com.br
      - GF_AUTH_BASIC_ENABLED=true
      - GF_PATHS_PROVISIONING=/etc/grafana/provisioning
    volumes:
      - 'grafana-data-v3:/var/lib/grafana'
    restart: unless-stopped
    ports:
      - '5678:3000'
    depends_on:
      - prometheus
    configs:
      -
        source: grafana_datasource
        target: /etc/grafana/provisioning/datasources/prometheus.yml
"""


def indent_for_yaml(content: str, spaces: int = 6) -> str:
    prefix = " " * spaces
    return "\n".join(prefix + line for line in content.splitlines()) or prefix


def main(dashboard_files=None):
    dashboard_files = dashboard_files or DASHBOARD_FILES
    # Build config mounts and config content for grafana (appended to BASE_COMPOSE later)
    config_entries = []
    config_defs = []

    # dashboards.yml (single mount entry)
    config_defs.append(
        "  grafana_dashboards_yml:\n    content: |\n" + indent_for_yaml(DASHBOARDS_YML.strip())
    )
    dashboard_mount_entries = []

    for fname in dashboard_files:
        path = os.path.join(DASHBOARDS_DIR, fname)
        if not os.path.isfile(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        config_name = "grafana_dashboard_" + fname.replace(".json", "").replace("-", "_")
        dashboard_mount_entries.append(
            f"      -\n        source: {config_name}\n        target: /etc/grafana/dashboards/{fname}"
        )
        config_defs.append(
            f"  {config_name}:\n    content: |\n" + indent_for_yaml(content)
        )

    # Insert new config mounts into grafana service (after the datasource config)
    grafana_configs = """    configs:
      -
        source: grafana_datasource
        target: /etc/grafana/provisioning/datasources/prometheus.yml
      -
        source: grafana_dashboards_yml
        target: /etc/grafana/provisioning/dashboards/dashboards.yml
""" + "\n".join(dashboard_mount_entries)

    compose = BASE_COMPOSE
    compose = compose.replace(
        """    configs:
      -
        source: grafana_datasource
        target: /etc/grafana/provisioning/datasources/prometheus.yml
""",
        grafana_configs + "\n",
    )

    # Append configs section (replace placeholder or append)
    compose = compose.rstrip()
    # Add top-level configs with existing + new
    existing_configs = r"""configs:
  prometheus_config:
    content: "global:\n  scrape_interval: 15s\n  evaluation_interval: 15s\nscrape_configs:\n  - job_name: prometheus\n    static_configs:\n      - targets: [\"localhost:9090\"]\n  - job_name: node-exporter\n    static_configs:\n      - targets: [\"node-exporter:9100\"]\n  - job_name: cadvisor\n    static_configs:\n      - targets: [\"cadvisor:8080\"]\n  - job_name: postgres-exporter\n    static_configs:\n      - targets: [\"postgres-exporter:9187\"]\n  - job_name: pushgateway\n    honor_labels: true\n    static_configs:\n      - targets: [\"pushgateway:9091\"]\n"
  grafana_datasource:
    content: "apiVersion: 1\ndatasources:\n  - name: Prometheus\n    type: prometheus\n    access: proxy\n    url: http://prometheus:9090\n    isDefault: true\n    editable: true\n"
"""
    new_configs = "\n".join(config_defs)
    full_configs = "configs:\n  prometheus_config:\n    content: \"global:\\n  scrape_interval: 15s\\n  evaluation_interval: 15s\\nscrape_configs:\\n  - job_name: prometheus\\n    static_configs:\\n      - targets: [\\\"localhost:9090\\\"]\\n  - job_name: node-exporter\\n    static_configs:\\n      - targets: [\\\"node-exporter:9100\\\"]\\n  - job_name: cadvisor\\n    static_configs:\\n      - targets: [\\\"cadvisor:8080\\\"]\\n  - job_name: postgres-exporter\\n    static_configs:\\n      - targets: [\\\"postgres-exporter:9187\\\"]\\n  - job_name: pushgateway\\n    honor_labels: true\\n    static_configs:\\n      - targets: [\\\"pushgateway:9091\\\"]\\n\"\n  grafana_datasource:\n    content: \"apiVersion: 1\\ndatasources:\\n  - name: Prometheus\\n    type: prometheus\\n    access: proxy\\n    url: http://prometheus:9090\\n    isDefault: true\\n    editable: true\\n\"\n" + new_configs + "\n"
    compose = compose + "\n" + full_configs + "volumes:\n  prometheus-data: {  }\n  grafana-data-v3: {  }\n"
    print(compose)


if __name__ == "__main__":
    import sys
    files = DASHBOARD_FILES_FOUR if (len(sys.argv) > 1 and sys.argv[1] == "--four") else DASHBOARD_FILES
    main(files)


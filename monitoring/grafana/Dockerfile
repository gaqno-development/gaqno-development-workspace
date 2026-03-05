FROM grafana/grafana:latest
USER root
RUN grafana-cli plugins install yesoreyeram-infinity-datasource
COPY provisioning /etc/grafana/provisioning
COPY dashboards /etc/grafana/dashboards
RUN chown -R 472:472 /etc/grafana/provisioning /etc/grafana/dashboards
RUN echo '#!/bin/sh\n\
Z="${CLOUDFLARE_ZONE_ID:-d628a8ac60069acccbc154d173b88717}"\n\
sed -i "s/__CLOUDFLARE_ZONE_ID__/$Z/g" /etc/grafana/dashboards/gaqno-dashboard-dns-droppage.json 2>/dev/null || true\n\
exec /run.sh "$@"' > /entrypoint-wrapper.sh && chmod +x /entrypoint-wrapper.sh
ENTRYPOINT ["/entrypoint-wrapper.sh"]
USER 472

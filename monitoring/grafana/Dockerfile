FROM grafana/grafana:12.4.1
USER root
RUN grafana-cli plugins install yesoreyeram-infinity-datasource
COPY provisioning /etc/grafana/provisioning
COPY dashboards /etc/grafana/dashboards
RUN chown -R 472:472 /etc/grafana/provisioning /etc/grafana/dashboards
RUN echo '#!/bin/sh\n\
Z="${CLOUDFLARE_ZONE_ID:-}"\n\
if [ -n "$$Z" ]; then sed -i "s/__CLOUDFLARE_ZONE_ID__/$$Z/g" /etc/grafana/dashboards/gaqno-dashboard-dns-droppage.json 2>/dev/null || true; fi\n\
exec /run.sh "$@"' > /entrypoint-wrapper.sh && chmod +x /entrypoint-wrapper.sh
ENTRYPOINT ["/entrypoint-wrapper.sh"]
USER 472

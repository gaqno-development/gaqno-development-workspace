FROM grafana/grafana:latest
USER root
RUN grafana-cli plugins install yesoreyeram-infinity-datasource
COPY provisioning /etc/grafana/provisioning
COPY dashboards /etc/grafana/dashboards
RUN chown -R 472:472 /etc/grafana/provisioning /etc/grafana/dashboards
USER 472

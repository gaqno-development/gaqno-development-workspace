FROM grafana/grafana:latest
COPY provisioning /etc/grafana/provisioning
COPY dashboards /etc/grafana/dashboards
USER root
RUN chown -R 472:472 /etc/grafana/provisioning /etc/grafana/dashboards
USER 472

FROM grafana/loki:2.7.1

USER root
RUN mkdir -p /tmp/loki/chunks /tmp/loki/index /tmp/loki/cache /tmp/loki/wal /tmp/loki/compactor && \
    chmod -R 777 /tmp/loki

CMD [ "-config.file=/etc/loki/loki-config.yaml" ]

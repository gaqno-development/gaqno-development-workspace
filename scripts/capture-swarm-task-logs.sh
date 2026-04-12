#!/usr/bin/env bash
set -euo pipefail

FILTER_NAME="${1:-app-parse-neural-interface-c24igh}"
ATTEMPTS="${2:-40}"

echo "Waiting for an exited task matching name=*${FILTER_NAME}* (up to ${ATTEMPTS}s)..."

for _ in $(seq 1 "$ATTEMPTS"); do
  id="$(docker ps -aq --filter "name=${FILTER_NAME}" --filter "status=exited" 2>/dev/null | head -1 || true)"
  if [[ -n "${id:-}" ]]; then
    echo "=== docker logs ${id} (stdout+stderr) ==="
    docker logs "$id" 2>&1
    exit 0
  fi
  sleep 1
done

running="$(docker ps -q --filter "name=${FILTER_NAME}" 2>/dev/null | head -1 || true)"
if [[ -n "${running:-}" ]]; then
  echo "No exited container yet; following live container ${running} (Ctrl+C to stop)..."
  docker logs -f "$running" 2>&1
  exit 0
fi

echo "No container matched. Try: docker ps -a --filter name=${FILTER_NAME}"
exit 1

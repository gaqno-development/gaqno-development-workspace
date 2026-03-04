#!/usr/bin/env bash
# Start only the infrastructure required to test the CRM → Finance event-driven flow in the browser.
# Run this first, then start backends and frontends locally (see docs/local-browser-test-crm-finance.md).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting Kafka + Zookeeper (required for CRM → Finance events)..."
docker compose up -d zookeeper kafka

echo ""
echo "Waiting for Kafka to be healthy..."
for i in {1..30}; do
  if docker compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list &>/dev/null; then
    echo "Kafka is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Kafka health check timed out. Proceed anyway; services may retry."
  fi
  sleep 2
done

echo ""
echo "==> Infrastructure is up. Next steps:"
echo "1. Ensure .env has: DATABASE_URL, JWT_SECRET, and optionally FINANCE_SYSTEM_USER_ID (UUID) for Finance to create receivables."
echo "2. In separate terminals, start (order matters for SSO):"
echo "   Terminal 1: npm run dev:sso-service"
echo "   Terminal 2: npm run dev:crm-service    # uses KAFKA_BROKERS=localhost:9092 by default"
echo "   Terminal 3: npm run dev:finance-service"
echo "   Terminal 4: npm run dev:shell          # Shell (portal) on http://localhost:3000"
echo "   Terminal 5: npm run dev:crm            # CRM MFE on http://localhost:3003"
echo "   Terminal 6: npm run dev:finance        # Finance MFE on http://localhost:3005"
echo "3. Open http://localhost:3000, log in, go to CRM → Deals, move a deal to Won (or drag to Won column); then open Finance → Transações to see the new receivable (with CRM badge)."
echo ""
echo "To stop Kafka + Zookeeper: docker compose stop kafka zookeeper"

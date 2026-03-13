#!/usr/bin/env bash
# Start only the infrastructure required to test the CRM → Finance event-driven flow in the browser.
# Run this first, then start backends and frontends locally (see docs/local-browser-test-crm-finance.md).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting Redis (required for CRM → Finance events via BullMQ)..."
docker compose up -d redis

echo ""
echo "Waiting for Redis to be ready..."
for i in {1..15}; do
  if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "Redis is ready."
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "Redis health check timed out. Proceed anyway; services may retry."
  fi
  sleep 2
done

echo ""
echo "==> Infrastructure is up. Next steps:"
echo "1. Ensure .env has: DATABASE_URL, JWT_SECRET, REDIS_URL=redis://localhost:6379"
echo "2. In separate terminals, start (order matters for SSO):"
echo "   Terminal 1: npm run dev:sso-service"
echo "   Terminal 2: npm run dev:crm-service"
echo "   Terminal 3: npm run dev:finance-service"
echo "   Terminal 4: npm run dev:shell          # Shell (portal) on http://localhost:3000"
echo "   Terminal 5: npm run dev:crm            # CRM MFE on http://localhost:3003"
echo "   Terminal 6: npm run dev:finance        # Finance MFE on http://localhost:3005"
echo "3. Open http://localhost:3000, log in, go to CRM → Deals, move a deal to Won (or drag to Won column); then open Finance → Transações to see the new receivable (with CRM badge)."
echo ""
echo "To stop Redis: docker compose stop redis"

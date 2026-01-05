#!/bin/bash

echo "🧪 Running WebSocket Integration Tests..."
echo ""

cd "$(dirname "$0")"

npm run test:e2e -- websocket.e2e-spec.ts


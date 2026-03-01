#!/bin/bash
set -e

echo "🚀 Deploying GAQNO Omnichannel UI - Phases 1 & 2"
echo ""

# Configuration
COOLIFY_BASE_URL="http://72.61.221.19:8000"
COOLIFY_TOKEN="5|hNDq5NXgXTREW7Ztn7T8AaQMJtFnddQ8SGH2JDxM337f3faa"
APP_UUID="xg8ggc4ggscc0ks8kc0skkk4"
COMMIT_SHA="bebf0c5d49ffcf0f14a8652b2ab71cf573ee1d88"

echo "📋 Deployment Information:"
echo "  Application: gaqno-omnichannel-ui"
echo "  Commit: $COMMIT_SHA"
echo "  Environment: Production"
echo ""

# Try multiple deployment endpoints
echo "🔄 Attempting deployment..."

# Method 1: Direct application deploy
echo "Method 1: Direct application deploy..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$COOLIFY_BASE_URL/api/v1/applications/$APP_UUID/deploy" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"manual","force":false}' 2>/dev/null)

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Deployment started successfully!"
    echo "Response: $RESPONSE_BODY"
    exit 0
fi

echo "❌ Method 1 failed (HTTP $HTTP_CODE)"

# Method 2: Deployments endpoint
echo "Method 2: Deployments endpoint..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$COOLIFY_BASE_URL/api/v1/deployments" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"application_uuid\":\"$APP_UUID\",\"type\":\"manual\",\"commit_sha\":\"$COMMIT_SHA\"}" 2>/dev/null)

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Deployment started successfully!"
    echo "Response: $RESPONSE_BODY"
    exit 0
fi

echo "❌ Method 2 failed (HTTP $HTTP_CODE)"

# Method 3: Webhook deploy
echo "Method 3: Webhook deploy..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$COOLIFY_BASE_URL/api/v1/webhooks/deploy" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"application_id\":\"$APP_UUID\",\"commit_sha\":\"$COMMIT_SHA\",\"ref\":\"refs/heads/main\"}" 2>/dev/null)

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Deployment started successfully!"
    echo "Response: $RESPONSE_BODY"
    exit 0
fi

echo "❌ Method 3 failed (HTTP $HTTP_CODE)"

# Method 4: Refresh application
echo "Method 4: Application refresh..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$COOLIFY_BASE_URL/api/v1/applications/$APP_UUID/refresh" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null)

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Application refresh started successfully!"
    echo "Response: $RESPONSE_BODY"
    exit 0
fi

echo "❌ Method 4 failed (HTTP $HTTP_CODE)"

# All methods failed
echo ""
echo "❌ All deployment methods failed"
echo "Please check the Coolify configuration and API endpoints"
echo "You may need to deploy manually through the Coolify UI"
echo ""
echo "Coolify URL: $COOLIFY_BASE_URL"
echo "Application UUID: $APP_UUID"
echo "Commit SHA: $COMMIT_SHA"
echo ""

exit 1

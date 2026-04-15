#!/bin/bash
# Cloudflare DNS Configuration Script for gaqno-shop
# This script creates/updates DNS records to point to the Dokploy server

# Configuration
ZONE_ID="d628a8ac60069acccbc154d173b88717"
DOKPLOY_IP="72.61.221.19"

# Domains to configure
DOMAINS=(
  "shop.gaqno.com.br"
  "api.gaqno.com.br"
  "shop-admin.gaqno.com.br"
)

echo "======================================"
echo "Cloudflare DNS Configuration"
echo "======================================"
echo ""
echo "Zone ID: $ZONE_ID"
echo "Dokploy Server IP: $DOKPLOY_IP"
echo ""
echo "Domains to configure:"
for domain in "${DOMAINS[@]}"; do
  echo "  - $domain"
done
echo ""
echo "======================================"
echo ""

echo "Current DNS Status:"
echo "-------------------"
for domain in "${DOMAINS[@]}"; do
  echo -n "  $domain: "
  result=$(dig +short A "$domain" 2>/dev/null | head -1)
  if [ -z "$result" ]; then
    echo "❌ Not configured"
  else
    echo "✓ $result"
  fi
done

echo ""
echo "======================================"
echo ""
echo "Required DNS Records:"
echo "---------------------"
for domain in "${DOMAINS[@]}"; do
  echo "  Type: A"
  echo "  Name: $domain"
  echo "  Value: $DOKPLOY_IP"
  echo "  Proxy: Disabled (DNS only)"
  echo ""
done

echo "======================================"
echo ""
echo "Manual Configuration Steps:"
echo "---------------------------"
echo ""
echo "1. Log in to Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com"
echo ""
echo "2. Select zone: gaqno.com.br"
echo ""
echo "3. Go to: DNS → Records"
echo ""
echo "4. Create/update these A records:"
echo ""
for domain in "${DOMAINS[@]}"; do
  short_name="${domain%.gaqno.com.br}"
  [ -z "$short_name" ] && short_name="@"
  echo "   Record 1:"
  echo "     Type: A"
  echo "     Name: $short_name"
  echo "     IPv4 address: $DOKPLOY_IP"
  echo "     Proxy status: DNS only (gray cloud)"
  echo "     TTL: Auto"
  echo ""
done

echo "5. Save changes"
echo ""
echo "======================================"
echo ""
echo "Verification:"
echo "-------------"
echo "After configuration, run:"
echo ""
for domain in "${DOMAINS[@]}"; do
  echo "  dig $domain"
done
echo ""
echo "Expected output: $DOKPLOY_IP"
echo ""
echo "======================================"

# Tenant Provisioning — Ops Runbook

Ops checklist that must be completed before the SUPER_ADMIN tenant provisioning flow can run end-to-end in production.

## Domain standard

Every new storefront must use a company-label host:

- `<company-label>.gaqno.com.br` in the current production zone.
- If the root zone changes in the future, keep the same company-label rule and swap only the base domain.

Company-label normalization rules:

1. Lowercase only.
2. Keep letters (`a-z`), numbers (`0-9`), and hyphens (`-`).
3. Replace spaces/underscores with hyphens.
4. Collapse repeated hyphens into one.
5. Trim leading/trailing hyphens.
6. Require 3 to 40 characters.

Examples:

- `Fifia Doces` -> `fifia-doces.gaqno.com.br`
- `Loja_123` -> `loja-123.gaqno.com.br`

## 1. Cloudflare API token

The existing `CLOUDFLARE_API_TOKEN` is read-only in some environments. The provisioning saga needs write access.

**Scopes required**:

- **Zone → DNS → Edit** (only for zone `gaqno.com.br`)
- **Account → Cloudflare Tunnel → Edit**

**Steps**:

1. Go to https://dash.cloudflare.com/profile/api-tokens → "Create Token" → "Custom token".
2. Name: `gaqno-tenant-provisioning`.
3. Permissions:
   - Zone, DNS, Edit
   - Account, Cloudflare Tunnel, Edit
4. Zone resources: Include, Specific zone, `gaqno.com.br`.
5. Account resources: Include, specific account.
6. Create and copy the token value.
7. Update the secret in Dokploy / `.env.production`:
   - `CLOUDFLARE_API_TOKEN=<new token>`
   - `CLOUDFLARE_ZONE_ID=d628a8ac60069acccbc154d173b88717`
   - `CLOUDFLARE_ACCOUNT_ID=<account id>` (found under "Overview" in the dashboard)
   - `CLOUDFLARE_TUNNEL_ID=<GAQNO_PROD_01 tunnel id>` (Zero Trust → Networks → Tunnels → click the tunnel → URL id)
   - `CLOUDFLARE_TUNNEL_TARGET_SERVICE=http://shop-service:4015`
8. Restart `gaqno-sso-service` so the new env is loaded.

**Smoke test**:

```bash
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?name=probe.gaqno.com.br" \
  | jq '.success'
```

Expected: `true`.

## 2. Cloudflare Tunnel + DNS onboarding for a new shop host

For each new storefront host (`<company-label>.gaqno.com.br`), all three layers must be aligned:

1. Tunnel ingress rule.
2. DNS CNAME to the tunnel.
3. Dokploy domain mapping to `gaqno-shop`.

### 2.1 Tunnel ingress

In Cloudflare Zero Trust, edit tunnel `GAQNO_PROD_01` and add:

- Hostname: `<company-label>.gaqno.com.br`
- Service: `http://dokploy-traefik:80`

Leave the final catch-all rule `http_status:404` as the last ingress item.

### 2.2 DNS CNAME

Create DNS record in zone `gaqno.com.br`:

- Type: `CNAME`
- Name: `<company-label>`
- Target: `<CLOUDFLARE_TUNNEL_ID>.cfargotunnel.com`
- Proxy: `Proxied`

### 2.3 Dokploy domain mapping (gaqno-shop)

Create app domain mapping in Dokploy for application `gaqno-shop`:

- `host=<company-label>.gaqno.com.br`
- `path=/`
- `port=3015`
- `certificateType=none` (TLS is terminated at Cloudflare Tunnel)

## 3. Link host to tenant in SSO domains

Create and activate the domain link in SSO:

1. `POST /domains` with `tenantId`, `domain`, and `isActive=true`.
2. Run `POST /domains/:id/verify`.
3. Optionally run `POST /domains/:id/check-ssl` for visibility.

Minimum payload:

```json
{
  "tenantId": "<tenant-uuid>",
  "domain": "<company-label>.gaqno.com.br",
  "isActive": true,
  "isVerified": true
}
```

## 4. Mercado Pago Platform

Subscription billing uses Mercado Pago Preapproval. This is gaqno charging tenants (not the tenant's storefront).

**Steps**:

1. Use the **gaqno corporate MP account** (not a tenant's).
2. Go to https://www.mercadopago.com.br/developers/panel/app → Create app "gaqno-platform" if missing.
3. Copy the **Access Token** (PROD).
4. Update secret:
   - `MERCADO_PAGO_PLATFORM_ACCESS_TOKEN=APP_USR-...`
   - `MERCADO_PAGO_PLATFORM_WEBHOOK_URL=https://api.gaqno.com.br/sso/v1/subscriptions/webhook/mercado-pago`
   - `MERCADO_PAGO_PLATFORM_SUCCESS_URL=https://portal.gaqno.com.br/billing/success`
5. In the MP app config, register the webhook URL for events: `subscription_preapproval`, `subscription_authorized_payment`.
6. Restart `gaqno-sso-service`.

**Smoke test**:

```bash
curl -H "Authorization: Bearer $MERCADO_PAGO_PLATFORM_ACCESS_TOKEN" \
  "https://api.mercadopago.com/preapproval_plan/search?limit=1" | jq '.results | length'
```

## 5. Shop service internal token

The SSO `InitPaymentGatewayStep` calls `POST {SHOP_SERVICE_URL}/payment-gateways/bootstrap` with header `x-internal-token`.

**Steps**:

1. Generate a 64-char random token:
   ```bash
   openssl rand -hex 32
   ```
2. Set the same value in both services:
   - `gaqno-sso-service`: `SHOP_INTERNAL_TOKEN=<token>` + `SHOP_SERVICE_URL=http://shop-service:4015`
   - `gaqno-shop-service`: `SHOP_INTERNAL_TOKEN=<same token>`
3. Restart both services.

## 6. Seed default plans

First-time only: insert basic/pro/enterprise plans.

```bash
curl -X POST https://api.gaqno.com.br/admin/v1/plans/seed-defaults \
  -H "Cookie: gaqno_session=..." \
  -H "Content-Type: application/json"
```

Expected response: `{ "seeded": [ { "slug": "basic", "created": true }, ... ] }`. Subsequent calls are idempotent (`created: false`).

## 7. Grant SUPER_ADMIN the new permission

The `platform.tenants.provision` permission was added. Existing SUPER_ADMIN roles are auto-upgraded the next time the SSO service boots (defaults sync on `ensureDefaultRolesAndPermissions` in `PermissionsService`). Verify manually:

```sql
SELECT p.key
FROM sso_role_permissions rp
JOIN sso_roles r ON r.id = rp.role_id
JOIN sso_permissions p ON p.id = rp.permission_id
WHERE r.key = 'SUPER_ADMIN' AND p.key = 'platform.tenants.provision';
```

Must return one row.

## 8. Post-deploy verification

1. Login as SUPER_ADMIN at `https://portal.gaqno.com.br/admin/organization/tenants`.
2. Click **"Provisionar tenant"** → fill wizard → submit.
3. Progress modal should stream each step. Expect all 9 green checks.
4. Visit `https://<company-label>.gaqno.com.br/login` — whitelabel renders with chosen colors/name.
5. Owner receives invite email.

If any step fails: open `/admin/organization/tenants/jobs/{jobId}` and click **Retry** on the failed step after fixing the underlying cause.

## 9. Deterministic smoke checklist

Run this exact sequence before considering a tenant domain live.

1. DNS/Tunnel reachability
   - Open `https://<company-label>.gaqno.com.br`.
   - Confirm 200 from storefront, not Tunnel 404.
2. Auth tenant switch
   - Login in portal and call assume-tenant for target tenant.
   - Ensure returned token `tenantId` is the target tenant.
3. Product isolation
   - Request `GET https://api.gaqno.com.br/shop/v1/products?page=1&limit=20` with bearer token from step 2.
   - Confirm no products from any other tenant.
4. Cart isolation
   - Add item to cart under `<company-label>.gaqno.com.br`.
   - Confirm cart retrieval under another tenant domain does not expose that item.
5. Checkout + payment bootstrap
   - Create order in checkout.
   - Trigger payment (`POST /payments`).
   - Confirm order/payment status transition for the same tenant.

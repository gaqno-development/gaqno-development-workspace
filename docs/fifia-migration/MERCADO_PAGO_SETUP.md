# Mercado Pago — Shop service and storefront

This document complements [mercado-pago-credentials.md](./mercado-pago-credentials.md) with **gaqno-shop-service** and **gaqno-shop** wiring.

## Shop service (`gaqno-shop-service`)

Configure at least:

| Variable | Purpose |
|----------|---------|
| `SHOP_SERVICE_PUBLIC_BASE_URL` | Public API base including path prefix, e.g. `https://api.gaqno.com.br/shop` — used for webhook URL (`…/v1/payments/webhook`) and fallback payment return when the storefront base is not set. |
| `SHOP_STOREFRONT_PUBLIC_URL` | Customer-facing shop origin, e.g. `https://shop.gaqno.com.br` — used when the tenant has no `publicShopUrl` in settings, for Mercado Pago `return_url` and for the HTTP redirect target of `GET /v1/payments/return`. |
| `MERCADO_PAGO_PIX_EXPIRY_MINUTES` | Optional; PIX preference expiry (default 30). |

Per-tenant Mercado Pago credentials are normally stored on **tenant payment gateways** (not only global env). Webhook endpoint: `{SHOP_SERVICE_PUBLIC_BASE_URL}/v1/payments/webhook`. The HTTP body must be raw (signature verification); do not strip `x-signature` / `x-request-id` at the edge.

## Tenant settings

If the tenant row includes `settings.publicShopUrl` as an **https** URL, that value is used as the Mercado Pago return base instead of `SHOP_STOREFRONT_PUBLIC_URL`.

Return path on the storefront: **`/pagamento/retorno?order=…&tenant=…`**. The optional `tenant` query helps the browser send `X-Tenant-Slug` before other API calls on that session.

## Storefront (`gaqno-shop`)

- `NEXT_PUBLIC_API_URL` should end with `/v1` or the client will append it (see `src/lib/api.ts`).
- After tenant resolution, the app sets `X-Tenant-Slug` from the resolved tenant so it cannot drift from `NEXT_PUBLIC_TENANT_SLUG`.

## Operational checklist

1. Set `SHOP_SERVICE_PUBLIC_BASE_URL` and `SHOP_STOREFRONT_PUBLIC_URL` in production.
2. Configure Mercado Pago application webhooks to the service URL above.
3. Ensure `publicShopUrl` on each production tenant is correct if you rely on tenant-specific return domains.

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

## Product alignment: admin toggles vs Mercado Pago

**Decisão de produto (Gaqno Shop):**

1. **O que a app controla** — `GET /v1/payments/methods` (via `PaymentGatewaysService.getEnabledPaymentMethods`) devolve quais meios a **vitrine** pode mostrar (ex.: `credit_card`, `pix`, `boleto`) com base no gateway Mercado Pago do tenant **ativo** na tabela `tenant_payment_gateways`. Não há toggles em “Módulos” do admin de loja para ativar PIX/cartão/boleto; esses meios são tratados como **núcleo** enquanto o gateway estiver credenciado.
2. **O que o Mercado Pago controla** — métodos realmente liquidáveis (PIX habilitado na conta, meios de cartão, boleto, antifraude) conforme o **painel e a conta** MP. A app não chama a API do MP para ligar/desligar meios na conta por switch interno.
3. **Se no futuro** quiseres interruptores no admin que apenas **escondam** um meio no checkout (sem alterar a conta MP), isso exigiria flags ou colunas por meio e filtragem em `getEnabledPaymentMethods` — eixo distinto de **(2)**.

Cobertura de teste automática: `gaqno-shop-service` — `payment-gateways.service.spec.ts` (gateway inativo / ativo) e `payment.service.spec.ts` (delegação para `getEnabledPaymentMethods`).

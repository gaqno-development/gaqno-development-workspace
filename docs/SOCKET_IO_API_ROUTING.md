# Socket.IO atrás de `api.gaqno.com.br`

## Correção no SSO (`gaqno-sso-service`)

O middleware que remove o prefixo `/sso` das requisições HTTP não deve afetar **`/sso-socket.io`**. A lógica em `shouldStripSsoPathPrefix` só remove o prefixo para `/sso` ou paths que começam com **`/sso/`**.

## Dokploy (produção) — aplicado

Domínio **`api.gaqno.com.br`**:

| App | Path | stripPath | Notas |
|-----|------|-----------|--------|
| **sso-service** | `/sso/` | sim | REST/OAuth sob `/sso/...`; não casa mais com `/sso-socket.io`. |
| **sso-service** | `/sso-socket.io` | não | Socket.IO (`domainId` `aUdHRXimLyvJZCcAaZQTV`). |
| **gaqno-shop-service** | `/shop` | sim | REST `/shop/v1`, webhooks, etc. |
| **gaqno-shop-service** | `/shop/socket.io` | não | Socket.IO (`domainId` `do6K6-1_QJrron5GY01Gr`). |

A rota HTTP do SSO passou de **`/sso`** para **`/sso/`** para que `PathPrefix` no Traefik **não** trate `/sso-socket.io` como subpath de `/sso` (evita strip errado). Chamadas devem usar **`/sso/v1/...`**, não `/ssov1`.

**Shop:** `PathPrefix(/shop)` ainda casa com `/shop/socket.io`; por isso existe a rota explícita **`/shop/socket.io`** sem strip. O Traefik deve preferir a regra mais longa quando várias casam — se algo falhar, verifique prioridade das routers no Traefik/Dokploy.

## Variáveis úteis no front

- `VITE_SSO_WS_URL` — origem do Socket.IO SSO (opcional).
- `VITE_SHOP_WS_URL` — origem do Socket.IO shop no admin (opcional).

## Cloudflare

Proxy laranja permite WebSockets por padrão.

# Desenvolvimento local

## Pré-requisitos

- Node 18+
- PostgreSQL acessível (ou use os `.env` dos serviços apontando para o servidor remoto)
- Redis (opcional; necessário para omnichannel)

## Variáveis de ambiente

O **.env na raiz** do workspace está configurado para desenvolvimento local:

- `NODE_ENV=development`
- `MFE_*_URL` → `http://localhost:3XXX` (com path quando o MFE usa `base` no Vite: `/erp`, `/saas`, `/omnichannel`, `/wellness`)
- `VITE_SERVICE_*_URL` → `http://localhost:4XXX` (backends)

Para o **shell** usar essas URLs, rode os comandos a partir da **raiz do workspace** depois de carregar o `.env`:

```bash
# Opção 1: carregar .env e rodar
set -a && source .env && set +a && npm run dev:shell

# Opção 2: ou copie o .env da raiz para gaqno-shell-ui/.env ao desenvolver só o shell
```

## Portas

### UIs (MFEs + shell)

| App              | Porta | Base path   | Script           |
|------------------|-------|-------------|------------------|
| gaqno-shell-ui   | 3000  | /           | dev:shell        |
| gaqno-sso-ui     | 3001  | /           | dev:sso          |
| gaqno-ai-ui      | 3002  | /           | dev:ai           |
| gaqno-crm-ui     | 3003  | /           | dev:crm          |
| gaqno-erp-ui     | 3004  | /erp        | dev:erp          |
| gaqno-finance-ui | 3005  | /           | dev:finance      |
| gaqno-pdv-ui     | 3006  | /           | dev:pdv          |
| gaqno-rpg-ui     | 3007  | /           | dev:rpg          |
| gaqno-saas-ui    | 3008  | /saas       | dev:saas         |
| gaqno-admin-ui   | 3010  | /           | dev:admin        |
| gaqno-omnichannel-ui | 3011 | /omnichannel | dev:omnichannel |
| gaqno-wellness-ui   | 3012 | /wellness   | dev:wellness    |

### Backends (NestJS)

| Serviço   | Porta | Script                  |
|-----------|-------|-------------------------|
| gaqno-sso-service        | 4001 | dev:sso-service        |
| gaqno-ai-service         | 4002 | dev:ai-service         |
| gaqno-crm-service        | 4003 | dev:crm-service        |
| gaqno-erp-service        | 4004 | dev:erp-service        |
| gaqno-finance-service    | 4005 | dev:finance-service    |
| gaqno-pdv-service        | 4006 | dev:pdv-service        |
| gaqno-rpg-service        | 4007 | dev:rpg-service        |
| gaqno-omnichannel-service| 4008 | dev:omnichannel-service|
| gaqno-saas-service       | 4009 | (sem script; adicionar se precisar) |
| gaqno-admin-service      | 4010 | (sem script; adicionar se precisar)   |
| gaqno-wellness-service   | 4011 | dev:wellness-service   |

## CORS

Os backends usam `@gaqno-backcore` → `getCorsOptions()`: com `NODE_ENV !== 'production'` ou `CORS_ORIGIN=*` no `.env` do serviço, todas as origens localhost são aceitas.

## Mínimo para testar portal (login + dashboard)

1. **SSO** (obrigatório): `npm run dev:sso-service`
2. **Shell**: `npm run dev:shell` ou `npm run dev:vite -w gaqno-shell-ui` (com .env da raiz carregado)
3. Acessar: http://localhost:3000/login

## Testar um MFE (ex.: ERP)

1. Subir shell + SSO (acima).
2. Subir o MFE: `npm run dev:erp` (ERP na 3004).
3. Fazer login e abrir a rota do MFE (ex.: http://localhost:3000/erp/inventory).

## Rodar tudo (Turbo)

```bash
npm run dev
```

Requer `concurrency` ≥ número de tarefas (ex.: 25). Se der erro de configuração, ajuste no `package.json`: `turbo run dev --concurrency=25 ...`.

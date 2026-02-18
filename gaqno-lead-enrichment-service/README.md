# gaqno-lead-enrichment-service

Kafka consumer that enriches leads via Pipedrive API (person search by phone) with JIT OAuth token refresh.

## Environment variables

- `DATABASE_URL` – PostgreSQL connection string (table `lead_pipedrive_integrations`).
- `KAFKA_BROKERS` – Comma-separated broker list (e.g. `localhost:9092`).
- `PIPEDRIVE_CLIENT_ID` – Pipedrive OAuth app client ID (runtime only, never in code).
- `PIPEDRIVE_CLIENT_SECRET` – Pipedrive OAuth app client secret (runtime only, never in code).
- `PORT` – HTTP server port (default `4010`).

## Testar integração com Pipedrive (manual)

Há apenas **testes unitários** (mocks). Para validar contra a API real do Pipedrive:

1. Tenha um registro em `lead_pipedrive_integrations` (tenant_id, access_token, refresh_token, expires_at, api_domain) com credenciais OAuth válidas.
2. Configure `.env` com `DATABASE_URL`, `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET`.
3. Rode:
   ```bash
   TENANT_ID=<uuid-do-tenant> PHONE=5511999999999 npm run test:pipedrive
   ```
   Ou passe o telefone como argumento: `TENANT_ID=... npm run test:pipedrive 5511999999999`.
4. O script chama `searchPersonByPhone` e imprime o JSON retornado pelo Pipedrive (ou erro).

## Coolify (recomendado: repo dedicado)

O app no Coolify foi criado apontando para o **monorepo** (`gaqno-development-workspace`). Esse repo usa **submódulos**; o clone com `--recurse-submodules` falha no Coolify (Host key verification failed nos submodules SSH). Por isso o deploy quebra.

**Solução: microserviço em repo próprio** (igual gaqno-omnichannel-service, gaqno-ai-service):

1. **Criar no GitHub** o repo `gaqno-development/gaqno-lead-enrichment-service` (vazio).
2. **Copiar para o novo repo** só o conteúdo desta pasta (raiz = esta pasta, com `Dockerfile`, `package.json`, `src/`, etc.):
   ```bash
   cd /path/to/gaqno-development-workspace
   git clone https://github.com/gaqno-development/gaqno-lead-enrichment-service.git /tmp/lead-enrichment-repo
   cp -r gaqno-lead-enrichment-service/* /tmp/lead-enrichment-repo/
   cd /tmp/lead-enrichment-repo && git add . && git commit -m "chore: initial service" && git push
   ```
3. **No Coolify** → app **gaqno-lead-enrichment-service** → **Source** → alterar **Git Repository** para `gaqno-development/gaqno-lead-enrichment-service`, branch `main`. Não é necessário Base directory; o **Dockerfile** na raiz do repo é usado.
4. **Deploy** de novo.

**Build privado:** o serviço depende de `@gaqno-development/backcore`. No Coolify, em **Build** → **Build Arguments**, defina `NPM_TOKEN` com um GitHub Personal Access Token (scope `read:packages`) para o `npm install` no Docker conseguir baixar o pacote.

- **UUID do app:** `xc4c0skcc4kg8408sgg8gswc`
- **Deploy:** MCP `deploy` com `tag_or_uuid`: `xc4c0skcc4kg8408sgg8gswc`
- **Env vars:** já configuradas (PIPEDRIVE_*, KAFKA_BROKERS, DATABASE_URL). Ajuste DATABASE_URL se ainda estiver com placeholder.

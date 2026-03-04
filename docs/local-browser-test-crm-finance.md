# Testar fluxo CRM → Financeiro no browser (local)

Este guia descreve a ordem correta para subir apenas o necessário e testar no browser o fluxo event-driven: **Login (SSO)** → **Deal Won no CRM** → Kafka → **Receita no Financeiro**.

## 0. Pré-requisitos

- **Docker Desktop** (ou Docker Engine) em execução — necessário para Kafka.
- **Arquivo `.env`** na raiz do workspace (ou nos diretórios dos serviços) com:
  - `DATABASE_URL` — Postgres usado por SSO, CRM e Finance (podem compartilhar o mesmo DB).
  - `JWT_SECRET` — mesmo valor para SSO e para os backends (CRM, Finance) validarem o token.
  - `FINANCE_SYSTEM_USER_ID` — (opcional) UUID de um usuário do tenant; se definido, o Finance cria a transação de receita ao consumir o evento. Sem isso, o evento é apenas logado.

## 1. Subir infraestrutura primeiro

Na raiz do workspace:

```bash
./scripts/run-local-crm-finance.sh
```

Isso sobe **Zookeeper** e **Kafka** via Docker Compose. O CRM e o Finance usam `KAFKA_BROKERS=localhost:9092` por padrão quando rodam na máquina local.

## 2. Ordem de execução dos serviços

Abra **6 terminais** na raiz do workspace e rode **nesta ordem**:

| Ordem | Comando                     | Porta | Descrição                          |
|-------|-----------------------------|-------|------------------------------------|
| 1     | `npm run dev:sso-service`   | 4001  | **SSO** — autenticação (obrigatório para login) |
| 2     | `npm run dev:crm-service`   | 4003  | API Deals + Kafka producer         |
| 3     | `npm run dev:finance-service` | 4005 | API Transações + Kafka consumer    |
| 4     | `npm run dev:shell`         | 3000  | Portal (Shell)                     |
| 5     | `npm run dev:crm`           | 3003  | MFE CRM (Deals)                    |
| 6     | `npm run dev:finance`       | 3005  | MFE Financeiro                     |

**Importante:** O Shell chama o SSO em `http://localhost:4001/v1/sign-in` para login. Se o SSO não estiver rodando na 4001, o login não redireciona e a página fica em `/login`.

O Shell (3000) carrega os MFEs CRM (3003) e Finance (3005) via Module Federation; os frontends usam as URLs padrão localhost:4003 e 4005 para os backends.

## 3. Verificar serviços (antes de abrir o browser)

Na raiz do workspace, confira se os serviços respondem (rode após subir cada um):

```bash
# SSO (obrigatório para login)
curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/v1/me
# 401 = OK (endpoint existe, exige auth). Conexão recusada = SSO não está rodando.

# CRM API
curl -s -o /dev/null -w "%{http_code}" http://localhost:4003/v1/health 2>/dev/null || echo "down"

# Finance API
curl -s -o /dev/null -w "%{http_code}" http://localhost:4005/v1/health 2>/dev/null || echo "down"

# Shell
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 200 = Shell no ar.
```

Só abra `http://localhost:3000` e faça login quando o SSO responder (401 ou 200 no `/v1/me`).

## 4. Testar no browser

1. Abra **http://localhost:3000** e faça login (SSO).
2. Vá em **CRM** → **Vendas** → **Deals** (pipeline Kanban).
3. Em um deal em estágio **Negotiation**, clique em **Won** (ou arraste o card para a coluna Won).
4. Deve aparecer o toast: *"Deal marked as won — receivable created in Finance"* e o Kanban atualiza.
5. Vá em **Financeiro** → **Transações**.
6. Deve aparecer uma nova **receita** com descrição *"Receita - Oportunidade #&lt;id&gt;"* e badge **CRM**.  
   - Se a lista não atualizar sozinha, aguarde até 30 s (polling) ou recarregue a página.

## 5. Troubleshooting

- **Login não redireciona / fica em `/login`**: o SSO não está rodando ou não está na porta 4001. Rode `npm run dev:sso-service` e aguarde "Nest application successfully started". Depois confira com `curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/v1/me` (401 = OK).
- **Nenhuma receita criada**: confira se `FINANCE_SYSTEM_USER_ID` está definido e é um UUID válido de usuário do tenant. Veja os logs do `gaqno-finance-service` (mensagem consumida e possível erro em `createTransaction`).
- **Kafka indisponível**: rode `./scripts/run-local-crm-finance.sh` de novo e espere o healthcheck. Os serviços fazem retry de conexão.
- **CORS ou 401**: confirme que está logado no Shell e que SSO, CRM e Finance usam o mesmo `JWT_SECRET`.
- **MFE não carrega**: confira se CRM e Finance UIs estão rodando nas portas 3003 e 3005 antes de abrir o Shell.

## 6. Parar

- Parar apenas Kafka/Zookeeper: `docker compose stop kafka zookeeper`
- Parar os serviços locais: Ctrl+C em cada terminal.

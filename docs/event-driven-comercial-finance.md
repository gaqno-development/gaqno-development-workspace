# Event-driven: Comercial → Financeiro

Fluxo de eventos de negócio entre CRM e Financeiro via BullMQ (Redis), usando o catálogo em `@gaqno-types/events`.

## Fluxo

1. **CRM (gaqno-crm-service)**  
   Ao atualizar um deal para stage `won`, o serviço publica o evento `comercial.opportunity_won` no tópico `comercial.events` (BullMQ), com payload no formato `IntegrationEvent<OpportunityWonData>`.

2. **BullMQ / Redis**  
   Tópico por domínio: `comercial.events`. Chave da mensagem: `tenantId`. Payload: JSON do evento (eventId, eventType, tenantId, aggregateId, data, metadata, etc.).  
   O `KafkaProducer` faz fan-out para a fila `comercial.events__finance` (e demais subscribers definidos em `TOPIC_SUBSCRIBERS`).

3. **Financeiro (gaqno-finance-service)**  
   Worker inscrito na fila `comercial.events__finance`. Para cada job com `eventType === 'comercial.opportunity_won'`, cria uma transação de **receita** (conta a receber) quando `FINANCE_SYSTEM_USER_ID` estiver configurado.

## Variáveis de ambiente

| Serviço   | Variável                 | Obrigatório | Descrição |
|----------|---------------------------|------------|-----------|
| CRM      | `REDIS_URL`              | Não        | URL Redis (default: `redis://localhost:6379`) |
| Finance  | `REDIS_URL`              | Não        | URL Redis (default: `redis://localhost:6379`) |
| Finance  | `FINANCE_SYSTEM_USER_ID` | Para receber | UUID do usuário "sistema" usado ao criar receitas a partir de eventos. Se não definido, o evento é apenas logado. |

## Contratos

- Tipos e catálogo: `@gaqno-development/types` (subpath `events`).
- Tópicos de domínio: `TopicRegistry` em `@gaqno-development/backcore` usa os mesmos nomes do catálogo (ex.: `comercialEvents` → `comercial.events`).
- Publicação no CRM: `ComercialEventPublisherService.publishOpportunityWon()` usa `createIntegrationEvent` e `KafkaProducer.publishIntegrationEvent`.
- Consumo no Finance: `ComercialEventsConsumer` faz parse do JSON como `IntegrationEvent<OpportunityWonData>` e chama `TransactionsService.createTransaction` com tipo receita.

## Docker Compose

O `docker-compose.yml` na raiz do workspace inclui:

- **redis** (porta 6379), `maxmemory-policy noeviction` (requerido pelo BullMQ)

Serviços que usam BullMQ/Redis:

- **crm-service**: `REDIS_URL=redis://redis:6379`, `depends_on: redis`. Publica `comercial.opportunity_won` em `comercial.events` quando um deal passa para stage won.
- **finance-service**: `REDIS_URL=redis://redis:6379`, `depends_on: redis`. Opcional: `FINANCE_SYSTEM_USER_ID`. Consome `comercial.events__finance` e cria receita.
- **omnichannel-service**: `REDIS_URL=redis://redis:6379`, `depends_on: redis`.

O **gaqno-crm-service** está no `docker-compose.yml` (porta 4003). Com `docker-compose up`, o fluxo Comercial → Financeiro pode ser testado de ponta a ponta: atualizar um deal para "won" no CRM (API ou UI) e verificar no Financeiro a transação de receita criada (com `FINANCE_SYSTEM_USER_ID` definido).

## Próximos passos (sugestão)

- Novos fluxos: `operacoes.order_shipped` → Financeiro (reconhecer receita); `pdv.sale_completed` → Financeiro.

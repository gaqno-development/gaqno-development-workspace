# Event-driven: Comercial → Financeiro

Fluxo de eventos de negócio entre CRM e Financeiro via Kafka, usando o catálogo em `@gaqno-types/events`.

## Fluxo

1. **CRM (gaqno-crm-service)**  
   Ao atualizar um deal para stage `won`, o serviço publica o evento `comercial.opportunity_won` no tópico `comercial.events` (Kafka), com payload no formato `IntegrationEvent<OpportunityWonData>`.

2. **Kafka**  
   Tópico por domínio: `comercial.events`. Chave da mensagem: `tenantId`. Payload: JSON do evento (eventId, eventType, tenantId, aggregateId, data, metadata, etc.).

3. **Financeiro (gaqno-finance-service)**  
   Consumidor inscrito em `comercial.events`. Para cada mensagem com `eventType === 'comercial.opportunity_won'`, cria uma transação de **receita** (conta a receber) quando `FINANCE_SYSTEM_USER_ID` estiver configurado.

## Variáveis de ambiente

| Serviço   | Variável                 | Obrigatório | Descrição |
|----------|---------------------------|------------|-----------|
| CRM      | `KAFKA_BROKERS`           | Não        | Brokers Kafka (default: `localhost:9092`) |
| Finance  | `KAFKA_BROKERS`          | Não        | Brokers Kafka (default: `localhost:9092`) |
| Finance  | `FINANCE_SYSTEM_USER_ID` | Para receber | UUID do usuário “sistema” usado ao criar receitas a partir de eventos. Se não definido, o evento é apenas logado. |

## Contratos

- Tipos e catálogo: `@gaqno-development/types` (subpath `events`).
- Tópicos de domínio: `TopicRegistry` em `@gaqno-development/backcore` usa os mesmos nomes do catálogo (ex.: `comercialEvents` → `comercial.events`).
- Publicação no CRM: `ComercialEventPublisherService.publishOpportunityWon()` usa `createIntegrationEvent` e `KafkaProducer.publishIntegrationEvent`.
- Consumo no Finance: `ComercialEventsConsumer` faz parse do JSON como `IntegrationEvent<OpportunityWonData>` e chama `TransactionsService.createTransaction` com tipo receita.

## Docker Compose

O `docker-compose.yml` na raiz do workspace inclui:

- **zookeeper** (porta 2181)
- **kafka** (portas 9092 host / 29092 rede interna), com healthcheck

Serviços que usam Kafka:

- **crm-service**: `KAFKA_BROKERS=kafka:29092`, `depends_on: kafka` (condition: service_healthy). Publica `comercial.opportunity_won` em `comercial.events` quando um deal passa para stage won.
- **finance-service**: `KAFKA_BROKERS=kafka:29092`, `depends_on: kafka` (condition: service_healthy). Opcional: `FINANCE_SYSTEM_USER_ID`. Consome `comercial.events` e cria receita.
- **omnichannel-service**: `KAFKA_BROKERS=kafka:29092`, `depends_on: kafka` (condition: service_healthy).

O **gaqno-crm-service** está no `docker-compose.yml` (porta 4003). Com `docker-compose up`, o fluxo Comercial → Financeiro pode ser testado de ponta a ponta: atualizar um deal para "won" no CRM (API ou UI) e verificar no Financeiro a transação de receita criada (com `FINANCE_SYSTEM_USER_ID` definido).

## Próximos passos (sugestão)

- Padrão **Outbox** no CRM para publicar eventos na mesma transação do update do deal.
- Novos fluxos: `operacoes.order_shipped` → Financeiro (reconhecer receita); `pdv.sale_completed` → Financeiro.

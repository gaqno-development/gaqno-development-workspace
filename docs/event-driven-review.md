# Revisão das alterações — Event-driven Comercial → Financeiro

## Resumo das alterações

| Área | Arquivos | Alteração |
|------|----------|-----------|
| **@gaqno-types** | `src/events/*` (já existente) | Catálogo de eventos, tópicos, payloads, factory, validação. Nenhuma mudança nesta revisão. |
| **@gaqno-backcore** | `src/kafka/topic-registry.ts` | Importa `TOPICS` de `@gaqno-development/types`; adiciona 10 propriedades de tópicos de domínio (comercialEvents, atendimentoEvents, …) com defaults do catálogo. |
| **@gaqno-backcore** | `src/kafka/kafka-producer.ts` | Novo método `publishIntegrationEvent(topic, event: IntegrationEvent, correlationId?)`; serializa evento completo; key = `tenantId`. |
| **@gaqno-backcore** | `src/kafka/index.ts` | Reexporta `DOMAIN_TOPICS` (alias de TOPICS). |
| **@gaqno-backcore** | `package.json` | `@gaqno-development/types`: `^1.3.0`. |
| **gaqno-crm-service** | `src/kafka/kafka.module.ts` | Provider de `KafkaProducer`; connect/disconnect no ciclo do módulo; export do producer. |
| **gaqno-crm-service** | `src/events/comercial-event-publisher.service.ts` | Novo: publica `comercial.opportunity_won` com `createIntegrationEvent` + `publishIntegrationEvent`. |
| **gaqno-crm-service** | `src/deals/deals.service.ts` | Injeta `ComercialEventPublisherService`; em `update()`, se `deal.stage === 'won'`, chama `publishOpportunityWon` em background (catch só loga). |
| **gaqno-crm-service** | `src/deals/deals.module.ts` | Provider e export de `ComercialEventPublisherService`. |
| **gaqno-crm-service** | `package.json` | backcore `^1.1.25`, types `^1.3.0`. |
| **gaqno-crm-service** | `kafka.module.spec.ts`, `deals.service.spec.ts` | Mocks para producer e publisher; testes para “won” publica e “não won” não publica. |
| **gaqno-finance-service** | `src/kafka/kafka.module.ts` | Novo: TopicRegistry, KafkaConsumer, ComercialEventsConsumer; subscribe após connect. |
| **gaqno-finance-service** | `src/kafka/comercial-events.consumer.ts` | Novo: subscreve `comercial.events`; parse `IntegrationEvent<OpportunityWonData>`; se `opportunity_won` e `FINANCE_SYSTEM_USER_ID` setado, cria transação receita. |
| **gaqno-finance-service** | `src/app.module.ts` | Importa `KafkaModule`. |
| **gaqno-finance-service** | `package.json` | backcore `^1.1.25`, types `^1.3.0`, kafkajs `^2.2.4`. |
| **docker-compose.yml** | — | Novos serviços `zookeeper` e `kafka`; `crm-service` (4003, KAFKA_BROKERS, depends_on kafka); `finance-service` e `omnichannel-service` com KAFKA_BROKERS e depends_on kafka. |
| **docs** | `event-driven-comercial-finance.md` | Fluxo, env vars, contratos, Docker Compose, próximos passos. |

---

## Consistência

- **tenantId**: Contratos em `@gaqno-types` e mensagens Kafka usam `tenantId`; backcore mantém `orgId` em `PublishEnvelope` (legado). No novo fluxo só se usa `IntegrationEvent` com `tenantId`. OK.
- **Nomes de eventos**: `comercial.opportunity_won` está em `DOMAIN_EVENT_NAMES` e no catálogo; producer e consumer usam o mesmo nome. OK.
- **Tópico**: `comercial.events` = `TOPICS.COMERCIAL_EVENTS` = `TopicRegistry.comercialEvents`. CRM e Finance usam `topics.comercialEvents`. OK.
- **Payload**: `OpportunityWonData` com `opportunityId`, `value`, `tenantId`, `occurredAt`; producer preenche; consumer lê e cria transação. OK.

---

## Pontos de atenção

### 1. Publicação no CRM é fire-and-forget

- **Onde**: `DealsService.update()` chama `publishOpportunityWon().catch(...)` e não espera.
- **Risco**: Se o Kafka estiver indisponível, o update do deal persiste mas o evento pode ser perdido (ou falha silenciosa no producer).
- **Recomendação**: Adotar padrão Outbox (gravar evento na mesma transação do update; worker lê outbox e publica no Kafka). Documentado como próximo passo.

### 2. Idempotência no Financeiro ✅ Implementado

- **Onde**: `ComercialEventsConsumer.handleOpportunityWon` agora usa `ProcessedEventsService.tryClaimProcessed(tenantId, eventId)` antes de criar a transação.
- **Implementação**: Tabela `finance_processed_events` (event_id PK, tenant_id, created_at); `tryClaimProcessed` faz `INSERT ... ON CONFLICT (event_id) DO NOTHING RETURNING` — retorna `true` se inseriu (primeiro a processar) e `false` se já existia. Só chama `createTransaction` quando o claim é bem-sucedido.
- **Testes**: `comercial-events.consumer.spec` cobre evento já processado (não chama createTransaction); `processed-events.service.spec` cobre claim novo vs. conflito.

### 3. Tratamento de erro no consumer

- **Onde**: Handler do consumer faz `try/catch` e só loga; `handleOpportunityWon` não envolve em try/catch (falha sobe e pode ser reprocessada).
- **Estado**: Aceitável; falha em `createTransaction` derruba o processamento da mensagem e o consumer group pode reprocessar. Se quiser evitar reprocesso infinito, enviar para DLQ após N falhas (melhoria futura).

### 4. FINANCE_SYSTEM_USER_ID

- **Onde**: Finance exige esse env para criar receita; senão apenas loga.
- **Estado**: Correto para multi-tenant; garante que existe um “usuário sistema” por ambiente. Documentado.

### 5. Docker: healthcheck do Kafka

- **Onde**: `kafka-topics --bootstrap-server localhost:9092 --list`.
- **Estado**: Pode falhar em algumas imagens se o comando não existir ou o broker demorar. Se o compose falhar ao subir, considerar aumentar `start_period` ou trocar o healthcheck.

---

## Testes

- **@gaqno-types**: 74 testes (events: types, catalog, factory, topics, payloads, validation). OK.
- **gaqno-crm-service**: DealsService com mock do publisher; ComercialEventPublisherService com mock do producer; KafkaModule com mock consumer + producer. OK.
- **gaqno-finance-service**: ComercialEventsConsumer com subscribe, handle opportunity_won (com e sem FINANCE_SYSTEM_USER_ID). OK.

---

## Conclusão

As alterações estão consistentes com o desenho (catálogo em types, tópicos por domínio, IntegrationEvent com tenantId, CRM publica / Finance consome). Os únicos pontos a evoluir são: **Outbox** no CRM para garantir publicação atômica e **idempotência** no Finance para reprocessamento seguro. O restante está adequado para uso atual.

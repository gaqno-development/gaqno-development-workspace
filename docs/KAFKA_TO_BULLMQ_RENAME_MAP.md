# Kafka → BullMQ Migration: Comprehensive Rename Map

This document maps every occurrence of "kafka" in the workspace that should be renamed for the Kafka → BullMQ migration. The code already uses BullMQ internally but keeps "kafka" in names for backward compatibility.

---

## 1. Directories named `kafka/`

| Current Path | Suggested New Path |
|-------------|-------------------|
| `@gaqno-backcore/src/kafka/` | `@gaqno-backcore/src/messaging/` |
| `@gaqno-backcore/__tests__/kafka/` | `@gaqno-backcore/__tests__/messaging/` |
| `gaqno-admin-service/src/kafka/` | `gaqno-admin-service/src/messaging/` |
| `gaqno-ai-service/src/kafka/` | `gaqno-ai-service/src/messaging/` |
| `gaqno-consumer-service/src/kafka/` | `gaqno-consumer-service/src/messaging/` |
| `gaqno-crm-service/src/kafka/` | `gaqno-crm-service/src/messaging/` |
| `gaqno-customer-service/src/kafka/` | `gaqno-customer-service/src/messaging/` |
| `gaqno-erp-service/src/kafka/` | `gaqno-erp-service/src/messaging/` |
| `gaqno-finance-service/src/kafka/` | `gaqno-finance-service/src/messaging/` |
| `gaqno-intelligence-service/src/kafka/` | `gaqno-intelligence-service/src/messaging/` |
| `gaqno-omnichannel-service/src/kafka/` | `gaqno-omnichannel-service/src/messaging/` |
| `gaqno-pdv-service/src/kafka/` | `gaqno-pdv-service/src/messaging/` |
| `gaqno-rpg-service/src/kafka/` | `gaqno-rpg-service/src/messaging/` |
| `gaqno-sso-service/src/kafka/` | `gaqno-sso-service/src/messaging/` |
| `gaqno-sso-service/test/unit/kafka/` | `gaqno-sso-service/test/unit/messaging/` |
| `gaqno-wellness-service/src/kafka/` | `gaqno-wellness-service/src/messaging/` |

**Note:** Exclude `gaqno-omnichannel-service/coverage/lcov-report/src/kafka/` — it's generated coverage output and will be regenerated when paths change.

---

## 2. Files with "kafka" in the filename

| Current File | Suggested New Name |
|-------------|-------------------|
| `@gaqno-backcore/src/kafka/kafka-consumer.ts` | `message-consumer.ts` |
| `@gaqno-backcore/src/kafka/kafka-producer.ts` | `message-producer.ts` |
| `@gaqno-backcore/src/kafka/kafka.module.ts` | *(no direct equivalent — see @gaqno-backcore uses `bullmq-core.module.ts`)* |
| `@gaqno-backcore/__tests__/kafka/kafka-consumer.spec.ts` | `message-consumer.spec.ts` |
| `@gaqno-backcore/__tests__/kafka/kafka-producer.spec.ts` | `message-producer.spec.ts` |
| `gaqno-admin-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-ai-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-consumer-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-crm-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-crm-service/src/kafka/kafka.module.spec.ts` | `messaging.module.spec.ts` |
| `gaqno-customer-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-erp-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-finance-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-intelligence-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-omnichannel-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-omnichannel-service/src/kafka/kafka.module.spec.ts` | `messaging.module.spec.ts` |
| `gaqno-pdv-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-rpg-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-sso-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |
| `gaqno-wellness-service/src/kafka/kafka.module.ts` | `messaging.module.ts` |

---

## 3. Class/type names containing "Kafka"

| Class/Type Name | File | Suggested New Name |
|-----------------|------|-------------------|
| `KafkaConsumer` | `@gaqno-backcore/src/kafka/kafka-consumer.ts` | `MessageConsumer` |
| `KafkaConsumerConfig` | `@gaqno-backcore/src/kafka/kafka-consumer.ts` | `MessageConsumerConfig` |
| `KafkaProducer` | `@gaqno-backcore/src/kafka/kafka-producer.ts` | `MessageProducer` |
| `KafkaProducerConfig` | `@gaqno-backcore/src/kafka/kafka-producer.ts` | `MessageProducerConfig` |
| `KafkaModule` | `gaqno-admin-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-ai-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-consumer-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-crm-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-customer-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-erp-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-finance-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-intelligence-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-omnichannel-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-pdv-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-rpg-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-sso-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaModule` | `gaqno-wellness-service/src/kafka/kafka.module.ts` | `MessagingModule` |
| `KafkaMessagePayload` | `gaqno-lead-enrichment-service/src/enrichment/enrichment-consumer.service.ts` | `MessagePayload` |

**Note:** `TopicRegistry`, `OutboxProcessorService`, and `BullMqCoreModule` do not contain "Kafka" and can remain as-is unless you choose to rename them for consistency.

---

## 4. Import paths containing "kafka"

| Import Path | Files Using It | Suggested New Path |
|-------------|---------------|-------------------|
| `from "./kafka"` | `@gaqno-backcore/src/index.ts` | `from "./messaging"` |
| `from './kafka-producer'` | `@gaqno-backcore/src/kafka/bullmq-core.module.ts`, `outbox-processor.service.ts` | `from './message-producer'` |
| `from './kafka-consumer'` | `@gaqno-backcore/src/kafka/bullmq-core.module.ts` | `from './message-consumer'` |
| `from '../../src/kafka/kafka-producer'` | `@gaqno-backcore/__tests__/kafka/kafka-producer.spec.ts`, `outbox-processor.service.spec.ts` | `from '../../src/messaging/message-producer'` |
| `from '../../src/kafka/kafka-consumer'` | `@gaqno-backcore/__tests__/kafka/kafka-consumer.spec.ts` | `from '../../src/messaging/message-consumer'` |
| `from '../../src/kafka/topic-registry'` | `@gaqno-backcore/__tests__/kafka/topic-registry.spec.ts` | `from '../../src/messaging/topic-registry'` |
| `from '../../src/kafka/outbox-processor.service'` | `@gaqno-backcore/__tests__/kafka/outbox-processor.service.spec.ts` | `from '../../src/messaging/outbox-processor.service'` |
| `from "../kafka/kafka.module"` | gaqno-crm-service (webhooks.module), gaqno-omnichannel-service (flow-execution-consumer, messages.module, customers.module, app.module), gaqno-omnichannel-service/messaging/core/core.module | `from "../messaging/messaging.module"` |
| `from "./kafka/kafka.module"` | gaqno-pdv-service, gaqno-wellness-service, gaqno-sso-service, gaqno-rpg-service, gaqno-finance-service, gaqno-ai-service, gaqno-crm-service, gaqno-customer-service, gaqno-erp-service, gaqno-admin-service, gaqno-intelligence-service, gaqno-consumer-service (app.module.ts) | `from "./messaging/messaging.module"` |
| `from './kafka/kafka.module.js'` | gaqno-consumer-service/app.module.ts | `from './messaging/messaging.module.js'` |
| `from "../kafka/rpg-event-publisher.service"` | gaqno-rpg-service (sessions, campaigns) | `from "../messaging/rpg-event-publisher.service"` |
| `from "../kafka/message-event-publisher.service"` | gaqno-omnichannel-service (customers, messages, inbox-ingestion) | `from "../messaging/message-event-publisher.service"` |
| `from "../kafka/financeiro-event-publisher.service"` | gaqno-finance-service (transactions) | `from "../messaging/financeiro-event-publisher.service"` |
| `from "../kafka/sso-event-publisher.service"` | gaqno-sso-service (auth, orgs) | `from "../messaging/sso-event-publisher.service"` |
| `from "../kafka/wellness-event-publisher.service"` | gaqno-wellness-service (daily-log) | `from "../messaging/wellness-event-publisher.service"` |
| `from '../kafka/video-topics'` | gaqno-ai-service (video-publish.consumer, video-generation.consumer, video-projects.service, publishers, tiktok-publish.service) | `from '../messaging/video-topics'` |
| `from "../../kafka/kafka.module"` | gaqno-omnichannel-service/messaging/core/core.module | `from "../../messaging/messaging.module"` |
| `from "../../kafka/message-event-publisher.service"` | gaqno-omnichannel-service/messaging/core (inbox-ingestion) | `from "../../messaging/message-event-publisher.service"` |
| `from "../../kafka/wellness-event-publisher.service"` | gaqno-wellness-service/daily-log/__tests__ | `from "../../messaging/wellness-event-publisher.service"` |
| `from "../../../src/kafka/sso-event-publisher.service"` | gaqno-sso-service/test/unit (auth, orgs, kafka) | `from "../../../src/messaging/sso-event-publisher.service"` |
| `from "./kafka.module"` | gaqno-crm-service, gaqno-omnichannel-service (kafka.module.spec.ts) | `from "./messaging.module"` |

### @gaqno-development/backcore package exports

Consumers import `KafkaProducer`, `KafkaConsumer`, `TopicRegistry`, etc. from `@gaqno-development/backcore`. After renaming:

- `KafkaProducer` → `MessageProducer` (export from backcore)
- `KafkaConsumer` → `MessageConsumer` (export from backcore)
- `KafkaProducerConfig` → `MessageProducerConfig`
- `KafkaConsumerConfig` → `MessageConsumerConfig`
- `KafkaMessagePayload` (lead-enrichment) → `MessagePayload`

All services that import `from '@gaqno-development/backcore'` and use `KafkaProducer` / `KafkaConsumer` will need their imports and constructor parameter names updated.

---

## 5. Injection tokens containing "Kafka"

| Token Name | File | Suggested New Name |
|------------|------|-------------------|
| `WEBHOOKS_KAFKA_CONSUMER` | `gaqno-crm-service/src/webhooks/webhooks-delivery.consumer.ts` | `WEBHOOKS_MESSAGE_CONSUMER` |
| `FLOW_KAFKA_CONSUMER_TOKEN` | `gaqno-omnichannel-service/src/flows/flow-execution-consumer.module.ts` | `FLOW_MESSAGE_CONSUMER_TOKEN` |

---

## 6. Documentation files (.md) mentioning "Kafka" or "kafka"

| File | Context / Suggested Update |
|------|---------------------------|
| `docs/INVESTOR-PITCH-FLOW.md` | "Lead enrichment: Serviço assíncrono (Kafka + Pipedrive)" → "BullMQ/Redis + Pipedrive" or "message broker + Pipedrive"; "Integração Pipedrive + Kafka" → "Integração Pipedrive + message broker" |
| `@gaqno-agent/openclaw-config/workspace/memory/2026-02-20.md` | "5 serviços (kafka, pgadmin...)" → "5 serviços (redis, pgadmin...)" or "message broker" |
| `scripts/n8n-workflows/README.md` | "subscribes to Kafka domain events" → "subscribes to BullMQ/domain events" or "message broker domain events" |
| `docs/coverage-gaps-plan.md` | "kafka module" → "messaging module" |
| `docs/event-driven-review.md` | Multiple references to Kafka paths, KafkaProducer, Kafka consumer, Kafka healthcheck, Kafka indisponível → update to BullMQ/message broker terminology |
| `docs/event-driven-comercial-finance.md` | "KafkaProducer", "fila comercial.events__finance", "KafkaProducer.publishIntegrationEvent" → MessageProducer, message queue, MessageProducer.publishIntegrationEvent |
| `scripts/README.md` | Documents `coolify-remove-kafka.mjs` — update to reflect script purpose (Kafka → BullMQ migration); or rename script to `coolify-migrate-messaging-env.mjs` |
| `docs/TIKTOK-CONTENT-POSTING-ANALYSIS.md` | "Kafka", "Kafka topics", "payload Kafka" → "BullMQ" or "message broker", "message topics", "message payload" |
| `.github/README.md` | "@gaqno-backcore ... Kafka" → "messaging" or "BullMQ" |
| `docs/external-repos.md` | "event/Kafka consumer" → "event/message consumer" |
| `docs/architecture-ddd.md` | "Publishes customer.created/updated via Kafka" → "via BullMQ" or "via message broker" |

---

## 7. Scripts (.mjs, .sh) mentioning "kafka"

| File | Context / Suggested Update |
|------|---------------------------|
| `scripts/coolify-remove-kafka.mjs` | Script removes KAFKA_* env vars. **Rename to:** `coolify-migrate-messaging-env.mjs` or keep name if it describes the migration. Update internal references: `KAFKA_KEYS` → `LEGACY_MESSAGING_KEYS` (optional). Update usage/help text from "Kafka" to "legacy Kafka env vars" for clarity. |

**No `.sh` files** in the workspace contain "kafka".

---

## 8. Config files (.json, .yml) mentioning "kafka"

| File | Context / Suggested Update |
|------|---------------------------|
| `gaqno-ai-service/package.json` | Line 130: `"!**/kafka/**"` in Jest `coveragePathIgnorePatterns` → `"!**/messaging/**"` |

**Note:** `package-lock.json` was excluded per your instructions. No `docker-compose` files in the workspace root contain "kafka" in the current search.

---

## 9. Variable/parameter names in code (local renames)

These are **constructor parameters** and **local variables** that use "kafka" in their names. Consider renaming for consistency:

| Current Name | Suggested Name | Typical Usage |
|-------------|----------------|---------------|
| `kafka: KafkaProducer` (in useFactory) | `producer: MessageProducer` | OutboxProcessorService factory |
| `kafkaConsumer` | `messageConsumer` | Constructor params in consumers |
| `kafkaProducer` | `messageProducer` | Constructor params in publishers |
| `kafkaPublish` (test mock) | `publishMock` or `messagePublish` | Jest mocks in specs |
| `kafkaSubscribe` (test mock) | `subscribeMock` or `messageSubscribe` | Jest mocks in specs |
| `kafkaConnect`, `kafkaSubscribeMany`, `kafkaDisconnect` | `connectMock`, `subscribeManyMock`, `disconnectMock` | Jest mocks in webhooks-delivery.consumer.spec |

---

## 10. Error messages / string literals

| Location | Current Text | Suggested Text |
|----------|-------------|----------------|
| `gaqno-erp-service/src/orders/orders.service.spec.ts` | "kafka down", "kafka error" | "message broker down", "message broker error" |
| `gaqno-ai-service/src/event-store/outbox-processor.service.spec.ts` | "kafka down", "kafka-unavailable" | "message broker down", "message-broker-unavailable" |
| `@gaqno-backcore/__tests__/kafka/outbox-processor.service.spec.ts` | `new Error('kafka')` | `new Error('message broker')` |

---

## Summary: Rename priority order

1. **@gaqno-backcore** (shared package): Rename `src/kafka/` → `src/messaging/`, `kafka-producer.ts` → `message-producer.ts`, `kafka-consumer.ts` → `message-consumer.ts`, and class/interface names. Bump backcore version.
2. **All service `kafka/` folders** → `messaging/`, `kafka.module.ts` → `messaging.module.ts`, `KafkaModule` → `MessagingModule`.
3. **Injection tokens**: `WEBHOOKS_KAFKA_CONSUMER` → `WEBHOOKS_MESSAGE_CONSUMER`, `FLOW_KAFKA_CONSUMER_TOKEN` → `FLOW_MESSAGE_CONSUMER_TOKEN`.
4. **gaqno-lead-enrichment-service**: `KafkaMessagePayload` → `MessagePayload`.
5. **Config**: `gaqno-ai-service/package.json` coverage ignore pattern.
6. **Script**: Rename `coolify-remove-kafka.mjs` if desired.
7. **Documentation**: Update all .md files per section 6.
8. **Test mocks and variable names**: Optional cleanup in specs.

---

*Generated: 2025-03-14*

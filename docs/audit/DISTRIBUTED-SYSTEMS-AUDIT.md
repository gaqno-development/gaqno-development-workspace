# Distributed Systems Audit — Backcore + AI Service

**Scope:** @gaqno-development/backcore, gaqno-ai-service (ai-task module).  
**Assumption:** 10k concurrent users. No sugarcoating.

---

## PHASE 1 — Structural Verification

| Check | Status | Notes |
|-------|--------|--------|
| Every command includes orgId | **PASS** | CommandWithContext carries OrgContext; handler uses context.orgId. |
| orgId enforced at DB level (composite keys or RLS) | **FAIL** | Events table has unique on (aggregateId, version) only. No RLS. Queries filter by orgId in app only; a bug or SQL injection could bypass. |
| Event Store encrypts sensitive payload fields | **PASS** | EventRepository encrypts payload with EncryptionService before insert; DB stores ciphertext. |
| Kafka publisher uses Outbox pattern transactionally | **FAIL** | Handler does: append to event store, then publish to Kafka. If Kafka fails after commit, event is in DB but not in Kafka. No transactional outbox. |
| Consumers are idempotent | **N/A (no consumer)** | No domain-event consumer in ai-service. When consumers are added, no idempotency key or dedupe implemented in backcore. |
| No service calls external APIs synchronously in command handlers | **PASS** | CreateAiTaskHandler does not call XSkillClient or any external API. |
| Read model never writes to event store | **N/A** | No read model/projection wired in ai-service for ai-task. apps/projection-service exists elsewhere. |
| Billing is event-driven only | **FAIL** | Billing (CreditPolicy/Ledger) is not wired to events. No consumer subscribes to task events to reserve/consume/refund. LedgerStore is interface only; no concrete implementation in backcore. |

### Violations and Required Fixes

**V1 — DB-level org isolation**

- **Fix:** Add Postgres RLS on `events` so rows are visible only when `current_setting('app.org_id') = org_id`. Apply same for ledger table when implemented. Use a migration (raw SQL).
- **Regression test:** Query events with wrong org_id setting returns zero rows.

**V2 — Transactional Outbox for Kafka**

- **Fix:** Introduce an `outbox` table. In a single transaction: (1) append event to `events`, (2) insert into `outbox` (topic, payload, org_id, aggregate_id). Background job or CDC reads outbox and publishes to Kafka, then marks published. Remove direct Kafka publish from command handler.
- **Regression test:** Kill Kafka after event commit; restart Kafka and outbox processor; verify event appears on topic.

**V3 — Billing event-driven**

- **Fix:** Implement LedgerStore (e.g. Postgres table). Add a Kafka consumer that subscribes to ai.events (or billing.events), parses task-completed/failed, and calls CreditPolicy.consumeCredits / refundCredits. No direct billing calls from command handler.
- **Regression test:** Publish mock task event; assert ledger entry and balance change.

**V4 — Consumer idempotency (when consumers exist)**

- **Fix:** Consumers must use eventId (or aggregateId+version) as idempotency key; skip or dedupe duplicate delivery before applying.
- **Regression test:** Deliver same message twice; state or side effect applied once.

---

## PHASE 2 — Multi-Tenant Isolation

- **orgA cannot query orgB projections:** Not testable until read model exists; when present, all queries must be scoped by orgId and tested.
- **orgA Kafka events never leak to orgB consumer scope:** Kafka message key is orgId; consumer must filter or use org-scoped topics. No consumer in ai-service yet; when added, add test that consumes as orgB and never sees orgA event payload.
- **Org balance calculations isolated:** CreditPolicy.getBalance(orgId) and ledger getByOrg(orgId) are scoped. LedgerStore is interface only — once implemented, test: allocate to orgA, verify orgB balance unchanged.
- **Encryption keys differ per org:** EncryptionService.deriveKey(orgId) uses HKDF with orgId; decrypt with wrong orgId must throw. **Test added** (see Phase 3).
- **Decrypting orgA event with orgB key fails:** **Test added** in encryption validation.

---

## PHASE 3 — Event Encryption

- **Sensitive fields not readable in Event Store raw DB:** **PASS** — payload column is ciphertext.
- **Sensitive fields not readable in Kafka raw payload:** **FAIL** — Handler publishes `payload: JSON.stringify(event.payload)` (plaintext). Kafka message value is not encrypted.
- **Decryption only inside allowed service:** Enforced by design (only services with EncryptionService and orgId can decrypt). No test yet.
- **Key rotation does not break old events:** Not implemented. Rotating master key would require versioned DEK or re-encryption job.
- **Compromised DEK of one org does not affect others:** DEK is derived per orgId; one org compromise does not expose others. **Test added.**

---

## PHASE 4 — Concurrency and Race Conditions

- **50 simultaneous AI task creations (same org):** No optimistic locking on a “task count” or global sequence; event store uses (aggregateId, version) per aggregate. So 50 different aggregateIds = 50 appends; safe. If same aggregateId were used, unique constraint would catch duplicate version.
- **50 simultaneous across 5 orgs:** Same; isolation by orgId in queries.
- **Billing events out of order:** Ledger is append-only; balance is computed from full list. Out-of-order consume/refund would yield wrong balance unless entries are ordered by a sequence or timestamp and applied in order. **Risk:** no ordering guarantee in LedgerStore.getByOrg.
- **Duplicate Kafka delivery:** No idempotency in consumer (no consumer). When added, must dedupe.
- **Kafka rebalance during processing:** Not tested. At 10k users, rebalances will occur; consumer must commit offset after idempotent processing.
- **Double billing / negative balance:** CreditPolicy checks available before reserve but not in a transaction with append; race can allow over-reserve. **Fix:** ledger append in transaction with balance read, or use DB constraint.
- **Event versioning prevents race overwrite:** **PASS** — unique (aggregateId, version); loadFromHistory applies in order; expectVersion in aggregate.

**Stress test:** Script added at `gaqno-ai-service/scripts/audit-stress-concurrency.sh`. Run: `./scripts/audit-stress-concurrency.sh [BASE_URL] [ORG_ID]` (default 50 concurrent POSTs). Manually verify event count and no duplicate aggregateId+version.

---

## PHASE 5 — Kafka Failure Simulation

- **Kafka temporarily unavailable:** Current code: publish() after append. If Kafka is down, publish throws; event is already committed. **Lose events.** Outbox fix (V2) addresses this.
- **Consumer crash mid-processing:** No consumer.
- **DLQ routing:** TopicRegistry has TOPIC_DLQ; KafkaConsumer has subscribeToDlq. No producer-side retry or automatic DLQ routing in backcore.
- **Poison message:** No retry/backoff or DLQ on consumer side.
- **Outbox does not lose events:** **FAIL** until outbox implemented.
- **Retries with backoff:** Not implemented in producer or consumer.
- **System recovers automatically:** No automated retry; manual redeploy or restart.

**Test harness:** Add integration test that brings up Kafka, publishes, then stops Kafka and asserts outbox (or current behavior) and recovery after restart.

---

## PHASE 6 — XSkill Integration

- XSkillClient is not used in CreateAiTaskHandler (correct). When used elsewhere (e.g. async processor), need: timeout, 500 handling, partial/slow/invalid response, circuit breaker, retry, billing only on success, task marked failed, no infinite retry. **Not implemented** in XSkillClient (no circuit breaker, no retry config). **Tests added** as mock-based validation.

---

## PHASE 7 — Read Model Consistency

- No projection for ai-task in ai-service. apps/projection-service has migrations. **Verdict:** N/A for ai-service; when projection exists, add test: replay events from event store, rebuild projection, compare to current state.

---

## PHASE 8 — Deployment (Coolify)

- **All services boot with env only:** **PASS** — Ai-task module uses ConfigService for ENCRYPTION_MASTER_KEY, KAFKA_BROKERS, DATABASE_URL.
- **No hardcoded localhost:** **WEAK** — KAFKA_BROKERS default is `localhost:9092` in ai-task.module. In Coolify, env must set KAFKA_BROKERS; no localhost in prod if env set.
- **Kafka uses internal network name:** **PASS** in docker-compose (kafka:29092).
- **Healthcheck endpoints exist:** **WEAK** — No /health or /v1/health route; compose uses wget to /v1 (may 404). Add explicit health endpoint.
- **Graceful shutdown:** **WEAK** — NestJS closes on SIGTERM; ai-task.module disconnects Kafka in onModuleDestroy. main.ts does not call enableShutdownHooks(); add it for reliable cleanup.
- **Docker exit cleanly:** stop_grace_period: 30s set; add enableShutdownHooks in main.

---

## PHASE 9 — Security

- **No secret in logs:** Not audited; ensure ENCRYPTION_MASTER_KEY and tokens never logged.
- **No decrypted payload persisted:** Event store stores ciphertext; Kafka currently stores plaintext payload — **FAIL**.
- **JWT validation enforced everywhere:** **FAIL** — OrgGuard only reads x-org-id header. No JWT validation in ai-service; orgId can be spoofed by client. API Gateway must validate JWT and set x-org-id; ai-service must not be exposed directly to clients.
- **orgId cannot be injected manually:** **FAIL** — Anyone can send x-org-id. Mitigation: only API Gateway talks to ai-service; Gateway sets org from JWT.
- **Rate limit per org:** Not implemented in backcore or ai-service.

---

## PHASE 10 — Final System Verdict

### Production ready

- Event store schema and encryption at rest (payload encrypted in DB).
- Command handler does not call external APIs; orgId flows through context.
- Aggregate versioning and unique constraint prevent duplicate version per aggregate.
- Encryption keys derived per org (HKDF + orgId); one org key compromise does not expose others.
- Ledger design (append-only, balance from calculation) is sound once implemented and event-driven.

### Risky

- **Kafka payload plaintext** — Any service with topic access can read task payloads. Encrypt Kafka payload with per-org key or use encrypted envelope.
- **No RLS** — Application-layer orgId filtering only; one bug or injection can leak cross-tenant data.
- **No idempotency** — Duplicate client requests create duplicate events; no idempotency key in ai-task controller.
- **Billing not event-driven** — If billing is added synchronously in handlers, double-charge or inconsistency under load.
- **Graceful shutdown** — enableShutdownHooks() not called; possible connection leaks on scale-down.

### Will break at scale (10k users)

- **No transactional outbox** — Kafka unavailability or backpressure will cause lost events or handler failures after DB commit.
- **Consumer not idempotent** — Duplicate Kafka delivery will double-apply (e.g. double billing, duplicate projection).
- **orgId from header only** — If ai-service is ever exposed without Gateway, tenants can impersonate each other.
- **No rate limit per org** — One org can DoS the service; no fairness.

### Required fixes before launch

1. **Transactional outbox** for Kafka (single transaction: events + outbox; processor publishes and marks done).
2. **Encrypt Kafka message value** (or move sensitive data to encrypted envelope; consumers decrypt by orgId).
3. **RLS on events (and ledger)** so DB enforces org isolation.
4. **JWT validation at Gateway** and Gateway sets x-org-id from token; ai-service must not be public.
5. **Idempotency** for create-task (e.g. x-idempotency-key header + store recent keys or use eventId in consumer).
6. **Event-driven billing** — Consumer for task events → CreditPolicy; no billing in command handler.
7. **Health endpoint** — e.g. GET /v1/health returning 200.
8. **enableShutdownHooks()** in main.ts for NestJS.
9. **Rate limiting per org** (e.g. at Gateway or in Guard).

---

## Automated Tests Added

| Phase | Location | Description |
|-------|----------|-------------|
| 2 / 3 | `gaqno-ai-service/test/audit/multitenant-isolation.e2e-spec.ts` | orgA/orgB encryption isolation, balance isolation |
| 3 | `gaqno-ai-service/test/audit/encryption-validation.e2e-spec.ts` | Raw cipher not readable, decrypt only with correct orgId, DEK isolation |
| 4 | `gaqno-ai-service/scripts/audit-stress-concurrency.sh` | 50 concurrent create-task (manual) |
| 6 | `gaqno-ai-service/test/audit/xskill-integration.e2e-spec.ts` | XSkillClient instantiation and config |
| 8 | `gaqno-ai-service/test/audit/deployment-validation.e2e-spec.ts` | Env vars (KAFKA_BROKERS, required names) |
| 9 | `gaqno-ai-service/test/audit/security.e2e-spec.ts` | No hardcoded secrets in src/ |
| 1 | `gaqno-ai-service/test/audit/structural-verification.e2e-spec.ts` | Domain event and command include orgId |
| - | `@gaqno-backcore/__tests__/encryption.service.spec.ts` | Encryption round-trip, wrong org throws, DEK isolation |
| - | `@gaqno-backcore/__tests__/ledger.spec.ts` | calculateBalance correctness, out-of-order entries |

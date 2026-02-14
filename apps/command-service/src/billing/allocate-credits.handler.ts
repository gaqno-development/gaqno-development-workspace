import { Injectable } from '@nestjs/common';
import { EventStoreRepository } from '@gaqno-ai-platform/event-store';
import { KafkaProducerService } from '@gaqno-ai-platform/kafka';
import {
  AGGREGATE_TYPES,
  BILLING_EVENT_TYPES,
  type EncryptedPayload,
  type PersistedEventEnvelope,
} from '@gaqno-ai-platform/shared-kernel';
import { buildCreditsAllocatedEvent } from '@gaqno-ai-platform/billing';
import { EncryptionService } from '@gaqno-ai-platform/encryption';

@Injectable()
export class AllocateCreditsHandler {
  constructor(
    private readonly eventStore: EventStoreRepository,
    private readonly kafka: KafkaProducerService,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(orgId: string, amount: number): Promise<{ ok: boolean }> {
    const aggregateId = orgId;
    const event = buildCreditsAllocatedEvent(
      { orgId, aggregateId, amount },
      0,
    );
    const stored = await this.eventStore.append({
      aggregateId,
      aggregateType: AGGREGATE_TYPES.ORGANIZATION_BILLING,
      orgId,
      eventType: event.eventType,
      version: event.version,
      payload: event.payload,
    });
    const encrypted: EncryptedPayload = this.encryption.encrypt(
      Buffer.from(JSON.stringify(stored.payload), 'utf8'),
      orgId,
    );
    const envelope: PersistedEventEnvelope = {
      eventId: stored.eventId,
      aggregateId: stored.aggregateId,
      orgId: stored.orgId,
      aggregateType: stored.aggregateType,
      eventType: stored.eventType,
      version: stored.version,
      payload: encrypted,
      occurredAt: stored.occurredAt,
    };
    await this.kafka.publishBillingEvent(envelope);
    return { ok: true };
  }
}

import { Injectable } from '@nestjs/common';
import { KafkaProducerService } from '@gaqno-ai-platform/kafka';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import {
  AGGREGATE_TYPES,
  AI_EVENT_TYPES,
  type PersistedEventEnvelope,
  type EncryptedPayload,
} from '@gaqno-ai-platform/shared-kernel';
import { randomUUID } from 'crypto';

@Injectable()
export class AiProcessorEmitter {
  constructor(
    private readonly kafka: KafkaProducerService,
    private readonly encryption: EncryptionService,
  ) {}

  async emitCompleted(
    aggregateId: string,
    orgId: string,
    _previousEventId: string,
    previousVersion: number,
    payload: { taskId: string; result: string | Record<string, unknown>; mediaUrls?: string[] },
  ): Promise<void> {
    const version = previousVersion + 1;
    const envelope = this.buildEnvelope(
      aggregateId,
      orgId,
      AI_EVENT_TYPES.AI_TASK_COMPLETED,
      version,
      payload,
    );
    await this.kafka.publishAiEvent(envelope);
  }

  async emitFailed(
    aggregateId: string,
    orgId: string,
    _previousEventId: string,
    previousVersion: number,
    payload: { taskId: string; reason: string; code?: string },
  ): Promise<void> {
    const version = previousVersion + 1;
    const envelope = this.buildEnvelope(
      aggregateId,
      orgId,
      AI_EVENT_TYPES.AI_TASK_FAILED,
      version,
      payload,
    );
    await this.kafka.publishAiEvent(envelope);
  }

  async emitTimedOut(
    aggregateId: string,
    orgId: string,
    _previousEventId: string,
    previousVersion: number,
    payload: { taskId: string },
  ): Promise<void> {
    const version = previousVersion + 1;
    const envelope = this.buildEnvelope(
      aggregateId,
      orgId,
      AI_EVENT_TYPES.AI_TASK_TIMED_OUT,
      version,
      payload,
    );
    await this.kafka.publishAiEvent(envelope);
  }

  private buildEnvelope(
    aggregateId: string,
    orgId: string,
    eventType: string,
    version: number,
    payload: unknown,
  ): PersistedEventEnvelope {
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    const encrypted: EncryptedPayload = this.encryption.encrypt(plaintext, orgId);
    return {
      eventId: randomUUID(),
      aggregateId,
      orgId,
      aggregateType: AGGREGATE_TYPES.AI_TASK,
      eventType,
      version,
      payload: encrypted,
      occurredAt: new Date().toISOString(),
    };
  }
}

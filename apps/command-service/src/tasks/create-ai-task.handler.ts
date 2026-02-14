import { Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventStoreRepository } from '@gaqno-ai-platform/event-store';
import { KafkaProducerService } from '@gaqno-ai-platform/kafka';
import { AiTaskAggregate } from '@gaqno-ai-platform/domain';
import {
  AGGREGATE_TYPES,
  AI_EVENT_TYPES,
  type PersistedEventEnvelope,
  type EncryptedPayload,
} from '@gaqno-ai-platform/shared-kernel';
import {
  buildCreditsReservedEvent,
  type ReserveCreditsInput,
} from '@gaqno-ai-platform/billing';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import {
  OrganizationBillingAggregate,
  type BillingEventPayload,
} from '@gaqno-ai-platform/domain';

export interface CreateAiTaskCommand {
  orgId: string;
  userId: string;
  prompt: string;
  model?: string;
  creditsRequired: number;
  idempotencyKey?: string;
  correlationId?: string;
}

const IDEMPOTENCY_TTL_MS = 86_400_000;

@Injectable()
export class CreateAiTaskHandler {
  private readonly idempotencyCache = new Map<
    string,
    { taskId: string; status: string; at: number }
  >();

  constructor(
    private readonly eventStore: EventStoreRepository,
    private readonly kafka: KafkaProducerService,
    private readonly encryption: EncryptionService,
  ) {}

  async execute(cmd: CreateAiTaskCommand): Promise<{ taskId: string; status: string }> {
    if (cmd.idempotencyKey) {
      const cached = this.idempotencyCache.get(cmd.idempotencyKey);
      if (cached && Date.now() - cached.at < IDEMPOTENCY_TTL_MS) {
        return { taskId: cached.taskId, status: cached.status };
      }
    }

    const taskId = randomUUID();
    const aggregate = new AiTaskAggregate(taskId, []);
    const createEvent = aggregate.create(
      cmd.prompt,
      cmd.creditsRequired,
      cmd.model,
    );
    if (!createEvent) {
      throw new ConflictException('AiTask already created');
    }

    const billingAggregateId = cmd.orgId;
    const billingEvents = await this.eventStore.getByOrg(cmd.orgId, {
      aggregateType: AGGREGATE_TYPES.ORGANIZATION_BILLING,
      limit: 1000,
    });
    const billingAggregate = new OrganizationBillingAggregate(
      cmd.orgId,
      billingEvents.map((e) => ({
        eventType: e.eventType,
        payload: e.payload as BillingEventPayload,
      })),
    );
    if (!billingAggregate.canReserve(cmd.creditsRequired)) {
      throw new ConflictException('Insufficient credits');
    }

    const version = 1;
    const stored = await this.eventStore.append({
      aggregateId: taskId,
      aggregateType: AGGREGATE_TYPES.AI_TASK,
      orgId: cmd.orgId,
      eventType: AI_EVENT_TYPES.AI_TASK_CREATED,
      version,
      payload: createEvent.payload,
    });

    const encryptedPayload = this.encryptPayloadForKafka(stored.payload, cmd.orgId);
    const envelope: PersistedEventEnvelope = {
      eventId: stored.eventId,
      aggregateId: stored.aggregateId,
      orgId: stored.orgId,
      aggregateType: stored.aggregateType,
      eventType: stored.eventType,
      version: stored.version,
      payload: encryptedPayload,
      occurredAt: stored.occurredAt,
    };
    await this.kafka.publishAiEvent(envelope);

    const reserveInput: ReserveCreditsInput = {
      orgId: cmd.orgId,
      aggregateId: billingAggregateId,
      amount: cmd.creditsRequired,
      taskId,
    };
    const billingVersion = billingAggregate.getVersion();
    const creditsReservedEvent = buildCreditsReservedEvent(
      reserveInput,
      billingVersion,
    );
    const billingStored = await this.eventStore.append({
      aggregateId: billingAggregateId,
      aggregateType: AGGREGATE_TYPES.ORGANIZATION_BILLING,
      orgId: cmd.orgId,
      eventType: creditsReservedEvent.eventType,
      version: creditsReservedEvent.version,
      payload: creditsReservedEvent.payload,
    });
    const billingEncrypted = this.encryptPayloadForKafka(
      billingStored.payload,
      cmd.orgId,
    );
    const billingEnvelope: PersistedEventEnvelope = {
      eventId: billingStored.eventId,
      aggregateId: billingStored.aggregateId,
      orgId: billingStored.orgId,
      aggregateType: billingStored.aggregateType,
      eventType: billingStored.eventType,
      version: billingStored.version,
      payload: billingEncrypted,
      occurredAt: billingStored.occurredAt,
    };
    await this.kafka.publishBillingEvent(billingEnvelope);

    if (cmd.idempotencyKey) {
      this.idempotencyCache.set(cmd.idempotencyKey, {
        taskId,
        status: 'CREATED',
        at: Date.now(),
      });
    }

    return { taskId, status: 'CREATED' };
  }

  private encryptPayloadForKafka(
    payload: unknown,
    orgId: string,
  ): EncryptedPayload {
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    return this.encryption.encrypt(plaintext, orgId);
  }
}

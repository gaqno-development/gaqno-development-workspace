import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { KafkaConsumerService } from '@gaqno-ai-platform/kafka';
import type { KafkaConfig } from '@gaqno-ai-platform/kafka';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import { AI_EVENT_TYPES, BILLING_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';
import type { PersistedEventEnvelope } from '@gaqno-ai-platform/shared-kernel';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  aiTaskProjectionTable,
  organizationBalanceProjectionTable,
} from '../database/schema';
import { ProjectionGateway } from './projection.gateway';

@Injectable()
export class ProjectionConsumer implements OnModuleInit {
  constructor(
    private readonly kafka: KafkaConsumerService,
    private readonly encryption: EncryptionService,
    @Inject('DB') private readonly db: NodePgDatabase,
    @Inject('KAFKA_CONFIG') private readonly kafkaConfig: KafkaConfig,
    private readonly gateway: ProjectionGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    const { aiEvents, billingEvents } = this.kafkaConfig.topics;
    await this.kafka.subscribeToMultipleTopics({
      [aiEvents]: (e) => this.handleAiEvent(e),
      [billingEvents]: (e) => this.handleBillingEvent(e),
    });
  }

  private async handleAiEvent(envelope: PersistedEventEnvelope): Promise<void> {
    const plaintext = this.encryption.decrypt(envelope.payload, envelope.orgId);
    const payload = JSON.parse(plaintext.toString('utf8')) as Record<string, unknown>;
    const taskId = envelope.aggregateId;

    if (envelope.eventType === AI_EVENT_TYPES.AI_TASK_CREATED) {
      await this.db.insert(aiTaskProjectionTable).values({
        taskId,
        orgId: envelope.orgId,
        state: 'CREATED',
      }).onConflictDoUpdate({
        target: aiTaskProjectionTable.taskId,
        set: { state: 'CREATED', updatedAt: new Date() },
      });
    } else if (
      envelope.eventType === AI_EVENT_TYPES.AI_TASK_COMPLETED ||
      envelope.eventType === AI_EVENT_TYPES.AI_TASK_FAILED ||
      envelope.eventType === AI_EVENT_TYPES.AI_TASK_TIMED_OUT
    ) {
      const state =
        envelope.eventType === AI_EVENT_TYPES.AI_TASK_COMPLETED
          ? 'COMPLETED'
          : envelope.eventType === AI_EVENT_TYPES.AI_TASK_FAILED
            ? 'FAILED'
            : 'TIMED_OUT';
      await this.db
        .update(aiTaskProjectionTable)
        .set({ state, updatedAt: new Date() })
        .where(eq(aiTaskProjectionTable.taskId, taskId));
    }

    this.gateway.emitToOrg(envelope.orgId, {
      type: envelope.eventType,
      taskId,
      payload: { taskId, ...payload },
    });
  }

  private async handleBillingEvent(
    envelope: PersistedEventEnvelope,
  ): Promise<void> {
    const plaintext = this.encryption.decrypt(envelope.payload, envelope.orgId);
    const payload = JSON.parse(plaintext.toString('utf8')) as {
      amount?: number;
      taskId?: string;
      orgId?: string;
    };
    const orgId = envelope.orgId;
    const amount = payload.amount ?? 0;

    const [existing] = await this.db
      .select()
      .from(organizationBalanceProjectionTable)
      .where(eq(organizationBalanceProjectionTable.orgId, orgId))
      .limit(1);

    const row = existing ?? {
      orgId,
      available: 0,
      reserved: 0,
      consumed: 0,
      refunded: 0,
      updatedAt: new Date(),
    };

    let available = row.available;
    let reserved = row.reserved;
    let consumed = row.consumed;
    let refunded = row.refunded;

    if (envelope.eventType === BILLING_EVENT_TYPES.CREDITS_ALLOCATED) {
      available += amount;
    } else if (envelope.eventType === BILLING_EVENT_TYPES.CREDITS_RESERVED) {
      available -= amount;
      reserved += amount;
    } else if (envelope.eventType === BILLING_EVENT_TYPES.CREDITS_CONSUMED) {
      reserved -= amount;
      consumed += amount;
    } else if (envelope.eventType === BILLING_EVENT_TYPES.CREDITS_REFUNDED) {
      reserved -= amount;
      available += amount;
      refunded += amount;
    }

    await this.db
      .insert(organizationBalanceProjectionTable)
      .values({
        orgId,
        available,
        reserved,
        consumed,
        refunded,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: organizationBalanceProjectionTable.orgId,
        set: {
          available,
          reserved,
          consumed,
          refunded,
          updatedAt: new Date(),
        },
      });

    this.gateway.emitToOrg(orgId, {
      type: envelope.eventType,
      balance: { available, reserved, consumed, refunded },
    });
  }
}

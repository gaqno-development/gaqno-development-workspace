import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '@gaqno-ai-platform/kafka';
import { EncryptionService } from '@gaqno-ai-platform/encryption';
import { AI_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';
import type { PersistedEventEnvelope } from '@gaqno-ai-platform/shared-kernel';
import type { AiTaskCreatedPayload } from '@gaqno-ai-platform/domain';
import { XSkillClient } from '../xskill/xskill.client';
import { AiProcessorEmitter } from './ai-processor.emitter';

@Injectable()
export class AiProcessorConsumer implements OnModuleInit {
  constructor(
    private readonly kafka: KafkaConsumerService,
    private readonly encryption: EncryptionService,
    private readonly xskill: XSkillClient,
    private readonly emitter: AiProcessorEmitter,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafka.subscribeToAiEvents((envelope) =>
      this.handleMessage(envelope),
    );
  }

  private async handleMessage(envelope: PersistedEventEnvelope): Promise<void> {
    if (envelope.eventType !== AI_EVENT_TYPES.AI_TASK_CREATED) {
      return;
    }
    const plaintext = this.encryption.decrypt(envelope.payload, envelope.orgId);
    const payload = JSON.parse(plaintext.toString('utf8')) as AiTaskCreatedPayload;
    try {
      const createResponse = await this.xskill.createTask({
        prompt: payload.prompt,
        model: payload.model,
        options: payload.options,
      });
      const externalTaskId = (createResponse as { taskId?: string }).taskId ?? (createResponse as { taskId: string }).taskId;
      const queryResult = await this.xskill.pollUntilDone(externalTaskId);
      if (queryResult.status === 'completed') {
        await this.emitter.emitCompleted(
          envelope.aggregateId,
          envelope.orgId,
          envelope.eventId,
          envelope.version,
          {
            taskId: payload.taskId,
            result: queryResult.result ?? '',
            mediaUrls: queryResult.mediaUrls,
          },
        );
      } else {
        await this.emitter.emitFailed(
          envelope.aggregateId,
          envelope.orgId,
          envelope.eventId,
          envelope.version,
          {
            taskId: payload.taskId,
            reason: queryResult.error ?? 'Unknown failure',
            code: queryResult.code,
          },
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTimeout = message.includes('timed out') || message.includes('5 minutes');
      if (isTimeout) {
        await this.emitter.emitTimedOut(
          envelope.aggregateId,
          envelope.orgId,
          envelope.eventId,
          envelope.version,
          { taskId: payload.taskId },
        );
      } else {
        await this.emitter.emitFailed(
          envelope.aggregateId,
          envelope.orgId,
          envelope.eventId,
          envelope.version,
          {
            taskId: payload.taskId,
            reason: message,
          },
        );
      }
    }
  }
}

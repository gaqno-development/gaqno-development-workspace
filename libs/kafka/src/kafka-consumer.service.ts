import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, type Consumer, type EachMessagePayload } from 'kafkajs';
import type { PersistedEventEnvelope } from '@gaqno-ai-platform/shared-kernel';
import type { KafkaConfig } from './kafka.config';

export type MessageHandler = (envelope: PersistedEventEnvelope) => Promise<void>;

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka | null = null;
  private consumer: Consumer | null = null;
  private readonly topicHandlers = new Map<string, MessageHandler>();
  private runStarted = false;

  constructor(@Inject('KAFKA_CONFIG') private readonly config: KafkaConfig) {}

  async onModuleInit(): Promise<void> {
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
    });
    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID ?? 'gaqno-ai-platform-consumer',
    });
    await this.consumer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
    this.kafka = null;
  }

  async subscribeToAiEvents(handler: MessageHandler): Promise<void> {
    await this.subscribe(this.config.topics.aiEvents, handler);
  }

  async subscribeToBillingEvents(handler: MessageHandler): Promise<void> {
    await this.subscribe(this.config.topics.billingEvents, handler);
  }

  async subscribeToProjectionEvents(handler: MessageHandler): Promise<void> {
    await this.subscribe(this.config.topics.projectionEvents, handler);
  }

  async subscribeToMultipleTopics(
    topicToHandler: Record<string, MessageHandler>,
  ): Promise<void> {
    if (!this.consumer) throw new Error('Kafka consumer not initialized');
    for (const [topic, handler] of Object.entries(topicToHandler)) {
      this.topicHandlers.set(topic, handler);
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
    await this.ensureRun();
  }

  private async subscribe(
    topic: string,
    handler: MessageHandler,
  ): Promise<void> {
    if (!this.consumer) throw new Error('Kafka consumer not initialized');
    this.topicHandlers.set(topic, handler);
    await this.consumer.subscribe({ topic, fromBeginning: false });
    await this.ensureRun();
  }

  private async ensureRun(): Promise<void> {
    if (this.runStarted) return;
    this.runStarted = true;
    if (!this.consumer) return;
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const value = payload.message.value?.toString();
        if (!value) return;
        const handler = payload.topic ? this.topicHandlers.get(payload.topic) : undefined;
        if (!handler) return;
        try {
          const envelope = JSON.parse(value) as PersistedEventEnvelope;
          await handler(envelope);
        } catch (err) {
          throw err;
        }
      },
    });
  }
}

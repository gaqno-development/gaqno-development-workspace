import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, type Producer, type ProducerRecord } from 'kafkajs';
import type { PersistedEventEnvelope } from '@gaqno-ai-platform/shared-kernel';
import type { KafkaConfig } from './kafka.config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;

  constructor(@Inject('KAFKA_CONFIG') private readonly config: KafkaConfig) {}

  async onModuleInit(): Promise<void> {
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
    });
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
    this.kafka = null;
  }

  async publishAiEvent(envelope: PersistedEventEnvelope): Promise<void> {
    await this.publish(this.config.topics.aiEvents, envelope);
  }

  async publishBillingEvent(envelope: PersistedEventEnvelope): Promise<void> {
    await this.publish(this.config.topics.billingEvents, envelope);
  }

  async publishProjectionEvent(envelope: PersistedEventEnvelope): Promise<void> {
    await this.publish(this.config.topics.projectionEvents, envelope);
  }

  private async publish(
    topic: string,
    envelope: PersistedEventEnvelope,
  ): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not initialized');
    const record: ProducerRecord = {
      topic,
      messages: [
        {
          key: envelope.orgId,
          value: JSON.stringify(envelope),
          headers: {
            eventType: envelope.eventType,
            aggregateId: envelope.aggregateId,
          },
        },
      ],
    };
    await this.producer.send(record);
  }
}

import { Kafka, type Producer, type ProducerRecord } from 'kafkajs';
import type { TopicRegistry } from './topic-registry';

export interface KafkaProducerConfig {
  brokers: string[];
  clientId: string;
  topics: TopicRegistry;
  connectionTimeout?: number;
  retries?: number;
}

export interface PublishEnvelope {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  payload: string;
  occurredAt: string;
}

export class KafkaProducer {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;

  constructor(private readonly config: KafkaProducerConfig) {}

  async connect(): Promise<void> {
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      connectionTimeout: this.config.connectionTimeout ?? 3_000,
      retry: {
        retries: this.config.retries ?? 3,
        initialRetryTime: 300,
        maxRetryTime: 5_000,
      },
    });
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
    this.kafka = null;
  }

  async publish(topic: string, envelope: PublishEnvelope, correlationId?: string): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    const headers: Record<string, string> = {
      eventType: envelope.eventType,
      aggregateId: envelope.aggregateId,
    };
    if (correlationId) headers['x-correlation-id'] = correlationId;
    const record: ProducerRecord = {
      topic,
      messages: [{ key: envelope.orgId, value: JSON.stringify(envelope), headers }],
    };
    await this.producer.send(record);
  }

  async publishRaw(
    topic: string,
    key: string,
    value: string,
    headers: Record<string, string> = {},
  ): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({
      topic,
      messages: [{ key, value, headers }],
    });
  }
}

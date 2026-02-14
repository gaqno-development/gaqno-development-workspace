import { Kafka, type Consumer, type EachMessagePayload } from 'kafkajs';
import type { TopicRegistry } from './topic-registry';

export interface KafkaConsumerConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
  topics: TopicRegistry;
}

export type MessageHandler = (payload: {
  topic: string;
  key: string | null;
  value: string;
  headers: Record<string, string>;
}) => Promise<void>;

export class KafkaConsumer {
  private kafka: Kafka | null = null;
  private consumer: Consumer | null = null;

  constructor(private readonly config: KafkaConsumerConfig) {}

  async connect(): Promise<void> {
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
    });
    this.consumer = this.kafka.consumer({ groupId: this.config.groupId });
    await this.consumer.connect();
  }

  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
    this.kafka = null;
  }

  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    if (!this.consumer) throw new Error('Kafka consumer not connected');
    await this.consumer.subscribe({ topic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const value = payload.message.value?.toString();
        if (!value) return;
        const headers: Record<string, string> = {};
        if (payload.message.headers) {
          for (const [k, v] of Object.entries(payload.message.headers)) {
            if (v !== undefined)
              headers[k] = Buffer.isBuffer(v) ? v.toString() : String(v);
          }
        }
        await handler({
          topic: payload.topic,
          key: payload.message.key?.toString() ?? null,
          value,
          headers,
        });
      },
    });
  }

  async subscribeToDlq(handler: MessageHandler): Promise<void> {
    await this.subscribe(this.config.topics.dlq, handler);
  }
}

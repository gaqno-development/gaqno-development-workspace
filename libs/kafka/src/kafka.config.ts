import { KAFKA_TOPICS } from '@gaqno-ai-platform/shared-kernel';

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  topics: {
    aiEvents: string;
    billingEvents: string;
    projectionEvents: string;
  };
}

export function loadKafkaConfigFromEnv(): KafkaConfig {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',').map((b) => b.trim());
  const clientId = process.env.KAFKA_CLIENT_ID ?? 'gaqno-ai-platform';
  return {
    brokers,
    clientId,
    topics: {
      aiEvents: process.env.KAFKA_TOPIC_AI_EVENTS ?? KAFKA_TOPICS.AI_EVENTS,
      billingEvents: process.env.KAFKA_TOPIC_BILLING_EVENTS ?? KAFKA_TOPICS.BILLING_EVENTS,
      projectionEvents: process.env.KAFKA_TOPIC_PROJECTION_EVENTS ?? KAFKA_TOPICS.PROJECTION_EVENTS,
    },
  };
}

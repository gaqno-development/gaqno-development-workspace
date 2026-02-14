export const TOPIC_AI_EVENTS = 'ai.events';
export const TOPIC_BILLING_EVENTS = 'billing.events';
export const TOPIC_DLQ = 'dlq.events';

export interface TopicRegistryConfig {
  aiEvents?: string;
  billingEvents?: string;
  dlq?: string;
}

export class TopicRegistry {
  readonly aiEvents: string;
  readonly billingEvents: string;
  readonly dlq: string;

  constructor(config: TopicRegistryConfig = {}) {
    this.aiEvents = config.aiEvents ?? TOPIC_AI_EVENTS;
    this.billingEvents = config.billingEvents ?? TOPIC_BILLING_EVENTS;
    this.dlq = config.dlq ?? TOPIC_DLQ;
  }
}

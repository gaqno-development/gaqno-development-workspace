export const AGGREGATE_TYPES = {
  AI_TASK: 'AiTask',
  ORGANIZATION_BILLING: 'OrganizationBilling',
} as const;

export type AggregateType = (typeof AGGREGATE_TYPES)[keyof typeof AGGREGATE_TYPES];

export const AI_EVENT_TYPES = {
  AI_TASK_CREATED: 'AiTaskCreated',
  AI_TASK_STARTED: 'AiTaskStarted',
  AI_TASK_COMPLETED: 'AiTaskCompleted',
  AI_TASK_FAILED: 'AiTaskFailed',
  AI_TASK_TIMED_OUT: 'AiTaskTimedOut',
} as const;

export const BILLING_EVENT_TYPES = {
  CREDITS_ALLOCATED: 'CreditsAllocated',
  CREDITS_RESERVED: 'CreditsReserved',
  CREDITS_CONSUMED: 'CreditsConsumed',
  CREDITS_REFUNDED: 'CreditsRefunded',
} as const;

export const KAFKA_TOPICS = {
  AI_EVENTS: 'ai.events',
  BILLING_EVENTS: 'billing.events',
  PROJECTION_EVENTS: 'projection.events',
} as const;

export const HEADER_CORRELATION_ID = 'x-correlation-id';
export const HEADER_IDEMPOTENCY_KEY = 'x-idempotency-key';

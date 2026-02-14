import {
  BILLING_EVENT_TYPES,
  AGGREGATE_TYPES,
} from '@gaqno-ai-platform/shared-kernel';
import type {
  CreditsAllocatedPayload,
  CreditsReservedPayload,
  CreditsConsumedPayload,
  CreditsRefundedPayload,
} from '@gaqno-ai-platform/domain';

export interface ReserveCreditsInput {
  orgId: string;
  aggregateId: string;
  amount: number;
  taskId: string;
}

export interface ConsumeCreditsInput {
  orgId: string;
  aggregateId: string;
  amount: number;
  taskId: string;
}

export interface RefundCreditsInput {
  orgId: string;
  aggregateId: string;
  amount: number;
  taskId: string;
}

export interface AllocateCreditsInput {
  orgId: string;
  aggregateId: string;
  amount: number;
}

export function buildCreditsAllocatedEvent(
  input: AllocateCreditsInput,
  version: number,
): {
  aggregateType: string;
  eventType: string;
  payload: CreditsAllocatedPayload;
  version: number;
} {
  return {
    aggregateType: AGGREGATE_TYPES.ORGANIZATION_BILLING,
    eventType: BILLING_EVENT_TYPES.CREDITS_ALLOCATED,
    version: version + 1,
    payload: { amount: input.amount, orgId: input.orgId },
  };
}

export function buildCreditsReservedEvent(
  input: ReserveCreditsInput,
  version: number,
): {
  aggregateType: string;
  eventType: string;
  payload: CreditsReservedPayload;
  version: number;
} {
  return {
    aggregateType: AGGREGATE_TYPES.ORGANIZATION_BILLING,
    eventType: BILLING_EVENT_TYPES.CREDITS_RESERVED,
    version: version + 1,
    payload: {
      amount: input.amount,
      taskId: input.taskId,
      orgId: input.orgId,
    },
  };
}

export function buildCreditsConsumedEvent(
  input: ConsumeCreditsInput,
  version: number,
): {
  aggregateType: string;
  eventType: string;
  payload: CreditsConsumedPayload;
  version: number;
} {
  return {
    aggregateType: AGGREGATE_TYPES.ORGANIZATION_BILLING,
    eventType: BILLING_EVENT_TYPES.CREDITS_CONSUMED,
    version: version + 1,
    payload: {
      amount: input.amount,
      taskId: input.taskId,
      orgId: input.orgId,
    },
  };
}

export function buildCreditsRefundedEvent(
  input: RefundCreditsInput,
  version: number,
): {
  aggregateType: string;
  eventType: string;
  payload: CreditsRefundedPayload;
  version: number;
} {
  return {
    aggregateType: AGGREGATE_TYPES.ORGANIZATION_BILLING,
    eventType: BILLING_EVENT_TYPES.CREDITS_REFUNDED,
    version: version + 1,
    payload: {
      amount: input.amount,
      taskId: input.taskId,
      orgId: input.orgId,
    },
  };
}

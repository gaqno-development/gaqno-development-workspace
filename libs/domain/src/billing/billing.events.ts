import { BILLING_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';

export interface CreditsAllocatedPayload {
  amount: number;
  orgId: string;
}

export interface CreditsReservedPayload {
  amount: number;
  taskId: string;
  orgId: string;
}

export interface CreditsConsumedPayload {
  amount: number;
  taskId: string;
  orgId: string;
}

export interface CreditsRefundedPayload {
  amount: number;
  taskId: string;
  orgId: string;
}

export type BillingEventPayload =
  | CreditsAllocatedPayload
  | CreditsReservedPayload
  | CreditsConsumedPayload
  | CreditsRefundedPayload;

export const BILLING_EVENT_TYPES_EXPORT = BILLING_EVENT_TYPES;

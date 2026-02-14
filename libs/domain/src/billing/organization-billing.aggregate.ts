import type {
  CreditsAllocatedPayload,
  CreditsReservedPayload,
  CreditsConsumedPayload,
  CreditsRefundedPayload,
  BillingEventPayload,
} from './billing.events';
import { BILLING_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';

export interface OrganizationBillingState {
  orgId: string;
  available: number;
  reserved: number;
  consumed: number;
  refunded: number;
  version: number;
}

const INITIAL_VERSION = 0;

function applyCreditsAllocated(
  state: OrganizationBillingState,
  payload: CreditsAllocatedPayload,
): OrganizationBillingState {
  return {
    ...state,
    available: state.available + payload.amount,
    version: state.version + 1,
  };
}

function applyCreditsReserved(
  state: OrganizationBillingState,
  payload: CreditsReservedPayload,
): OrganizationBillingState {
  return {
    ...state,
    available: state.available - payload.amount,
    reserved: state.reserved + payload.amount,
    version: state.version + 1,
  };
}

function applyCreditsConsumed(
  state: OrganizationBillingState,
  payload: CreditsConsumedPayload,
): OrganizationBillingState {
  return {
    ...state,
    reserved: state.reserved - payload.amount,
    consumed: state.consumed + payload.amount,
    version: state.version + 1,
  };
}

function applyCreditsRefunded(
  state: OrganizationBillingState,
  payload: CreditsRefundedPayload,
): OrganizationBillingState {
  return {
    ...state,
    reserved: state.reserved - payload.amount,
    available: state.available + payload.amount,
    refunded: state.refunded + payload.amount,
    version: state.version + 1,
  };
}

const APPLY: Record<
  string,
  (s: OrganizationBillingState, p: BillingEventPayload) => OrganizationBillingState
> = {
  [BILLING_EVENT_TYPES.CREDITS_ALLOCATED]: applyCreditsAllocated as (
    s: OrganizationBillingState,
    p: BillingEventPayload,
  ) => OrganizationBillingState,
  [BILLING_EVENT_TYPES.CREDITS_RESERVED]: applyCreditsReserved as (
    s: OrganizationBillingState,
    p: BillingEventPayload,
  ) => OrganizationBillingState,
  [BILLING_EVENT_TYPES.CREDITS_CONSUMED]: applyCreditsConsumed as (
    s: OrganizationBillingState,
    p: BillingEventPayload,
  ) => OrganizationBillingState,
  [BILLING_EVENT_TYPES.CREDITS_REFUNDED]: applyCreditsRefunded as (
    s: OrganizationBillingState,
    p: BillingEventPayload,
  ) => OrganizationBillingState,
};

export class OrganizationBillingAggregate {
  private state: OrganizationBillingState;

  constructor(
    orgId: string,
    events: Array<{ eventType: string; payload: BillingEventPayload }> = [],
  ) {
    this.state = {
      orgId,
      available: 0,
      reserved: 0,
      consumed: 0,
      refunded: 0,
      version: INITIAL_VERSION,
    };
    for (const { eventType, payload } of events) {
      const fn = APPLY[eventType];
      if (fn) this.state = fn(this.state, payload);
    }
  }

  getState(): Readonly<OrganizationBillingState> {
    return this.state;
  }

  getVersion(): number {
    return this.state.version;
  }

  canReserve(amount: number): boolean {
    return this.state.available >= amount;
  }
}

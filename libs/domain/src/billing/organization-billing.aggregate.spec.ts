import { OrganizationBillingAggregate } from './organization-billing.aggregate';
import { BILLING_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';
import type { BillingEventPayload } from './billing.events';

describe('OrganizationBillingAggregate', () => {
  it('applies CreditsAllocated and increases available', () => {
    const orgId = 'org-1';
    const aggregate = new OrganizationBillingAggregate(orgId, [
      {
        eventType: BILLING_EVENT_TYPES.CREDITS_ALLOCATED,
        payload: { amount: 100, orgId },
      },
    ]);
    expect(aggregate.getState().available).toBe(100);
    expect(aggregate.canReserve(50)).toBe(true);
    expect(aggregate.canReserve(101)).toBe(false);
  });

  it('applies CreditsReserved and reduces available', () => {
    const orgId = 'org-2';
    const aggregate = new OrganizationBillingAggregate(orgId, [
      { eventType: BILLING_EVENT_TYPES.CREDITS_ALLOCATED, payload: { amount: 100, orgId } },
      {
        eventType: BILLING_EVENT_TYPES.CREDITS_RESERVED,
        payload: { amount: 30, taskId: 't1', orgId },
      },
    ]);
    expect(aggregate.getState().available).toBe(70);
    expect(aggregate.getState().reserved).toBe(30);
  });

  it('canReserve returns false when insufficient', () => {
    const orgId = 'org-3';
    const aggregate = new OrganizationBillingAggregate(orgId, [
      { eventType: BILLING_EVENT_TYPES.CREDITS_ALLOCATED, payload: { amount: 10, orgId } },
    ]);
    expect(aggregate.canReserve(10)).toBe(true);
    expect(aggregate.canReserve(11)).toBe(false);
  });
});

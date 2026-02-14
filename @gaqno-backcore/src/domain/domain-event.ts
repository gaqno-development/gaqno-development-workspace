export interface DomainEvent<T = unknown> {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  occurredAt: string;
  payload: T;
}

export function createDomainEvent<T>(params: {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  payload: T;
}): DomainEvent<T> {
  return {
    ...params,
    occurredAt: new Date().toISOString(),
  };
}

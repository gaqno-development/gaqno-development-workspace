export interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export interface EventEnvelope<T = unknown> {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  payload: T;
  occurredAt: string;
}

export interface PersistedEventEnvelope {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  payload: EncryptedPayload;
  occurredAt: string;
}

export interface DomainEventMetadata {
  eventId: string;
  aggregateId: string;
  orgId: string;
  aggregateType: string;
  eventType: string;
  version: number;
  occurredAt: string;
}

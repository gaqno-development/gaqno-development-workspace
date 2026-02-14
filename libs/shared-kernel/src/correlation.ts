import { randomUUID } from 'crypto';

const CORRELATION_ID_KEY = 'correlationId';

export function getOrCreateCorrelationId(existing?: string | null): string {
  if (existing?.trim()) return existing.trim();
  return randomUUID();
}

export function createCorrelationContext(id: string): { [key: string]: string } {
  return { [CORRELATION_ID_KEY]: id };
}

export function getCorrelationIdFromContext(context: { [key: string]: unknown }): string | undefined {
  const value = context[CORRELATION_ID_KEY];
  return typeof value === 'string' ? value : undefined;
}

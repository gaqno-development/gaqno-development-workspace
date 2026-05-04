import {
  MAX_QDRANT_COLLECTION_NAME_LENGTH,
  MAX_TENANT_ID_LENGTH,
  TENANT_TOPICS_PREFIX,
} from '../constants/vector-collections.js';

const TENANT_ID_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;

function assertTenantLength(trimmed: string): void {
  if (trimmed.length > MAX_TENANT_ID_LENGTH) {
    throw new Error('tenantId exceeds maximum length');
  }
}

function assertCollectionLength(name: string): void {
  if (name.length > MAX_QDRANT_COLLECTION_NAME_LENGTH) {
    throw new Error('derived collection name exceeds Qdrant limit');
  }
}

export function collectionNameForTenant(tenantId: string): string {
  const trimmed = tenantId.trim();
  if (trimmed.length === 0) {
    throw new Error('tenantId must be non-empty');
  }
  assertTenantLength(trimmed);
  if (!TENANT_ID_PATTERN.test(trimmed)) {
    throw new Error('tenantId contains invalid characters');
  }
  const name = `${TENANT_TOPICS_PREFIX}${trimmed}`;
  assertCollectionLength(name);
  return name;
}

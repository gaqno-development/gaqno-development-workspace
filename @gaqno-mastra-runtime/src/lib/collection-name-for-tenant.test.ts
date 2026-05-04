import { describe, expect, it } from 'vitest';
import {
  MAX_QDRANT_COLLECTION_NAME_LENGTH,
  MAX_TENANT_ID_LENGTH,
  TENANT_TOPICS_PREFIX,
} from '../constants/vector-collections';
import { collectionNameForTenant } from './collection-name-for-tenant';

describe('collectionNameForTenant', () => {
  it('should map a valid tenant id to a Qdrant collection name', () => {
    expect(collectionNameForTenant('acme')).toBe('topics_acme');
  });

  it('should accept UUID-shaped tenant ids', () => {
    expect(collectionNameForTenant('550e8400-e29b-41d4-a716-446655440000')).toBe(
      'topics_550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('should trim whitespace', () => {
    expect(collectionNameForTenant('  tenant1  ')).toBe('topics_tenant1');
  });

  it('should reject empty tenant id', () => {
    expect(() => collectionNameForTenant('')).toThrow();
    expect(() => collectionNameForTenant('   ')).toThrow();
  });

  it('should reject tenant ids with unsafe characters', () => {
    expect(() => collectionNameForTenant('../etc')).toThrow();
    expect(() => collectionNameForTenant('a b')).toThrow();
    expect(() => collectionNameForTenant('a@b')).toThrow();
  });

  it('should reject tenant ids that exceed maximum length', () => {
    const long = 'a'.repeat(MAX_TENANT_ID_LENGTH + 1);
    expect(() => collectionNameForTenant(long)).toThrow();
  });

  it('should accept tenant id at maximum length', () => {
    const id = 'a'.repeat(MAX_TENANT_ID_LENGTH);
    expect(collectionNameForTenant(id)).toBe(`${TENANT_TOPICS_PREFIX}${id}`);
    expect(collectionNameForTenant(id).length).toBeLessThanOrEqual(MAX_QDRANT_COLLECTION_NAME_LENGTH);
  });
});

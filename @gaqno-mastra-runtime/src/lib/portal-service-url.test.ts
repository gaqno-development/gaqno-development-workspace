import { describe, expect, it } from 'vitest';
import {
  assertPathMatchesServiceAllowlist,
  assertValidPortalResourcePath,
} from './portal-service-url';

describe('assertValidPortalResourcePath', () => {
  it('should accept a simple API path', () => {
    expect(() => assertValidPortalResourcePath('/api/v1/status')).not.toThrow();
  });

  it('should reject paths with traversal segments', () => {
    expect(() => assertValidPortalResourcePath('/api/../admin')).toThrow();
    expect(() => assertValidPortalResourcePath('/api/foo/../bar')).toThrow();
  });

  it('should reject paths without a leading slash', () => {
    expect(() => assertValidPortalResourcePath('api/foo')).toThrow();
  });

  it('should reject empty path', () => {
    expect(() => assertValidPortalResourcePath('')).toThrow();
  });

  it('should reject disallowed characters', () => {
    expect(() => assertValidPortalResourcePath('/api?q=1')).toThrow();
    expect(() => assertValidPortalResourcePath('/api foo')).toThrow();
  });
});

describe('assertPathMatchesServiceAllowlist', () => {
  it('should accept paths under the service allowlist', () => {
    expect(() => assertPathMatchesServiceAllowlist('erp', '/api/health')).not.toThrow();
    expect(() => assertPathMatchesServiceAllowlist('crm', '/api/v1/ping')).not.toThrow();
  });

  it('should reject paths outside the allowlist', () => {
    expect(() => assertPathMatchesServiceAllowlist('erp', '/internal/admin')).toThrow();
  });
});

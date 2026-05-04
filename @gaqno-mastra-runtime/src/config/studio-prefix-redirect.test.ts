import { describe, expect, it } from 'vitest';
import { resolveStudioPrefixRedirect } from './studio-prefix-redirect.js';

describe('resolveStudioPrefixRedirect', () => {
  it('should map /studio to root', () => {
    expect(resolveStudioPrefixRedirect('/studio')).toBe('/');
  });

  it('should map /studio/ to root', () => {
    expect(resolveStudioPrefixRedirect('/studio/')).toBe('/');
  });

  it('should strip /studio prefix from nested paths', () => {
    expect(resolveStudioPrefixRedirect('/studio/agents')).toBe('/agents');
  });

  it('should return null for unrelated paths', () => {
    expect(resolveStudioPrefixRedirect('/api/agents')).toBeNull();
    expect(resolveStudioPrefixRedirect('/')).toBeNull();
  });
});

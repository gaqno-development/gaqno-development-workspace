import { describe, expect, it } from 'vitest';
import { listPortalFeaturesTool } from './list-portal-features-tool.js';

describe('listPortalFeaturesTool', () => {
  it('declares the expected tool id and accepts an empty input', () => {
    expect(listPortalFeaturesTool.id).toBe('list-portal-features');
  });

  it('returns a non-empty list of portal features with id, label, route, aliases, actions', async () => {
    const result = await listPortalFeaturesTool.execute!({} as never, {} as never);
    expect(result.features.length).toBeGreaterThanOrEqual(8);
    for (const feature of result.features) {
      expect(typeof feature.id).toBe('string');
      expect(typeof feature.label).toBe('string');
      expect(feature.route.startsWith('/')).toBe(true);
      expect(Array.isArray(feature.aliases)).toBe(true);
      expect(Array.isArray(feature.actions)).toBe(true);
    }
  });

  it('includes the core gaqno areas (CRM, ERP, AI Studio, Omnichannel, Admin)', async () => {
    const result = await listPortalFeaturesTool.execute!({} as never, {} as never);
    const ids = result.features.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['crm', 'erp', 'ai-studio', 'omnichannel', 'admin']));
  });
});

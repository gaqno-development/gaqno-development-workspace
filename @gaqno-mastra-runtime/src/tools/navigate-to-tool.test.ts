import { describe, expect, it } from 'vitest';
import { navigateToTool } from './navigate-to-tool.js';

describe('navigateToTool', () => {
  it('declares the expected tool id', () => {
    expect(navigateToTool.id).toBe('navigate-to');
  });

  it('returns the route, the matching feature label and its suggested actions', async () => {
    const result = await navigateToTool.execute!(
      { route: '/erp/orders', reason: 'Para ver os pedidos abertos.' } as never,
      {} as never,
    );
    expect(result.route).toBe('/erp/orders');
    expect(result.label).toBe('ERP');
    expect(result.reason).toBe('Para ver os pedidos abertos.');
    expect(result.suggestedActions.some((a) => a.route === '/erp/orders')).toBe(true);
  });

  it('rejects routes outside the allowlist', async () => {
    await expect(
      navigateToTool.execute!(
        { route: '/etc/passwd', reason: 'tentativa' } as never,
        {} as never,
      ),
    ).rejects.toThrow(/not an allowed portal route/i);
  });

  it('rejects routes with traversal segments', async () => {
    await expect(
      navigateToTool.execute!(
        { route: '/erp/../admin', reason: 'tentativa' } as never,
        {} as never,
      ),
    ).rejects.toThrow(/not an allowed portal route/i);
  });

  it('returns the canonical feature label for a deep route', async () => {
    const result = await navigateToTool.execute!(
      { route: '/crm/sales/leads', reason: 'Para ver os leads.' } as never,
      {} as never,
    );
    expect(result.label).toBe('CRM');
  });
});

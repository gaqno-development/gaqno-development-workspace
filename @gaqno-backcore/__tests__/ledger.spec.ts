import { calculateBalance, type LedgerEntry } from '../src/billing/ledger';

describe('Ledger calculateBalance', () => {
  const base = (overrides: Partial<LedgerEntry>): LedgerEntry => ({
    id: '1',
    orgId: 'org1',
    type: 'CREDITS_ALLOCATED',
    amount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  it('sums CREDITS_ALLOCATED as available', () => {
    const entries = [
      base({ type: 'CREDITS_ALLOCATED', amount: 100 }),
      base({ type: 'CREDITS_ALLOCATED', amount: 50 }),
    ];
    expect(calculateBalance(entries)).toEqual({
      available: 150,
      reserved: 0,
      consumed: 0,
    });
  });

  it('reserve reduces available and increases reserved', () => {
    const entries = [
      base({ type: 'CREDITS_ALLOCATED', amount: 100 }),
      base({ type: 'CREDITS_RESERVED', amount: 30 }),
    ];
    expect(calculateBalance(entries)).toEqual({
      available: 70,
      reserved: 30,
      consumed: 0,
    });
  });

  it('consume reduces reserved and increases consumed', () => {
    const entries = [
      base({ type: 'CREDITS_ALLOCATED', amount: 100 }),
      base({ type: 'CREDITS_RESERVED', amount: 40 }),
      base({ type: 'CREDITS_CONSUMED', amount: 10 }),
    ];
    expect(calculateBalance(entries)).toEqual({
      available: 60,
      reserved: 30,
      consumed: 10,
    });
  });

  it('refund returns reserved to available', () => {
    const entries = [
      base({ type: 'CREDITS_ALLOCATED', amount: 100 }),
      base({ type: 'CREDITS_RESERVED', amount: 20 }),
      base({ type: 'CREDITS_REFUNDED', amount: 20 }),
    ];
    expect(calculateBalance(entries)).toEqual({
      available: 100,
      reserved: 0,
      consumed: 0,
    });
  });

  it('entries applied in sequence produce correct totals', () => {
    const entries = [
      base({ type: 'CREDITS_ALLOCATED', amount: 100 }),
      base({ type: 'CREDITS_RESERVED', amount: 10 }),
      base({ type: 'CREDITS_CONSUMED', amount: 5 }),
      base({ type: 'CREDITS_REFUNDED', amount: 5 }),
    ];
    const { available, reserved, consumed } = calculateBalance(entries);
    expect(available).toBe(95);
    expect(reserved).toBe(0);
    expect(consumed).toBe(5);
  });
});

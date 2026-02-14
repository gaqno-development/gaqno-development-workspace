import type { LedgerStore } from './ledger';
import { calculateBalance } from './ledger';
import { createId } from '../shared-kernel/id';
import { InsufficientCreditsError } from '../shared-kernel/errors';

export class CreditPolicy {
  constructor(private readonly ledger: LedgerStore) {}

  async reserveCredits(orgId: string, amount: number, taskId: string): Promise<void> {
    const entries = await this.ledger.getByOrg(orgId);
    const { available } = calculateBalance(entries);
    if (available < amount) {
      throw new InsufficientCreditsError(orgId, amount, available);
    }
    await this.ledger.append({
      orgId,
      type: 'CREDITS_RESERVED',
      amount,
      taskId,
    });
  }

  async consumeCredits(orgId: string, amount: number, taskId: string): Promise<void> {
    await this.ledger.append({
      orgId,
      type: 'CREDITS_CONSUMED',
      amount,
      taskId,
    });
  }

  async refundCredits(orgId: string, amount: number, taskId: string): Promise<void> {
    await this.ledger.append({
      orgId,
      type: 'CREDITS_REFUNDED',
      amount,
      taskId,
    });
  }

  async allocateCredits(orgId: string, amount: number): Promise<void> {
    await this.ledger.append({
      orgId,
      type: 'CREDITS_ALLOCATED',
      amount,
    });
  }

  async getBalance(orgId: string): Promise<{ available: number; reserved: number; consumed: number }> {
    const entries = await this.ledger.getByOrg(orgId);
    return calculateBalance(entries);
  }
}

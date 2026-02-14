export type LedgerEntryType =
  | 'CREDITS_ALLOCATED'
  | 'CREDITS_RESERVED'
  | 'CREDITS_CONSUMED'
  | 'CREDITS_REFUNDED';

export interface LedgerEntry {
  id: string;
  orgId: string;
  type: LedgerEntryType;
  amount: number;
  taskId?: string;
  createdAt: string;
}

export interface LedgerStore {
  append(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry>;
  getByOrg(orgId: string, limit?: number): Promise<LedgerEntry[]>;
}

export function calculateBalance(entries: LedgerEntry[]) {
  let available = 0;
  let reserved = 0;
  let consumed = 0;
  for (const e of entries) {
    if (e.type === 'CREDITS_ALLOCATED') available += e.amount;
    else if (e.type === 'CREDITS_RESERVED') {
      available -= e.amount;
      reserved += e.amount;
    } else if (e.type === 'CREDITS_CONSUMED') {
      reserved -= e.amount;
      consumed += e.amount;
    } else if (e.type === 'CREDITS_REFUNDED') {
      reserved -= e.amount;
      available += e.amount;
    }
  }
  return { available, reserved, consumed };
}

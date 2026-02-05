export enum TransactionStatus {
  PAGO = "pago",
  A_PAGAR = "a_pagar",
  EM_ATRASO = "em_atraso",
}

export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}

export enum RecurrenceType {
  NONE = "none",
  FIFTH_BUSINESS_DAY = "fifth_business_day",
  DAY_15 = "day_15",
  LAST_DAY = "last_day",
  CUSTOM = "custom",
}

export interface CreateTransactionInput {
  description: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  due_date?: string;
  category_id?: string;
  subcategory_id?: string;
  credit_card_id?: string;
  status?: TransactionStatus;
  assigned_to?: string;
  notes?: string;
  installment_count?: number;
  installment_current?: number;
  is_recurring?: boolean;
  recurring_type?: RecurrenceType | null;
  recurring_day?: number;
  recurring_months?: number;
  icon?: string;
}

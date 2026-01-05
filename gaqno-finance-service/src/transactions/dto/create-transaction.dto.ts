import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, IsUUID } from 'class-validator';

export enum TransactionStatus {
  PAGO = 'pago',
  A_PAGAR = 'a_pagar',
  EM_ATRASO = 'em_atraso',
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum RecurrenceType {
  NONE = 'none',
  FIFTH_BUSINESS_DAY = 'fifth_business_day',
  DAY_15 = 'day_15',
  LAST_DAY = 'last_day',
  CUSTOM = 'custom',
}

export class CreateTransactionDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsDateString()
  transaction_date: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  subcategory_id?: string;

  @IsOptional()
  @IsUUID()
  credit_card_id?: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  installment_count?: number;

  @IsOptional()
  @IsInt()
  installment_current?: number;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  recurring_type?: RecurrenceType | null;

  @IsOptional()
  @IsInt()
  recurring_day?: number;

  @IsOptional()
  @IsInt()
  recurring_months?: number;

  @IsOptional()
  @IsString()
  icon?: string;
}


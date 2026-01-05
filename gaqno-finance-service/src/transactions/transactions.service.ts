import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { financeTransactions, financeCategories, financeSubcategories, financeCreditCards } from '../database/schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

@Injectable()
export class TransactionsService {
  constructor(private readonly db: DatabaseService) {}

  async getTransactions(
    tenantId: string | null,
    userId: string,
    startDate?: string,
    endDate?: string
  ) {
    const conditions = [eq(financeTransactions.userId, userId)];

    if (tenantId) {
      conditions.push(eq(financeTransactions.tenantId, tenantId));
    }

    if (startDate) {
      conditions.push(gte(financeTransactions.transactionDate, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(financeTransactions.transactionDate, new Date(endDate)));
    }

    const results = await this.db.db
      .select()
      .from(financeTransactions)
      .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
      .leftJoin(financeSubcategories, eq(financeTransactions.subcategoryId, financeSubcategories.id))
      .leftJoin(financeCreditCards, eq(financeTransactions.creditCardId, financeCreditCards.id))
      .where(and(...conditions))
      .orderBy(desc(financeTransactions.transactionDate));
    
    return results.map(row => ({
      ...row.finance_transactions,
      category: row.finance_categories,
      subcategory: row.finance_subcategories,
      creditCard: row.finance_credit_cards
    }));
  }

  async getTransactionById(tenantId: string | null, userId: string, id: string) {
    const results = await this.db.db
      .select()
      .from(financeTransactions)
      .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
      .leftJoin(financeSubcategories, eq(financeTransactions.subcategoryId, financeSubcategories.id))
      .leftJoin(financeCreditCards, eq(financeTransactions.creditCardId, financeCreditCards.id))
      .where(
        and(
          eq(financeTransactions.id, id),
          eq(financeTransactions.userId, userId),
          tenantId ? eq(financeTransactions.tenantId, tenantId) : undefined
        )
      );

    if (!results.length) {
      throw new NotFoundException('Transaction not found');
    }

    const row = results[0];
    return {
      ...row.finance_transactions,
      category: row.finance_categories,
      subcategory: row.finance_subcategories,
      creditCard: row.finance_credit_cards
    };
  }

  async createTransaction(
    tenantId: string | null,
    userId: string,
    dto: CreateTransactionDto
  ) {
    if (!userId) {
      throw new Error('ID do usuário é obrigatório para criar transações');
    }

    if (!dto.description || dto.description.trim().length === 0) {
      throw new Error('A descrição da transação é obrigatória');
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new Error('O valor da transação deve ser maior que zero');
    }

    if (!dto.transaction_date) {
      throw new Error('A data da transação é obrigatória');
    }

    try {
      const [transaction] = await this.db.db
        .insert(financeTransactions)
        .values({
          tenantId: tenantId || '',
          userId,
          description: dto.description.trim(),
          amount: dto.amount.toString(),
          type: dto.type,
          transactionDate: new Date(dto.transaction_date),
          dueDate: dto.due_date ? new Date(dto.due_date) : null,
          categoryId: dto.category_id || null,
          subcategoryId: dto.subcategory_id || null,
          creditCardId: dto.credit_card_id || null,
          status: dto.status || 'a_pagar',
          assignedTo: dto.assigned_to || null,
          notes: dto.notes || null,
          installmentCount: dto.installment_count || 1,
          installmentCurrent: dto.installment_current || 1,
          isRecurring: dto.is_recurring || false,
          recurringType: dto.recurring_type || null,
          recurringDay: dto.recurring_day || null,
          recurringMonths: dto.recurring_months || null,
          icon: dto.icon || null,
        })
        .returning();

      // Retorna a transação criada diretamente, sem fazer join (mais rápido e evita erros)
      // Converte o amount de string para number para manter consistência
      const result = {
        ...transaction,
        amount: parseFloat(transaction.amount),
        category: null,
        subcategory: null,
        creditCard: null,
      };
      return result;
    } catch (error: any) {
      console.error('Error creating transaction:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
      });
      if (error.message) {
        throw error;
      }
      throw new Error(`Erro ao criar transação: ${error.message || 'Erro desconhecido'}`);
    }
  }

  async updateTransaction(
    tenantId: string | null,
    userId: string,
    dto: UpdateTransactionDto
  ) {
    await this.getTransactionById(tenantId, userId, dto.id);

    const updateData: any = {};
    if (dto.description) updateData.description = dto.description;
    if (dto.amount !== undefined) updateData.amount = dto.amount.toString();
    if (dto.type) updateData.type = dto.type;
    if (dto.transaction_date) updateData.transactionDate = new Date(dto.transaction_date);
    if (dto.due_date) updateData.dueDate = new Date(dto.due_date);
    if (dto.category_id !== undefined) updateData.categoryId = dto.category_id || null;
    if (dto.subcategory_id !== undefined) updateData.subcategoryId = dto.subcategory_id || null;
    if (dto.credit_card_id !== undefined) updateData.creditCardId = dto.credit_card_id || null;
    if (dto.status) updateData.status = dto.status;
    if (dto.assigned_to !== undefined) updateData.assignedTo = dto.assigned_to || null;
    if (dto.notes !== undefined) updateData.notes = dto.notes || null;
    if (dto.installment_count) updateData.installmentCount = dto.installment_count;
    if (dto.installment_current) updateData.installmentCurrent = dto.installment_current;
    if (dto.is_recurring !== undefined) updateData.isRecurring = dto.is_recurring;
    if (dto.recurring_type !== undefined) updateData.recurringType = dto.recurring_type || null;
    if (dto.recurring_day !== undefined) updateData.recurringDay = dto.recurring_day || null;
    if (dto.recurring_months !== undefined) updateData.recurringMonths = dto.recurring_months || null;
    if (dto.icon !== undefined) updateData.icon = dto.icon || null;
    
    updateData.updatedAt = new Date();

    await this.db.db
      .update(financeTransactions)
      .set(updateData)
      .where(
        and(
          eq(financeTransactions.id, dto.id),
          eq(financeTransactions.userId, userId),
          tenantId ? eq(financeTransactions.tenantId, tenantId) : undefined
        )
      );

    return this.getTransactionById(tenantId, userId, dto.id);
  }

  async deleteTransaction(tenantId: string | null, userId: string, id: string) {
    await this.getTransactionById(tenantId, userId, id);

    await this.db.db
      .delete(financeTransactions)
      .where(
        and(
          eq(financeTransactions.id, id),
          eq(financeTransactions.userId, userId),
          tenantId ? eq(financeTransactions.tenantId, tenantId) : undefined
        )
      );

    return { success: true };
  }
}


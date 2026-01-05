import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { financeTransactions, financeCreditCards } from '../database/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getMetrics(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalBalance, monthlyIncome, monthlyExpenses, recentTransactions, accountSummaries] = await Promise.all([
      this.getTotalBalance(tenantId),
      this.getMonthlyIncome(tenantId, startOfMonth),
      this.getMonthlyExpenses(tenantId, startOfMonth),
      this.getRecentTransactions(tenantId),
      this.getAccountSummaries(tenantId)
    ]);

    return {
      revenue: totalBalance,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      transactions: recentTransactions.length,
      recentTransactions: recentTransactions.slice(0, 5),
      accountSummaries
    };
  }

  private async getTotalBalance(tenantId: string): Promise<number> {
    const result = await this.db.db
      .select({
        total: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE -amount::numeric END), 0)`
      })
      .from(financeTransactions)
      .where(eq(financeTransactions.tenantId, tenantId));

    return Number(result[0]?.total || 0);
  }

  private async getMonthlyIncome(tenantId: string, startOfMonth: Date): Promise<number> {
    const result = await this.db.db
      .select({
        total: sql<number>`COALESCE(SUM(amount::numeric), 0)`
      })
      .from(financeTransactions)
      .where(
        and(
          eq(financeTransactions.tenantId, tenantId),
          eq(financeTransactions.type, 'income'),
          gte(financeTransactions.transactionDate, startOfMonth)
        )
      );

    return Number(result[0]?.total || 0);
  }

  private async getMonthlyExpenses(tenantId: string, startOfMonth: Date): Promise<number> {
    const result = await this.db.db
      .select({
        total: sql<number>`COALESCE(SUM(amount::numeric), 0)`
      })
      .from(financeTransactions)
      .where(
        and(
          eq(financeTransactions.tenantId, tenantId),
          eq(financeTransactions.type, 'expense'),
          gte(financeTransactions.transactionDate, startOfMonth)
        )
      );

    return Number(result[0]?.total || 0);
  }

  private async getRecentTransactions(tenantId: string) {
    return this.db.db
      .select()
      .from(financeTransactions)
      .where(eq(financeTransactions.tenantId, tenantId))
      .orderBy(desc(financeTransactions.transactionDate))
      .limit(10);
  }

  private async getAccountSummaries(tenantId: string) {
    const creditCardSummaries = await this.db.db
      .select({
        totalLimit: sql<number>`COALESCE(SUM(credit_limit::numeric), 0)`,
        usedLimit: sql<number>`0`
      })
      .from(financeCreditCards)
      .where(eq(financeCreditCards.tenantId, tenantId));

    return {
      creditCards: creditCardSummaries[0] || { totalLimit: 0, usedLimit: 0 }
    };
  }
}


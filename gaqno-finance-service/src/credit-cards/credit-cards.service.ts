import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { financeCreditCards } from '../database/schema';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class CreditCardsService {
  constructor(private readonly db: DatabaseService) {}

  async getCreditCards(tenantId: string | null, userId: string) {
    const conditions = [eq(financeCreditCards.userId, userId)];
    
    if (tenantId) {
      conditions.push(eq(financeCreditCards.tenantId, tenantId));
    }

    return this.db.db
      .select()
      .from(financeCreditCards)
      .where(and(...conditions));
  }

  async getCreditCardById(tenantId: string | null, userId: string, id: string) {
    const conditions = [
      eq(financeCreditCards.id, id),
      eq(financeCreditCards.userId, userId)
    ];
    
    if (tenantId) {
      conditions.push(eq(financeCreditCards.tenantId, tenantId));
    }

    const [creditCard] = await this.db.db
      .select()
      .from(financeCreditCards)
      .where(and(...conditions));

    if (!creditCard) {
      throw new NotFoundException('Credit card not found');
    }

    return creditCard;
  }

  async createCreditCard(tenantId: string | null, userId: string, dto: CreateCreditCardDto) {
    const [creditCard] = await this.db.db
      .insert(financeCreditCards)
      .values({
        tenantId: tenantId || '',
        userId,
        name: dto.name,
        lastFourDigits: dto.last_four_digits,
        cardType: dto.card_type,
        bankName: dto.bank_name || null,
        creditLimit: dto.credit_limit.toString(),
        closingDay: dto.closing_day,
        dueDay: dto.due_day,
        color: dto.color,
        icon: dto.icon || null,
      })
      .returning();

    return creditCard;
  }

  async updateCreditCard(tenantId: string | null, userId: string, dto: UpdateCreditCardDto) {
    await this.getCreditCardById(tenantId, userId, dto.id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.last_four_digits) updateData.lastFourDigits = dto.last_four_digits;
    if (dto.card_type) updateData.cardType = dto.card_type;
    if (dto.bank_name !== undefined) updateData.bankName = dto.bank_name || null;
    if (dto.credit_limit !== undefined) updateData.creditLimit = dto.credit_limit.toString();
    if (dto.closing_day) updateData.closingDay = dto.closing_day;
    if (dto.due_day) updateData.dueDay = dto.due_day;
    if (dto.color) updateData.color = dto.color;
    if (dto.icon !== undefined) updateData.icon = dto.icon || null;
    updateData.updatedAt = new Date();

    const [creditCard] = await this.db.db
      .update(financeCreditCards)
      .set(updateData)
      .where(
        and(
          eq(financeCreditCards.id, dto.id),
          eq(financeCreditCards.userId, userId),
          tenantId ? eq(financeCreditCards.tenantId, tenantId) : undefined
        )
      )
      .returning();

    return creditCard;
  }

  async deleteCreditCard(tenantId: string | null, userId: string, id: string) {
    await this.getCreditCardById(tenantId, userId, id);

    await this.db.db
      .delete(financeCreditCards)
      .where(
        and(
          eq(financeCreditCards.id, id),
          eq(financeCreditCards.userId, userId),
          tenantId ? eq(financeCreditCards.tenantId, tenantId) : undefined
        )
      );

    return { success: true };
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { financeCategories } from '../database/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async getCategories(tenantId: string | null, type?: string) {
    const conditions = [];
    
    if (tenantId) {
      conditions.push(eq(financeCategories.tenantId, tenantId));
    }

    if (type) {
      conditions.push(eq(financeCategories.type, type as 'income' | 'expense'));
    }

    return this.db.db
      .select()
      .from(financeCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async getCategoryById(tenantId: string | null, id: string) {
    const conditions = [eq(financeCategories.id, id)];
    
    if (tenantId) {
      conditions.push(eq(financeCategories.tenantId, tenantId));
    }

    const [category] = await this.db.db
      .select()
      .from(financeCategories)
      .where(and(...conditions));

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(tenantId: string | null, dto: CreateCategoryDto) {
    const [category] = await this.db.db
      .insert(financeCategories)
      .values({
        tenantId: tenantId || '',
        name: dto.name,
        type: dto.type,
        color: dto.color || null,
        icon: dto.icon || null,
      })
      .returning();

    return category;
  }

  async updateCategory(tenantId: string | null, dto: UpdateCategoryDto) {
    await this.getCategoryById(tenantId, dto.id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.type) updateData.type = dto.type;
    if (dto.color !== undefined) updateData.color = dto.color || null;
    if (dto.icon !== undefined) updateData.icon = dto.icon || null;
    updateData.updatedAt = new Date();

    const [category] = await this.db.db
      .update(financeCategories)
      .set(updateData)
      .where(
        and(
          eq(financeCategories.id, dto.id),
          tenantId ? eq(financeCategories.tenantId, tenantId) : undefined
        )
      )
      .returning();

    return category;
  }

  async deleteCategory(tenantId: string | null, id: string) {
    await this.getCategoryById(tenantId, id);

    await this.db.db
      .delete(financeCategories)
      .where(
        and(
          eq(financeCategories.id, id),
          tenantId ? eq(financeCategories.tenantId, tenantId) : undefined
        )
      );

    return { success: true };
  }

  async seedDefaultCategories(tenantId: string | null) {
    const defaultCategories = [
      { name: 'Moradia', type: 'expense' as const, color: '#3b82f6', icon: '🏠' },
      { name: 'Empréstimos', type: 'expense' as const, color: '#ef4444', icon: '💳' },
      { name: 'Carro', type: 'expense' as const, color: '#f59e0b', icon: '🚗' },
      { name: 'Alimentação', type: 'expense' as const, color: '#10b981', icon: '🍽️' },
      { name: 'Lazer', type: 'expense' as const, color: '#8b5cf6', icon: '🎮' },
      { name: 'Educação', type: 'expense' as const, color: '#06b6d4', icon: '📚' },
      { name: 'Assinaturas', type: 'expense' as const, color: '#ec4899', icon: '📱' },
      { name: 'Saúde', type: 'expense' as const, color: '#f43f5e', icon: '🏥' },
      { name: 'Transporte', type: 'expense' as const, color: '#6366f1', icon: '🚌' },
      { name: 'Roupas', type: 'expense' as const, color: '#a855f7', icon: '👕' },
      { name: 'Salário', type: 'income' as const, color: '#22c55e', icon: '💰' },
      { name: 'Freelance', type: 'income' as const, color: '#14b8a6', icon: '💼' },
      { name: 'Investimentos', type: 'income' as const, color: '#0ea5e9', icon: '📈' },
      { name: 'Outros', type: 'expense' as const, color: '#6b7280', icon: '📦' },
    ];

    const existingCategories = await this.getCategories(tenantId);
    const existingNames = new Set(existingCategories.map(c => c.name));

    const categoriesToCreate = defaultCategories.filter(c => !existingNames.has(c.name));

    if (categoriesToCreate.length === 0) {
      return { message: 'All default categories already exist', created: 0 };
    }

    const created = await this.db.db
      .insert(financeCategories)
      .values(
        categoriesToCreate.map(cat => ({
          tenantId: tenantId || '',
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
        }))
      )
      .returning();

    return { message: `Created ${created.length} default categories`, created: created.length, categories: created };
  }
}


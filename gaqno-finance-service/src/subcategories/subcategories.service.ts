import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { financeSubcategories, financeCategories } from '../database/schema';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class SubcategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async getSubcategories(tenantId: string | null, parentCategoryId: string) {
    const conditions = [eq(financeSubcategories.parentCategoryId, parentCategoryId)];
    
    if (tenantId) {
      conditions.push(eq(financeSubcategories.tenantId, tenantId));
    }

    // Verify parent category exists and belongs to tenant
    const parentConditions = [eq(financeCategories.id, parentCategoryId)];
    if (tenantId) {
      parentConditions.push(eq(financeCategories.tenantId, tenantId));
    }

    const [parentCategory] = await this.db.db
      .select()
      .from(financeCategories)
      .where(and(...parentConditions));

    if (!parentCategory) {
      throw new NotFoundException('Parent category not found');
    }

    return this.db.db
      .select()
      .from(financeSubcategories)
      .where(and(...conditions));
  }

  async getSubcategoryById(tenantId: string | null, id: string) {
    const conditions = [eq(financeSubcategories.id, id)];
    
    if (tenantId) {
      conditions.push(eq(financeSubcategories.tenantId, tenantId));
    }

    const [subcategory] = await this.db.db
      .select()
      .from(financeSubcategories)
      .where(and(...conditions));

    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    return subcategory;
  }

  async createSubcategory(tenantId: string | null, dto: CreateSubcategoryDto) {
    // Verify parent category exists and belongs to tenant
    const parentConditions = [eq(financeCategories.id, dto.parent_category_id)];
    if (tenantId) {
      parentConditions.push(eq(financeCategories.tenantId, tenantId));
    }

    const [parentCategory] = await this.db.db
      .select()
      .from(financeCategories)
      .where(and(...parentConditions));

    if (!parentCategory) {
      throw new NotFoundException('Parent category not found');
    }

    const [subcategory] = await this.db.db
      .insert(financeSubcategories)
      .values({
        tenantId: tenantId || '',
        parentCategoryId: dto.parent_category_id,
        name: dto.name,
        icon: dto.icon || null,
      })
      .returning();

    return subcategory;
  }

  async updateSubcategory(tenantId: string | null, dto: UpdateSubcategoryDto) {
    await this.getSubcategoryById(tenantId, dto.id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.icon !== undefined) updateData.icon = dto.icon || null;
    updateData.updatedAt = new Date();

    const [subcategory] = await this.db.db
      .update(financeSubcategories)
      .set(updateData)
      .where(
        and(
          eq(financeSubcategories.id, dto.id),
          tenantId ? eq(financeSubcategories.tenantId, tenantId) : undefined
        )
      )
      .returning();

    return subcategory;
  }

  async deleteSubcategory(tenantId: string | null, id: string) {
    await this.getSubcategoryById(tenantId, id);

    await this.db.db
      .delete(financeSubcategories)
      .where(
        and(
          eq(financeSubcategories.id, id),
          tenantId ? eq(financeSubcategories.tenantId, tenantId) : undefined
        )
      );

    return { success: true };
  }
}


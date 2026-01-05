import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Get()
  async getSubcategories(
    @Req() req: AuthenticatedRequest,
    @Query('parentCategoryId') parentCategoryId: string
  ) {
    if (!parentCategoryId) {
      throw new Error('parentCategoryId query parameter is required');
    }
    const tenantId = req.user?.tenantId || null;
    return this.subcategoriesService.getSubcategories(tenantId, parentCategoryId);
  }

  @Get(':id')
  async getSubcategoryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    return this.subcategoriesService.getSubcategoryById(tenantId, id);
  }

  @Post()
  async createSubcategory(@Req() req: AuthenticatedRequest, @Body() dto: CreateSubcategoryDto) {
    const tenantId = req.user?.tenantId || null;
    return this.subcategoriesService.createSubcategory(tenantId, dto);
  }

  @Patch(':id')
  async updateSubcategory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Omit<UpdateSubcategoryDto, 'id'>
  ) {
    const tenantId = req.user?.tenantId || null;
    return this.subcategoriesService.updateSubcategory(tenantId, { ...dto, id });
  }

  @Delete(':id')
  async deleteSubcategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    return this.subcategoriesService.deleteSubcategory(tenantId, id);
  }
}


import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(
    @Req() req: AuthenticatedRequest,
    @Query('type') type?: string
  ) {
    const tenantId = req.user?.tenantId || null;
    return this.categoriesService.getCategories(tenantId, type);
  }

  @Get(':id')
  async getCategoryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    return this.categoriesService.getCategoryById(tenantId, id);
  }

  @Post()
  async createCategory(@Req() req: AuthenticatedRequest, @Body() dto: CreateCategoryDto) {
    const tenantId = req.user?.tenantId || null;
    return this.categoriesService.createCategory(tenantId, dto);
  }

  @Patch(':id')
  async updateCategory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Omit<UpdateCategoryDto, 'id'>
  ) {
    const tenantId = req.user?.tenantId || null;
    return this.categoriesService.updateCategory(tenantId, { ...dto, id });
  }

  @Delete(':id')
  async deleteCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    return this.categoriesService.deleteCategory(tenantId, id);
  }

  @Post('seed-defaults')
  async seedDefaultCategories(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || null;
    return this.categoriesService.seedDefaultCategories(tenantId);
  }
}


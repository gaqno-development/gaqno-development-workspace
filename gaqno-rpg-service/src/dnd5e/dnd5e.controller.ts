import { Controller, Get, Post, Param, Query, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Dnd5eService } from './dnd5e.service';

@Controller('dnd5e')
export class Dnd5eController {
  constructor(private readonly dnd5eService: Dnd5eService) {}

  @Get('categories')
  async getCategories() {
    try {
      return await this.dnd5eService.getCategories();
    } catch (error) {
      throw new HttpException('Failed to fetch categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('health/check')
  async checkHealth() {
    try {
      return await this.dnd5eService.checkAPIHealth();
    } catch (error) {
      throw new HttpException('Failed to check API health', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':category/search')
  async searchCategory(@Param('category') category: string, @Query('q') query: string) {
    if (!query || query.length < 2) {
      throw new HttpException('Query parameter "q" is required (minimum 2 characters)', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.dnd5eService.searchCategory(category, query);
    } catch (error) {
      throw new HttpException(`Failed to search category: ${category}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':category/:index/:endpoint')
  async getSpecialEndpoint(
    @Param('category') category: string,
    @Param('index') index: string,
    @Param('endpoint') endpoint: string,
  ) {
    try {
      return await this.dnd5eService.getSpecialEndpoint(category, index, endpoint);
    } catch (error: any) {
      if (error.message === 'NOT_FOUND' || error.message?.includes('NOT_FOUND') || error.statusCode === 404) {
        throw new NotFoundException(`Special endpoint not found: ${category}/${index}/${endpoint}`);
      }
      console.error(`Error fetching special endpoint ${category}/${index}/${endpoint}:`, error?.message || error);
      throw new HttpException(
        `Failed to fetch special endpoint: ${category}/${index}/${endpoint}. ${error?.message || 'Unknown error'}`,
        error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':category/:index')
  async getItem(
    @Param('category') category: string,
    @Param('index') index: string,
    @Query('resolve') resolve?: string,
  ) {
    try {
      const shouldResolve = resolve === 'true' || resolve === '1';
      
      if (shouldResolve) {
        return await this.dnd5eService.getItemWithResolvedReferences(category, index);
      }
      
      return await this.dnd5eService.getItem(category, index);
    } catch (error: any) {
      if (error.message === 'NOT_FOUND' || error.message?.includes('NOT_FOUND') || error.statusCode === 404) {
        throw new NotFoundException(`Item not found: ${category}/${index}`);
      }
      // Log the actual error for debugging
      console.error(`Error fetching item ${category}/${index}:`, error?.message || error);
      throw new HttpException(
        `Failed to fetch item: ${category}/${index}. ${error?.message || 'Unknown error'}`,
        error?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':category')
  async getCategoryList(
    @Param('category') category: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const offsetNum = offset ? parseInt(offset, 10) : undefined;
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      return await this.dnd5eService.getCategoryList(category, offsetNum, limitNum);
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        throw new NotFoundException(`Category not found: ${category}`);
      }
      throw new HttpException(`Failed to fetch category: ${category}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('sync/all')
  async syncAll() {
    try {
      return await this.dnd5eService.syncAll();
    } catch (error) {
      throw new HttpException('Failed to sync all categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('sync/:category')
  async syncCategory(@Param('category') category: string) {
    try {
      return await this.dnd5eService.syncCategory(category);
    } catch (error) {
      throw new HttpException(`Failed to sync category: ${category}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}


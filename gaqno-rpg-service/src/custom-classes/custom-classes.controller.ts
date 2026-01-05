import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { CustomClassesService } from './custom-classes.service';
import { CreateCustomClassDto } from './dto/create-custom-class.dto';
import { UpdateCustomClassDto } from './dto/update-custom-class.dto';
import { GenerateCustomClassDto } from './dto/generate-custom-class.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('campaigns/:campaignId/custom-classes')
export class CustomClassesController {
  constructor(private readonly customClassesService: CustomClassesService) {}

  @Post()
  async createCustomClass(
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateCustomClassDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.customClassesService.createCustomClass(
      campaignId,
      req.user?.sub || '',
      dto
    );
  }

  @Get()
  async getCustomClasses(
    @Param('campaignId') campaignId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.customClassesService.getCustomClassesByCampaign(
      campaignId,
      req.user?.sub || ''
    );
  }

  @Get(':id')
  async getCustomClass(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.customClassesService.getCustomClassById(id, req.user?.sub || '');
  }

  @Patch(':id')
  async updateCustomClass(
    @Param('id') id: string,
    @Body() dto: UpdateCustomClassDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.customClassesService.updateCustomClass(id, req.user?.sub || '', dto);
  }

  @Delete(':id')
  async deleteCustomClass(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.customClassesService.deleteCustomClass(id, req.user?.sub || '');
    return { message: 'Custom class deleted' };
  }

  @Post('generate')
  async generateCustomClass(
    @Param('campaignId') campaignId: string,
    @Body() dto: GenerateCustomClassDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.customClassesService.generateCustomClass(
      campaignId,
      req.user?.sub || '',
      dto
    );
  }

  @Get(':id/spells')
  async getClassSpells(
    @Param('id') id: string,
    @Query('level') level: string,
    @Req() req: AuthenticatedRequest
  ) {
    const spellLevel = level ? parseInt(level, 10) : 9;
    return this.customClassesService.getClassSpells(
      id,
      spellLevel,
      req.user?.sub || ''
    );
  }
}


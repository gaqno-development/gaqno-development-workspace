import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { GenerateStepDto } from './dto/generate-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async getCampaigns(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || null;
    return this.campaignsService.getCampaigns(tenantId, req.user?.sub || '');
  }

  @Get('public')
  async getPublicCampaigns() {
    return this.campaignsService.getPublicCampaigns();
  }

  @Get('my')
  async getMyCampaigns(@Req() req: AuthenticatedRequest) {
    return this.campaignsService.getUserCampaigns(req.user?.sub || '');
  }

  @Get(':id')
  async getCampaign(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.campaignsService.getCampaignById(id, req.user?.sub || '');
  }

  @Post()
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @Req() req: AuthenticatedRequest
  ) {
    const tenantId = req.user?.tenantId || null;
    return this.campaignsService.createCampaign(tenantId, req.user?.sub || '', dto);
  }

  @Patch(':id')
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.campaignsService.updateCampaign(id, req.user?.sub || '', dto);
  }

  @Post(':id/generate-step')
  async generateStep(
    @Param('id') id: string,
    @Body() dto: GenerateStepDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.campaignsService.generateStep(id, req.user?.sub || '', dto);
  }

  @Post(':id/generate-step-variants')
  async generateStepVariants(
    @Param('id') id: string,
    @Body() dto: GenerateStepDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.campaignsService.generateStepVariants(id, req.user?.sub || '', dto);
  }

  @Post(':id/regenerate-step')
  async regenerateStep(
    @Param('id') id: string,
    @Body() dto: GenerateStepDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.campaignsService.regenerateStep(id, req.user?.sub || '', dto);
  }

  @Patch(':id/step')
  async updateStep(
    @Param('id') id: string,
    @Body() dto: UpdateStepDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.campaignsService.updateStep(id, req.user?.sub || '', dto);
  }

  @Post(':id/finalize')
  async finalizeCampaign(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.campaignsService.finalizeCampaign(id, req.user?.sub || '');
  }

  @Delete(':id')
  async deleteCampaign(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.campaignsService.deleteCampaign(id, req.user?.sub || '');
    return { message: 'Campaign deleted' };
  }
}


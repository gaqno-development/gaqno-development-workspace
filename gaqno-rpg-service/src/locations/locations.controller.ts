import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GenerateLocationDto } from './dto/generate-location.dto';
import { GenerateEncounterDto } from './dto/generate-encounter.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('campaigns/:campaignId/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async createLocation(
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateLocationDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.locationsService.createLocation(
      campaignId,
      req.user?.sub || '',
      dto
    );
  }

  @Get()
  async getLocations(
    @Param('campaignId') campaignId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.locationsService.getLocationsByCampaign(
      campaignId,
      req.user?.sub || ''
    );
  }

  @Get(':id')
  async getLocation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.locationsService.getLocationById(id, req.user?.sub || '');
  }

  @Patch(':id')
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.locationsService.updateLocation(id, req.user?.sub || '', dto);
  }

  @Delete(':id')
  async deleteLocation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.locationsService.deleteLocation(id, req.user?.sub || '');
    return { message: 'Location deleted' };
  }

  @Post('generate')
  async generateLocation(
    @Param('campaignId') campaignId: string,
    @Body() dto: GenerateLocationDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.locationsService.generateLocation(
      campaignId,
      req.user?.sub || '',
      dto
    );
  }

  @Post(':id/encounters/generate')
  async generateEncounter(
    @Param('id') id: string,
    @Body() dto: GenerateEncounterDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.locationsService.generateEncounter(
      id,
      req.user?.sub || '',
      dto
    );
  }
}


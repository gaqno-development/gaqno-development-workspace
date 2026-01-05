import { Controller, Get, Req, Headers } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(@Req() req: AuthenticatedRequest, @Headers('x-tenant-id') tenantIdHeader?: string) {
    const tenantId = tenantIdHeader || req.user?.tenantId || null;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const metrics = await this.dashboardService.getMetrics(tenantId);

    return metrics;
  }
}


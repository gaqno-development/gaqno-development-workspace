import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Inject, forwardRef } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { AuthenticatedRequest } from '../types/request.types';
import { RpgWebSocketGateway } from '../websocket/websocket.gateway';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    @Inject(forwardRef(() => RpgWebSocketGateway))
    private readonly websocketGateway: RpgWebSocketGateway
  ) {}

  private normalizeTenantId(tenantId?: string): string | null {
    return tenantId && typeof tenantId === 'string' && tenantId.trim() ? tenantId.trim() : null;
  }

  @Post()
  async createSession(@Req() req: AuthenticatedRequest, @Body() dto: CreateSessionDto) {
    const tenantId = this.normalizeTenantId(req.user?.tenantId);
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.sessionsService.createSession(tenantId, userId, dto);
  }

  @Get()
  async getSessions(@Req() req: AuthenticatedRequest) {
    const tenantId = this.normalizeTenantId(req.user?.tenantId);
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.sessionsService.getSessions(tenantId, userId);
  }

  @Get('code/:code')
  async getSessionByCode(@Param('code') code: string) {
    return this.sessionsService.getSessionByCode(code);
  }

  @Get(':id')
  async getSessionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = this.normalizeTenantId(req.user?.tenantId);
    const userId = req.user?.sub || null;
    return this.sessionsService.getSessionById(id, tenantId, userId);
  }

  @Patch(':id')
  async updateSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto
  ) {
    const tenantId = this.normalizeTenantId(req.user?.tenantId);
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.sessionsService.updateSession(tenantId, userId, id, dto);
  }

  @Delete(':id')
  async deleteSession(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = this.normalizeTenantId(req.user?.tenantId);
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.sessionsService.deleteSession(tenantId, userId, id);
  }

  @Get(':id/masters')
  async getSessionMasters(@Param('id') id: string) {
    return this.sessionsService.getSessionMasters(id);
  }

  @Post(':id/promote-master')
  async promoteToMaster(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { userId: string }
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const result = await this.sessionsService.promoteToMaster(id, userId, body.userId, this.websocketGateway);
    return result;
  }

  @Post(':id/demote-master')
  async demoteFromMaster(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { userId: string }
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const result = await this.sessionsService.demoteFromMaster(id, userId, body.userId, this.websocketGateway);
    return result;
  }

  @Post(':id/renounce-master')
  async renounceMaster(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const result = await this.sessionsService.renounceMaster(id, userId, this.websocketGateway);
    return result;
  }
}


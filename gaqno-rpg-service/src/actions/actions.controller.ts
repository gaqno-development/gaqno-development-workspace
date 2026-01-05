import { Controller, Post, Get, Body, Param, Query, Req, Inject, forwardRef } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { SubmitActionDto } from './dto/submit-action.dto';
import { AuthenticatedRequest } from '../types/request.types';
import { RpgWebSocketGateway } from '../websocket/websocket.gateway';

@Controller('actions')
export class ActionsController {
  constructor(
    private readonly actionsService: ActionsService,
    @Inject(forwardRef(() => RpgWebSocketGateway))
    private readonly websocketGateway: RpgWebSocketGateway
  ) {}

  @Post()
  async submitAction(@Req() req: AuthenticatedRequest, @Body() dto: SubmitActionDto) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const result = await this.actionsService.submitAction(tenantId, userId, dto);
    
    this.websocketGateway.server.to(dto.sessionId).emit('action_result', {
      action: result.action,
      narratorResponse: result.narratorResponse,
      submittedBy: userId
    });
    
    return result;
  }

  @Get('history/:sessionId')
  async getHistory(@Req() req: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.actionsService.getSessionHistory(sessionId, userId);
  }

  @Get('memory/:sessionId')
  async getMemory(@Req() req: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.actionsService.getSessionMemory(sessionId, userId);
  }

  @Get('actions/:sessionId')
  async getActions(@Req() req: AuthenticatedRequest, @Param('sessionId') sessionId: string) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.actionsService.getSessionActions(sessionId, userId);
  }
}


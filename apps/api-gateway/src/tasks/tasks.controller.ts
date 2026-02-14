import {
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { getOrCreateCorrelationId } from '@gaqno-ai-platform/shared-kernel';
import { HEADER_CORRELATION_ID, HEADER_IDEMPOTENCY_KEY } from '@gaqno-ai-platform/shared-kernel';

export class CreateAiTaskDto {
  prompt!: string;
  model?: string;
  creditsRequired!: number;
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard)
  async create(
    @Body() dto: CreateAiTaskDto,
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
    @Headers(HEADER_CORRELATION_ID) correlationId: string | undefined,
    @Headers(HEADER_IDEMPOTENCY_KEY) idempotencyKey: string | undefined,
  ) {
    const correlation = getOrCreateCorrelationId(correlationId);
    return this.tasksService.createTask(
      { orgId, userId, correlationId: correlation, idempotencyKey },
      dto,
    );
  }
}

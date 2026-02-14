import { Body, Controller, Post, Headers } from '@nestjs/common';
import { CreateAiTaskHandler } from './create-ai-task.handler';
import type { CreateAiTaskCommand } from './create-ai-task.handler';
import { HEADER_CORRELATION_ID, HEADER_IDEMPOTENCY_KEY } from '@gaqno-ai-platform/shared-kernel';

export class InternalCreateTaskDto {
  orgId!: string;
  userId!: string;
  prompt!: string;
  model?: string;
  creditsRequired!: number;
  idempotencyKey?: string;
  correlationId?: string;
}

@Controller('internal/tasks')
export class TasksController {
  constructor(private readonly handler: CreateAiTaskHandler) {}

  @Post()
  async create(
    @Body() dto: InternalCreateTaskDto,
    @Headers(HEADER_CORRELATION_ID) correlationId: string | undefined,
    @Headers(HEADER_IDEMPOTENCY_KEY) idempotencyKey: string | undefined,
  ) {
    const cmd: CreateAiTaskCommand = {
      orgId: dto.orgId,
      userId: dto.userId,
      prompt: dto.prompt,
      model: dto.model,
      creditsRequired: dto.creditsRequired,
      idempotencyKey: idempotencyKey ?? dto.idempotencyKey,
      correlationId: correlationId ?? dto.correlationId,
    };
    return this.handler.execute(cmd);
  }
}

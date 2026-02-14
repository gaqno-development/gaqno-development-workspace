import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

export interface CreateTaskContext {
  orgId: string;
  userId: string;
  correlationId: string;
  idempotencyKey?: string;
}

export interface CreateTaskDto {
  prompt: string;
  model?: string;
  creditsRequired: number;
}

@Injectable()
export class TasksService {
  private readonly commandServiceUrl: string;

  constructor(private readonly config: ConfigService) {
    this.commandServiceUrl =
      this.config.get<string>('COMMAND_SERVICE_URL') ?? 'http://localhost:3001';
  }

  async createTask(
    context: CreateTaskContext,
    dto: CreateTaskDto,
  ): Promise<{ taskId: string; status: string }> {
    const response = await axios.post(
      `${this.commandServiceUrl}/internal/tasks`,
      {
        orgId: context.orgId,
        userId: context.userId,
        prompt: dto.prompt,
        model: dto.model,
        creditsRequired: dto.creditsRequired,
        idempotencyKey: context.idempotencyKey,
        correlationId: context.correlationId,
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': context.correlationId,
        },
      },
    );
    return response.data as { taskId: string; status: string };
  }
}

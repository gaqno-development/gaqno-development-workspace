import { AI_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';

export type AiTaskState =
  | 'CREATED'
  | 'STARTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMED_OUT';

export interface AiTaskCreatedPayload {
  taskId: string;
  prompt: string;
  model?: string;
  options?: Record<string, unknown>;
  creditsRequired: number;
}

export interface AiTaskStartedPayload {
  taskId: string;
  externalTaskId?: string;
}

export interface AiTaskCompletedPayload {
  taskId: string;
  result: string | Record<string, unknown>;
  mediaUrls?: string[];
}

export interface AiTaskFailedPayload {
  taskId: string;
  reason: string;
  code?: string;
}

export interface AiTaskTimedOutPayload {
  taskId: string;
}

export type AiTaskEventPayload =
  | AiTaskCreatedPayload
  | AiTaskStartedPayload
  | AiTaskCompletedPayload
  | AiTaskFailedPayload
  | AiTaskTimedOutPayload;

export const AI_TASK_EVENT_TYPES = AI_EVENT_TYPES;

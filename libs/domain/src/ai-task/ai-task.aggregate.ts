import type {
  AiTaskState,
  AiTaskCreatedPayload,
  AiTaskStartedPayload,
  AiTaskCompletedPayload,
  AiTaskFailedPayload,
  AiTaskTimedOutPayload,
  AiTaskEventPayload,
} from './ai-task.events';
import { AI_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';

export interface AiTaskAggregateState {
  taskId: string;
  state: AiTaskState;
  prompt: string;
  model?: string;
  options?: Record<string, unknown>;
  creditsRequired: number;
  externalTaskId?: string;
  result?: string | Record<string, unknown>;
  mediaUrls?: string[];
  failureReason?: string;
  failureCode?: string;
  version: number;
}

const INITIAL_VERSION = 0;

function applyCreated(
  state: AiTaskAggregateState,
  payload: AiTaskCreatedPayload,
): AiTaskAggregateState {
  return {
    ...state,
    taskId: payload.taskId,
    state: 'CREATED',
    prompt: payload.prompt,
    model: payload.model,
    options: payload.options,
    creditsRequired: payload.creditsRequired,
    version: state.version + 1,
  };
}

function applyStarted(
  state: AiTaskAggregateState,
  payload: AiTaskStartedPayload,
): AiTaskAggregateState {
  return {
    ...state,
    state: 'STARTED',
    externalTaskId: payload.externalTaskId,
    version: state.version + 1,
  };
}

function applyCompleted(
  state: AiTaskAggregateState,
  payload: AiTaskCompletedPayload,
): AiTaskAggregateState {
  return {
    ...state,
    state: 'COMPLETED',
    result: payload.result,
    mediaUrls: payload.mediaUrls,
    version: state.version + 1,
  };
}

function applyFailed(
  state: AiTaskAggregateState,
  payload: AiTaskFailedPayload,
): AiTaskAggregateState {
  return {
    ...state,
    state: 'FAILED',
    failureReason: payload.reason,
    failureCode: payload.code,
    version: state.version + 1,
  };
}

function applyTimedOut(
  state: AiTaskAggregateState,
  payload: AiTaskTimedOutPayload,
): AiTaskAggregateState {
  return {
    ...state,
    state: 'TIMED_OUT',
    version: state.version + 1,
  };
}

const APPLY: Record<
  string,
  (
    s: AiTaskAggregateState,
    p: AiTaskEventPayload,
  ) => AiTaskAggregateState
> = {
  [AI_EVENT_TYPES.AI_TASK_CREATED]: applyCreated as (
    s: AiTaskAggregateState,
    p: AiTaskEventPayload,
  ) => AiTaskAggregateState,
  [AI_EVENT_TYPES.AI_TASK_STARTED]: applyStarted as (
    s: AiTaskAggregateState,
    p: AiTaskEventPayload,
  ) => AiTaskAggregateState,
  [AI_EVENT_TYPES.AI_TASK_COMPLETED]: applyCompleted as (
    s: AiTaskAggregateState,
    p: AiTaskEventPayload,
  ) => AiTaskAggregateState,
  [AI_EVENT_TYPES.AI_TASK_FAILED]: applyFailed as (
    s: AiTaskAggregateState,
    p: AiTaskEventPayload,
  ) => AiTaskAggregateState,
  [AI_EVENT_TYPES.AI_TASK_TIMED_OUT]: applyTimedOut as (
    s: AiTaskAggregateState,
    p: AiTaskEventPayload,
  ) => AiTaskAggregateState,
};

export class AiTaskAggregate {
  private state: AiTaskAggregateState;

  constructor(aggregateId: string, events: Array<{ eventType: string; payload: AiTaskEventPayload }> = []) {
    this.state = {
      taskId: aggregateId,
      state: 'CREATED',
      prompt: '',
      creditsRequired: 0,
      version: INITIAL_VERSION,
    };
    for (const { eventType, payload } of events) {
      const fn = APPLY[eventType];
      if (fn) this.state = fn(this.state, payload);
    }
  }

  getState(): Readonly<AiTaskAggregateState> {
    return this.state;
  }

  getVersion(): number {
    return this.state.version;
  }

  getTaskId(): string {
    return this.state.taskId;
  }

  create(prompt: string, creditsRequired: number, model?: string, options?: Record<string, unknown>): { eventType: string; payload: AiTaskCreatedPayload } | null {
    if (this.state.version !== INITIAL_VERSION) return null;
    return {
      eventType: AI_EVENT_TYPES.AI_TASK_CREATED,
      payload: {
        taskId: this.state.taskId,
        prompt,
        creditsRequired,
        model,
        options,
      },
    };
  }
}

import { AiTaskAggregate } from './ai-task.aggregate';
import { AI_EVENT_TYPES } from '@gaqno-ai-platform/shared-kernel';
import type { AiTaskEventPayload } from './ai-task.events';

describe('AiTaskAggregate', () => {
  it('starts with CREATED after apply AiTaskCreated', () => {
    const aggregateId = 'task-1';
    const events: Array<{ eventType: string; payload: AiTaskEventPayload }> = [
      {
        eventType: AI_EVENT_TYPES.AI_TASK_CREATED,
        payload: {
          taskId: aggregateId,
          prompt: 'Hello',
          creditsRequired: 10,
          model: 'gpt-4',
        },
      },
    ];
    const aggregate = new AiTaskAggregate(aggregateId, events);
    expect(aggregate.getState().state).toBe('CREATED');
    expect(aggregate.getState().prompt).toBe('Hello');
    expect(aggregate.getState().creditsRequired).toBe(10);
    expect(aggregate.getVersion()).toBe(1);
  });

  it('create() returns event when version is 0', () => {
    const aggregate = new AiTaskAggregate('task-2', []);
    const result = aggregate.create('Prompt', 5);
    expect(result).not.toBeNull();
    expect(result?.eventType).toBe(AI_EVENT_TYPES.AI_TASK_CREATED);
    expect(result?.payload.prompt).toBe('Prompt');
    expect(result?.payload.creditsRequired).toBe(5);
  });

  it('create() returns null when already created', () => {
    const aggregate = new AiTaskAggregate('task-3', [
      {
        eventType: AI_EVENT_TYPES.AI_TASK_CREATED,
        payload: {
          taskId: 'task-3',
          prompt: 'Done',
          creditsRequired: 1,
        },
      },
    ]);
    const result = aggregate.create('Again', 1);
    expect(result).toBeNull();
  });
});

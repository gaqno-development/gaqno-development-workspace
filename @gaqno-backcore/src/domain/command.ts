import type { OrgContext } from '../multitenancy/org-context';

export interface Command<TPayload = unknown> {
  payload: TPayload;
  orgId: string;
  correlationId?: string;
  idempotencyKey?: string;
}

export interface CommandWithContext<TPayload = unknown> {
  payload: TPayload;
  context: OrgContext;
}

export function withOrgContext<T>(cmd: Command<T>, context: OrgContext): CommandWithContext<T> {
  return { payload: cmd.payload, context };
}

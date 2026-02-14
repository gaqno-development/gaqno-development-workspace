export interface OrgContext {
  orgId: string;
  userId?: string;
  correlationId?: string;
}

export const ORG_HEADER = 'x-org-id';
export const USER_HEADER = 'x-user-id';
export const CORRELATION_HEADER = 'x-correlation-id';

export function createOrgContext(params: {
  orgId: string;
  userId?: string;
  correlationId?: string;
}): OrgContext {
  return {
    orgId: params.orgId,
    userId: params.userId,
    correlationId: params.correlationId,
  };
}

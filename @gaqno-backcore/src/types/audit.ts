export type AuditAction = 'user.updated' | 'user.role-changed' | 'org.created' | 'org.updated' | 'auth.sign-in' | 'auth.sign-out';

export type AuditEvent = {
  id: string;
  action: AuditAction;
  actorId: string;
  targetId?: string;
  orgId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
};


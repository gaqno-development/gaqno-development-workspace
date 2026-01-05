export type AuditAction = 'user.created' | 'user.updated' | 'user.deleted' | 'user.role-changed' | 'org.created' | 'org.updated' | 'org.deleted' | 'auth.sign-in' | 'auth.sign-out';

export type AuditEvent = {
  id: string;
  action: AuditAction;
  actorId: string;
  targetId?: string;
  orgId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
};


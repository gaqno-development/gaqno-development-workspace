export type UserStatus = 'active' | 'invited' | 'blocked' | 'inactive';

export type UserRecord = {
  id: string;
  email: string;
  tenantId?: string;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};


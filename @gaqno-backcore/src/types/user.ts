export type UserStatus = 'active' | 'invited' | 'blocked';

export type UserRecord = {
  id: string;
  email: string;
  roles: string[];
  orgId?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};


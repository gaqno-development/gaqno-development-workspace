export type TenantStatus = 'active' | 'suspended' | 'inactive';

export type TenantRecord = {
  id: string;
  name: string;
  status: TenantStatus;
  plan: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};


export type BranchRecord = {
  id: string;
  tenantId: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type BranchContext = {
  branchId: string;
  tenantId: string;
  userId: string;
};


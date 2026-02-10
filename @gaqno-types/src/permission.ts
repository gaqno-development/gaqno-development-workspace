export type RoleScope = "GLOBAL" | "TENANT" | "BRANCH";

export type FeatureModule =
  | "CRM"
  | "PDV"
  | "ERP"
  | "FINANCE"
  | "ADMIN"
  | "PLATFORM";

export type RoleRecord = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  scope: RoleScope;
  tenantId: string | null;
  isSystem: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type PermissionRecord = {
  id: string;
  key: string;
  module: FeatureModule;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
};

export type UserRoleRecord = {
  id: string;
  userId: string;
  roleId: string;
  branchId: string | null;
  grantedBy: string | null;
  grantedAt: string;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
};

export type RolePermissionRecord = {
  id: string;
  roleId: string;
  permissionId: string;
  conditions: Record<string, unknown> | null;
  createdAt: string;
};

export type FeatureFlagRecord = {
  id: string;
  tenantId: string;
  module: FeatureModule;
  isEnabled: boolean;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

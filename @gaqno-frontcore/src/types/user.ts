export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export enum FeatureModule {
  SYSTEM = 'SYSTEM',
  CRM = 'CRM',
  FINANCE = 'FINANCE',
  ERP = 'ERP',
  PDV = 'PDV',
  BOOK_CREATOR = 'BOOK_CREATOR',
}

export enum FeaturePermissionLevel {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  ACCESS = 'ACCESS',
}

export interface IFeatureRole {
  id: string
  feature_key: FeatureModule
  role_key: FeaturePermissionLevel
  role_name: string
  description?: string
  is_global: boolean
  created_at: string
  updated_at: string
}

export interface IUserFeaturePermission {
  id: string
  user_id: string
  profile_id?: string
  tenant_id?: string | null
  feature_key: FeatureModule
  role_key: FeaturePermissionLevel
  granted_by?: string
  granted_at: string
  created_at: string
  updated_at: string
}

export interface IFeaturePermissionMap {
  [feature: string]: {
    roles: FeaturePermissionLevel[]
    tenant_id?: string | null
  }
}

export interface IUser {
  id: string
  email?: string
  created_at: string
  updated_at: string
}

export interface IUserProfile {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  role: UserRole
  department?: string
  tenant_id?: string
  country_iso?: string
  is_root_admin?: boolean
  feature_permissions?: IFeaturePermissionMap
  created_at: string
  updated_at: string
}

export interface ICreateUserRequest {
  email: string
  password: string
  name: string
  role: UserRole
  department?: string
}

export interface IUpdateUserRequest {
  name?: string
  avatar_url?: string
  role?: UserRole
  department?: string
}


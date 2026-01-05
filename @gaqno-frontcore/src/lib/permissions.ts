import { FeatureModule, FeaturePermissionLevel, IUserProfile, IFeaturePermissionMap } from '../types/user'
import { PERMISSION_HIERARCHY } from '../types/permissions'

export const isRootAdmin = (profile: IUserProfile | null | undefined): boolean => {
  return profile?.is_root_admin === true
}

export const hasFeatureAccess = (
  profile: IUserProfile | null | undefined,
  feature: FeatureModule,
  tenantId?: string | null
): boolean => {
  if (!profile) return false
  if (isRootAdmin(profile)) return true

  const featurePermissions = profile.feature_permissions as IFeaturePermissionMap | undefined
  if (!featurePermissions) return false

  const featureKey = feature as string
  const featurePerm = featurePermissions[featureKey]

  if (!featurePerm || !featurePerm.roles || featurePerm.roles.length === 0) {
    return false
  }

  if (tenantId !== undefined && tenantId !== null) {
    if (featurePerm.tenant_id !== tenantId) {
      return false
    }
  }

  return true
}

export const hasFeatureRole = (
  profile: IUserProfile | null | undefined,
  feature: FeatureModule,
  minRole: FeaturePermissionLevel,
  tenantId?: string | null
): boolean => {
  if (!profile) return false
  if (isRootAdmin(profile)) return true

  const featurePermissions = profile.feature_permissions as IFeaturePermissionMap | undefined
  if (!featurePermissions) return false

  const featureKey = feature as string
  const featurePerm = featurePermissions[featureKey]

  if (!featurePerm || !featurePerm.roles || featurePerm.roles.length === 0) {
    return false
  }

  if (tenantId !== undefined && tenantId !== null) {
    if (featurePerm.tenant_id !== tenantId) {
      return false
    }
  }

  const userRoles = featurePerm.roles
  return userRoles.some(role => PERMISSION_HIERARCHY[role] >= PERMISSION_HIERARCHY[minRole])
}

export const canManageFeatureRoles = (
  profile: IUserProfile | null | undefined,
  feature: FeatureModule,
  tenantId?: string | null
): boolean => {
  return hasFeatureRole(profile, feature, FeaturePermissionLevel.ADMIN, tenantId)
}

export const getAccessibleFeatures = (
  profile: IUserProfile | null | undefined
): FeatureModule[] => {
  if (!profile) return []
  if (isRootAdmin(profile)) {
    return Object.values(FeatureModule)
  }

  const featurePermissions = profile.feature_permissions as IFeaturePermissionMap | undefined
  if (!featurePermissions) return []

  return Object.keys(featurePermissions)
    .filter(key => {
      const perm = featurePermissions[key]
      return perm && perm.roles && perm.roles.length > 0
    })
    .map(key => key as FeatureModule)
}

export const getUserFeatureRoles = (
  profile: IUserProfile | null | undefined,
  feature: FeatureModule
): FeaturePermissionLevel[] => {
  if (!profile) return []
  if (isRootAdmin(profile)) {
    return Object.values(FeaturePermissionLevel)
  }

  const featurePermissions = profile.feature_permissions as IFeaturePermissionMap | undefined
  if (!featurePermissions) return []

  const featureKey = feature as string
  const featurePerm = featurePermissions[featureKey]

  return featurePerm?.roles || []
}

export const getHighestFeatureRole = (
  profile: IUserProfile | null | undefined,
  feature: FeatureModule
): FeaturePermissionLevel | null => {
  const roles = getUserFeatureRoles(profile, feature)
  if (roles.length === 0) return null

  return roles.reduce((highest, current) => {
    return PERMISSION_HIERARCHY[current] > PERMISSION_HIERARCHY[highest] ? current : highest
  })
}

export const formatFeatureLabel = (feature: FeatureModule): string => {
  const labels: Record<FeatureModule, string> = {
    [FeatureModule.SYSTEM]: 'System',
    [FeatureModule.CRM]: 'CRM',
    [FeatureModule.FINANCE]: 'Finance',
    [FeatureModule.ERP]: 'ERP',
    [FeatureModule.PDV]: 'PDV',
    [FeatureModule.BOOK_CREATOR]: 'Book Creator',
  }

  return labels[feature] || feature
}

export const formatRoleLabel = (role: FeaturePermissionLevel): string => {
  const labels: Record<FeaturePermissionLevel, string> = {
    [FeaturePermissionLevel.ADMIN]: 'Administrator',
    [FeaturePermissionLevel.MANAGER]: 'Manager',
    [FeaturePermissionLevel.USER]: 'User',
    [FeaturePermissionLevel.ACCESS]: 'Access',
  }

  return labels[role] || role
}


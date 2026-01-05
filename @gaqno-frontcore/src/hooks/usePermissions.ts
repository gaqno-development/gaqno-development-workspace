import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { FeatureModule, FeaturePermissionLevel } from '../types/user'
import {
  isRootAdmin,
  hasFeatureAccess,
  hasFeatureRole,
  canManageFeatureRoles,
  getAccessibleFeatures,
  getUserFeatureRoles,
  getHighestFeatureRole,
} from '../lib/permissions'

export const useIsRootAdmin = () => {
  const { profile } = useAuth()
  return useMemo(() => isRootAdmin(profile), [profile])
}

export const useHasFeature = (feature: FeatureModule, tenantId?: string | null) => {
  const { profile } = useAuth()
  return useMemo(
    () => hasFeatureAccess(profile, feature, tenantId),
    [profile, feature, tenantId]
  )
}

export const useHasFeatureRole = (
  feature: FeatureModule,
  minRole: FeaturePermissionLevel,
  tenantId?: string | null
) => {
  const { profile } = useAuth()
  return useMemo(
    () => hasFeatureRole(profile, feature, minRole, tenantId),
    [profile, feature, minRole, tenantId]
  )
}

export const useCanManageFeatureRoles = (feature: FeatureModule, tenantId?: string | null) => {
  const { profile } = useAuth()
  return useMemo(
    () => canManageFeatureRoles(profile, feature, tenantId),
    [profile, feature, tenantId]
  )
}

export const useAccessibleFeatures = () => {
  const { profile } = useAuth()
  return useMemo(() => getAccessibleFeatures(profile), [profile])
}

export const useUserFeatureRoles = (feature: FeatureModule) => {
  const { profile } = useAuth()
  return useMemo(() => getUserFeatureRoles(profile, feature), [profile, feature])
}

export const useHighestFeatureRole = (feature: FeatureModule) => {
  const { profile } = useAuth()
  return useMemo(() => getHighestFeatureRole(profile, feature), [profile, feature])
}

export const usePermissions = () => {
  const { profile, loading } = useAuth()
  const isRoot = useIsRootAdmin()
  const accessibleFeatures = useAccessibleFeatures()

  const hasAccess = useMemo(
    () => (feature: FeatureModule, tenantId?: string | null) => {
      return hasFeatureAccess(profile, feature, tenantId)
    },
    [profile]
  )

  const hasRole = useMemo(
    () => (feature: FeatureModule, minRole: FeaturePermissionLevel, tenantId?: string | null) => {
      return hasFeatureRole(profile, feature, minRole, tenantId)
    },
    [profile]
  )

  const canManage = useMemo(
    () => (feature: FeatureModule, tenantId?: string | null) => {
      return canManageFeatureRoles(profile, feature, tenantId)
    },
    [profile]
  )

  return {
    profile,
    loading,
    isRootAdmin: isRoot,
    accessibleFeatures,
    hasAccess,
    hasRole,
    canManage,
  }
}


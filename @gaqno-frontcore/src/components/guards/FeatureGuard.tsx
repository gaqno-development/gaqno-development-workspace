import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { FeatureModule, FeaturePermissionLevel } from '@gaqno-dev/frontcore/types/user'
import { useHasFeatureRole } from '@gaqno-dev/frontcore/hooks/usePermissions'
import { useAuth } from '@gaqno-dev/frontcore/hooks/useAuth'
import { formatFeatureLabel } from '@gaqno-dev/frontcore/lib/permissions'

interface IFeatureGuardProps {
  feature: FeatureModule
  minRole?: FeaturePermissionLevel
  tenantId?: string | null
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const FeatureGuard: React.FC<IFeatureGuardProps> = ({
  feature,
  minRole = FeaturePermissionLevel.USER,
  tenantId,
  children,
  fallback,
  redirectTo = '/dashboard',
}) => {
  const navigate = useNavigate()
  const { loading } = useAuth()
  const hasAccess = useHasFeatureRole(feature, minRole, tenantId)

  useEffect(() => {
    if (!loading && !hasAccess) {
      if (redirectTo) {
        navigate(redirectTo)
      }
    }
  }, [hasAccess, loading, navigate, redirectTo])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have access to the {formatFeatureLabel(feature)} module.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

FeatureGuard.displayName = 'FeatureGuard'


import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@gaqno-development/frontcore/hooks/useAuth'
import { useWhiteLabel } from '@gaqno-development/frontcore/hooks/useWhiteLabel'
import { useBranding } from '@gaqno-development/frontcore/hooks/admin/useBranding'
import { ROUTES } from '@gaqno-development/frontcore/lib/constants'
import { useMemo } from 'react'

export const useHeader = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { signOut, profile, user } = useAuth()
  const { config: whiteLabelConfig } = useWhiteLabel()

  // Extract tenant ID from pathname if we're on a tenant details page
  const tenantIdFromPath = useMemo(() => {
    const match = pathname.match(/\/admin\/tenants\/([^\/]+)/)
    return match ? match[1] : null
  }, [pathname])

  // Get branding config for the tenant being viewed (if any)
  // Only fetch when tenantIdFromPath is truthy, pass empty string which will be disabled by enabled: !!tenantId
  const { brandingConfig: viewedTenantBranding } = useBranding(tenantIdFromPath ?? '')

  // Use viewed tenant branding if we're on a tenant details page, otherwise use global config
  const displayConfig = tenantIdFromPath && viewedTenantBranding ? viewedTenantBranding : whiteLabelConfig

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.LOGIN)
  }

  return {
    profile,
    user,
    whiteLabelConfig: displayConfig,
    handleSignOut,
  }
}


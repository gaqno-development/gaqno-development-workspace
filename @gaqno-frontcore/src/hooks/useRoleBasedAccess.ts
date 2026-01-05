import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { UserRole } from '../types/user'
import { ROUTES } from '../lib/constants'
import { isRootAdmin } from '../lib/permissions'

export const useRoleBasedAccess = (requiredRole: UserRole) => {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()

  const isAuthorized = profile?.role === requiredRole || 
                       profile?.role === UserRole.ADMIN || 
                       isRootAdmin(profile)

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        navigate(ROUTES.LOGIN)
        return
      }

      if (!isAuthorized) {
        navigate(ROUTES.UNAUTHORIZED)
        return
      }
    }
  }, [profile, loading, navigate, isAuthorized])

  return { 
    isAuthorized: !loading && isAuthorized,
    loading,
  }
}


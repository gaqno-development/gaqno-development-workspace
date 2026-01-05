import { useApiQuery } from './useApiQuery'
import { ssoAxiosClient } from '../utils/api/sso-client'
import { useAuth } from './useAuth'

export const useUserPermissions = () => {
  const { user } = useAuth()

  const { data: permissionsData, isLoading } = useApiQuery<{ permissions: string[] }>(
    ssoAxiosClient,
    ['user-permissions', user?.id],
    async () => {
      const { data } = await ssoAxiosClient.get<{ permissions: string[] }>('/permissions/my-permissions')
      return data
    },
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  )

  const hasPlatformAll = permissionsData?.permissions?.includes('platform.all') ?? false
  const hasPermission = (permission: string) => {
    if (hasPlatformAll) return true
    return permissionsData?.permissions?.includes(permission) ?? false
  }

  return {
    permissions: permissionsData?.permissions ?? [],
    hasPlatformAll,
    hasPermission,
    isLoading,
  }
}


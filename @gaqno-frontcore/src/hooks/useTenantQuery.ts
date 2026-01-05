import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useTenant } from '../contexts/TenantContext'
import { Database } from '../types/database'

type TableName = keyof Database['public']['Tables']

export function useTenantQuery<TData = unknown>(
  queryKey: string[],
  table: TableName,
  queryBuilder: (query: any, tenantId: string | null, isAdmin: boolean) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
) {
  const { tenantId, isAdmin, isLoading: tenantLoading } = useTenant()

  return useQuery({
    queryKey: [...queryKey, tenantId, isAdmin],
    queryFn: async () => {
      if (tenantLoading) {
        throw new Error('Tenant context is still loading')
      }

      return queryBuilder(null, tenantId, isAdmin)
    },
    enabled: options?.enabled !== false && !tenantLoading && (isAdmin || !!tenantId),
    ...options,
  })
}

export function useTenantMutation<TData = unknown, TVariables = unknown>(
  table: TableName,
  mutationBuilder: (
    query: any,
    variables: TVariables,
    tenantId: string | null,
    isAdmin: boolean
  ) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient()
  const { tenantId, isAdmin } = useTenant()

  const { onSuccess, ...restOptions } = options || {}
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      return mutationBuilder(null, variables, tenantId, isAdmin)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === table || query.queryKey.includes(table as string)
      })
      if (onSuccess) {
        onSuccess(data as any, undefined as any, undefined as any, undefined as any)
      }
    },
    ...restOptions,
  })
}

export function useTenantScopedQuery<TData = unknown>(
  queryKey: string[],
  queryFn: (tenantId: string | null, isAdmin: boolean) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
) {
  const { tenantId, isAdmin, isLoading: tenantLoading } = useTenant()

  return useQuery({
    queryKey: [...queryKey, tenantId, isAdmin],
    queryFn: () => queryFn(tenantId, isAdmin),
    enabled: options?.enabled !== false && !tenantLoading && (isAdmin || !!tenantId),
    ...options,
  })
}


import { useApiQuery } from '../useApiQuery'
import { useApiMutation } from '../useApiMutation'
import { IDomain } from '../../types/admin'
import { useQueryClient } from '@tanstack/react-query'
import { ssoAxiosClient } from '../../utils/api/sso-client'

export const useDomains = (tenantId?: string) => {
    const queryClient = useQueryClient()

    const { data: domains, isLoading, refetch } = useApiQuery<IDomain[]>(
        ssoAxiosClient,
        ['domains', tenantId],
        async () => {
            const params = tenantId ? { tenant_id: tenantId } : {}
            const response = await ssoAxiosClient.get('/domains', { params })
            return response.data || []
        },
        {
            staleTime: 5 * 60 * 1000,
        }
    )

    const createMutation = useApiMutation<IDomain, Partial<IDomain>>(
        ssoAxiosClient,
        async (domainData) => {
            const response = await ssoAxiosClient.post('/domains', domainData)
            return response.data
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['domains'] })
            },
        }
    )

    const updateMutation = useApiMutation<IDomain, { id: string; data: Partial<IDomain> }>(
        ssoAxiosClient,
        async ({ id, data }) => {
            const response = await ssoAxiosClient.patch(`/domains/${id}`, data)
            return response.data
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['domains'] })
            },
        }
    )

    const deleteMutation = useApiMutation<void, string>(
        ssoAxiosClient,
        async (id) => {
            await ssoAxiosClient.delete(`/domains/${id}`)
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['domains'] })
            },
        }
    )

    const verifyMutation = useApiMutation<IDomain, string>(
        ssoAxiosClient,
        async (id) => {
            const response = await ssoAxiosClient.post(`/domains/${id}/verify`)
            return response.data
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['domains'] })
            },
        }
    )

    const checkSslMutation = useApiMutation<IDomain, string>(
        ssoAxiosClient,
        async (id) => {
            const response = await ssoAxiosClient.post(`/domains/${id}/check-ssl`)
            return response.data
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['domains'] })
            },
        }
    )

    const createDomain = async (data: Partial<IDomain>) => {
        try {
            await createMutation.mutateAsync(data)
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    const updateDomain = async (id: string, data: Partial<IDomain>) => {
        try {
            await updateMutation.mutateAsync({ id, data })
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    const deleteDomain = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id)
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    const verifyDomain = async (id: string) => {
        try {
            await verifyMutation.mutateAsync(id)
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    const checkSsl = async (id: string) => {
        try {
            await checkSslMutation.mutateAsync(id)
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    return {
        domains: domains || [],
        isLoading,
        createDomain,
        updateDomain,
        deleteDomain,
        verifyDomain,
        checkSsl,
        refetch,
    }
}


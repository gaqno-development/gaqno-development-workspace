import { useApiQuery } from '../useApiQuery'
import { useApiMutation } from '../useApiMutation'
import { ITenantCosts, ITenantCostsSummary } from '../../types/admin'
import { useQueryClient } from '@tanstack/react-query'
import { ssoAxiosClient } from '../../utils/api/sso-client'

export const useTenantCosts = (tenantId: string) => {
    const queryClient = useQueryClient()

    const { data: costs, isLoading, refetch } = useApiQuery<ITenantCosts[]>(
        ssoAxiosClient,
        ['tenant-costs', tenantId],
        async () => {
            const response = await ssoAxiosClient.get(`/tenants/${tenantId}/costs`)
            return response.data || []
        },
        {
            enabled: !!tenantId,
            staleTime: 5 * 60 * 1000,
        }
    )

    const { data: summary, isLoading: isLoadingSummary } = useApiQuery<ITenantCostsSummary>(
        ssoAxiosClient,
        ['tenant-costs-summary', tenantId],
        async () => {
            const response = await ssoAxiosClient.get(`/tenants/${tenantId}/costs/summary`)
            return response.data
        },
        {
            enabled: !!tenantId,
            staleTime: 5 * 60 * 1000,
        }
    )

    const syncMutation = useApiMutation<void, void>(
        ssoAxiosClient,
        async () => {
            await ssoAxiosClient.post(`/tenants/${tenantId}/costs/sync`)
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['tenant-costs', tenantId] })
                queryClient.invalidateQueries({ queryKey: ['tenant-costs-summary', tenantId] })
            },
        }
    )

    const syncCosts = async () => {
        try {
            await syncMutation.mutateAsync()
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    return {
        costs: costs || [],
        summary,
        isLoading: isLoading || isLoadingSummary,
        syncCosts,
        refetch,
    }
}


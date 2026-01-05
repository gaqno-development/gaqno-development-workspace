import { useApiQuery } from '../useApiQuery'
import { useApiMutation } from '../useApiMutation'
import { ITenant } from '../../types/admin'
import { useQueryClient } from '@tanstack/react-query'
import { ssoAxiosClient } from '../../utils/api/sso-client'

export const useTenants = () => {
    const queryClient = useQueryClient()

    const { data: tenants, isLoading, refetch } = useApiQuery<ITenant[]>(
        ssoAxiosClient,
        ['tenants'],
        async () => {
            const response = await ssoAxiosClient.get('/orgs')
            const orgs = response.data || []
            
            const tenantsWithBranding = await Promise.all(
                orgs.map(async (org: any) => {
                    try {
                        const brandingResponse = await ssoAxiosClient.get('/whitelabel/configs', {
                            params: { tenant_id: org.id }
                        })
                        const branding = brandingResponse.data?.[0] || null
                        return {
                            ...org,
                            tenant_id: org.id,
                            whitelabel_configs: branding ? {
                                logo_url: branding.logo_url,
                                company_name: branding.company_name,
                                app_name: branding.app_name,
                                primary_color: branding.primary_color,
                                secondary_color: branding.secondary_color
                            } : null
                        }
                    } catch {
                        return {
                            ...org,
                            tenant_id: org.id,
                            whitelabel_configs: null
                        }
                    }
                })
            )
            
            return tenantsWithBranding.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        }
    )

    const createMutation = useApiMutation<ITenant, Partial<ITenant>>(
        ssoAxiosClient,
        async (tenantData) => {
            const response = await ssoAxiosClient.post('/orgs', {
                name: tenantData.name
            })
            return {
                ...response.data,
                tenant_id: response.data.id,
                whitelabel_configs: null
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['tenants'] })
            }
        }
    )

    const updateMutation = useApiMutation<ITenant, { id: string; data: Partial<ITenant> }>(
        ssoAxiosClient,
        async ({ id, data }) => {
            const response = await ssoAxiosClient.patch(`/orgs/${id}`, {
                name: data.name,
                status: data.status
            })
            return {
                ...response.data,
                tenant_id: response.data.id,
                whitelabel_configs: null
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['tenants'] })
            }
        }
    )

    const deleteMutation = useApiMutation<void, string>(
        ssoAxiosClient,
        async (id) => {
            await ssoAxiosClient.delete(`/orgs/${id}`)
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['tenants'] })
            }
        }
    )

    const createTenant = async (data: Partial<ITenant>) => {
        try {
            await createMutation.mutateAsync(data)
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    const updateTenant = async (id: string, data: Partial<ITenant>) => {
        try {
            await updateMutation.mutateAsync({ id, data })
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    const deleteTenant = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id)
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    return {
        tenants,
        isLoading,
        createTenant,
        updateTenant,
        deleteTenant,
        refetch
    }
}


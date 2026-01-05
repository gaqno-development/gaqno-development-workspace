import { useApiQuery } from '../useApiQuery'
import { useApiMutation } from '../useApiMutation'
import { IBrandingConfig } from '../../types/admin'
import { ssoAxiosClient } from '../../utils/api/sso-client'
import { useQueryClient } from '@tanstack/react-query'

export const useBranding = (tenantId: string) => {
    const queryClient = useQueryClient()

    const { data: brandingConfig, isLoading, refetch } = useApiQuery<IBrandingConfig | null>(
        ssoAxiosClient,
        ['branding', tenantId],
        async () => {
            try {
                const response = await ssoAxiosClient.get('/whitelabel/configs', {
                    params: { tenant_id: tenantId }
                })
                const configs = response.data
                if (configs && configs.length > 0) {
                    return configs[0]
                }
                return {
                    id: '',
                    tenant_id: tenantId,
                    logo_url: null,
                    favicon_url: null,
                    primary_color: '#000000',
                    secondary_color: '#ffffff',
                    font_family: null,
                    app_name: null,
                    custom_css: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            } catch (error: any) {
                if (error.response?.status === 404) {
                    return {
                        id: '',
                        tenant_id: tenantId,
                        logo_url: null,
                        favicon_url: null,
                        primary_color: '#000000',
                        secondary_color: '#ffffff',
                        font_family: null,
                        app_name: null,
                        custom_css: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                }
                throw error
            }
        },
        {
            enabled: !!tenantId
        }
    )

    const updateMutation = useApiMutation<IBrandingConfig, Partial<IBrandingConfig>>(
        ssoAxiosClient,
        async (data) => {
            if (brandingConfig?.id) {
                const response = await ssoAxiosClient.patch(`/whitelabel/configs/${brandingConfig.id}`, data)
                return response.data
            } else {
                const response = await ssoAxiosClient.post('/whitelabel/configs', { ...data, tenant_id: tenantId })
                return response.data
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['branding', tenantId] })
            }
        }
    )

    const updateBranding = async (data: Partial<IBrandingConfig>) => {
        try {
            await updateMutation.mutateAsync(data)
            return { success: true, error: null }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    return {
        brandingConfig,
        isLoading,
        updateBranding,
        refetch
    }
}


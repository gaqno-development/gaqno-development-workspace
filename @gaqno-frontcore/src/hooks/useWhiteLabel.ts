import { useMemo, useEffect, useRef } from 'react'
import { useWhiteLabelStore } from '../store/whiteLabelStore'
import { useApiQuery } from './useApiQuery'
import { ssoAxiosClient } from '../utils/api/sso-client'
import { IWhiteLabelConfig } from '../types/whitelabel'

export const useWhiteLabel = () => {
  const setConfig = useWhiteLabelStore((state) => state.setConfig)
  const setLoading = useWhiteLabelStore((state) => state.setLoading)
  const setError = useWhiteLabelStore((state) => state.setError)
  const setConfigRef = useRef(setConfig)
  const setLoadingRef = useRef(setLoading)
  const setErrorRef = useRef(setError)
  setConfigRef.current = setConfig
  setLoadingRef.current = setLoading
  setErrorRef.current = setError
  const lastSyncedRef = useRef<string | null>(null)

  const domain = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.hostname || ''
  }, [])

  const { data: whiteLabelConfig, isLoading, error: queryError, refetch } = useApiQuery<IWhiteLabelConfig | null>(
    ssoAxiosClient,
    ['white-label-config', domain],
    async () => {
      if (!domain) return null

      try {
        const response = await ssoAxiosClient.get('/whitelabel/configs', {
          params: { domain }
        })
        const configs = response.data
        return configs && configs.length > 0 ? configs[0] : null
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    {
      enabled: !!domain && typeof window !== 'undefined',
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  const storeConfig = useWhiteLabelStore((state) => state.config)

  useEffect(() => {
    const configKey = whiteLabelConfig ? JSON.stringify(whiteLabelConfig) : 'null'
    const errorKey = queryError?.message ?? 'null'
    const syncKey = `${configKey}-${isLoading}-${errorKey}`
    
    if (syncKey === lastSyncedRef.current) {
      return
    }
    
    lastSyncedRef.current = syncKey

    if (whiteLabelConfig !== undefined) {
      setConfigRef.current(whiteLabelConfig)
    }
    setLoadingRef.current(isLoading)
    setErrorRef.current(queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null)
  }, [whiteLabelConfig, isLoading, queryError])

  const returnConfig = useMemo(() => whiteLabelConfig ?? storeConfig, [whiteLabelConfig, storeConfig])
  return {
    config: returnConfig,
    loading: isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null,
    fetchWhiteLabelConfig: () => refetch(),
  }
}

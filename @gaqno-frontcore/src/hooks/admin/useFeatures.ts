import { useMemo } from 'react'
import { IFeature } from '../../types/admin'

export const useFeatures = (tenantId: string) => {
    const mergedFeatures = useMemo<IFeature[]>(() => {
        return []
    }, [])

    const updateFeature = async (featureId: string, data: { enabled: boolean }) => {
        return { success: false, error: 'Feature updates are unavailable' }
    }

    return {
        features: mergedFeatures,
        isLoading: false,
        updateFeature
    }
}


import { IUsageData, IUserActivity, IFeatureUsage } from '../../types/admin'

export const useAnalytics = (tenantId: string, timeRange: string = '30d') => {
    return {
        usageData: {
            totalUsers: 0,
            newUsers: 0,
            activeUsers: 0,
            activePercentage: 0,
            apiCalls: 0,
            apiCallsChange: 0,
            storageUsed: 0,
            storagePercentage: 0,
            chartData: []
        },
        userActivityData: [] as IUserActivity[],
        featureUsageData: [] as IFeatureUsage[],
        isLoading: false
    }
}


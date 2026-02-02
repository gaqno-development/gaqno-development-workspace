import { useApiQuery } from "../useApiQuery";
import { ITenantUsageSummary } from "../../types/admin";
import { ssoAxiosClient } from "../../utils/api/sso-client";

export function useTenantUsage(tenantId: string, period: string) {
  const { data: usage, isLoading } = useApiQuery<ITenantUsageSummary>(
    ssoAxiosClient,
    ["tenant-usage", tenantId, period],
    async () => {
      const response = await ssoAxiosClient.get<ITenantUsageSummary>(
        `/tenants/${tenantId}/usage`,
        { params: { period } }
      );
      return response.data;
    },
    {
      enabled: !!tenantId && !!period,
      staleTime: 2 * 60 * 1000,
    }
  );

  return {
    usage: usage ?? null,
    isLoading,
    period: period,
  };
}

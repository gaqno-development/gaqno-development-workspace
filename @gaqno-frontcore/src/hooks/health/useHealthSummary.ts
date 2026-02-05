import { useApiQuery } from "../useApiQuery";
import { coreAxiosClient } from "../../utils/api/api-client";
import type { HealthSummary } from "../../types/health";

export function useHealthSummary() {
  return useApiQuery<HealthSummary>(
    coreAxiosClient.admin,
    ["health", "summary"],
    async () => {
      const { data } = await coreAxiosClient.admin.get<HealthSummary>(
        "/health/summary"
      );
      return data;
    },
    { staleTime: 30 * 1000 }
  );
}

import { useApiQuery } from "../useApiQuery";
import { coreAxiosClient } from "../../utils/api/api-client";
import type { FailureByType } from "../../types/health";

export function useHealthFailures() {
  return useApiQuery<FailureByType[]>(
    coreAxiosClient.admin,
    ["health", "failures"],
    async () => {
      const { data } = await coreAxiosClient.admin.get<FailureByType[]>(
        "/health/failures/by-type"
      );
      return data ?? [];
    },
    { staleTime: 30 * 1000 }
  );
}

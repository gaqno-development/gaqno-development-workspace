import { useApiQuery } from "../useApiQuery";
import { coreAxiosClient } from "../../utils/api/api-client";
import type { HealthEvent } from "../../types/health";

export function useHealthEvents(limit = 50) {
  return useApiQuery<HealthEvent[]>(
    coreAxiosClient.admin,
    ["health", "events", limit],
    async () => {
      const { data } = await coreAxiosClient.admin.get<HealthEvent[]>(
        "/health/events",
        { params: { limit } }
      );
      return data ?? [];
    },
    { staleTime: 15 * 1000 }
  );
}

import { useApiQuery } from "../useApiQuery";
import { coreAxiosClient } from "../../utils/api/api-client";
import type { AgentStats } from "../../types/health";

export function useHealthAgents() {
  return useApiQuery<AgentStats[]>(
    coreAxiosClient.admin,
    ["health", "agents"],
    async () => {
      const { data } = await coreAxiosClient.admin.get<AgentStats[]>(
        "/health/agents"
      );
      return data ?? [];
    },
    { staleTime: 30 * 1000 }
  );
}

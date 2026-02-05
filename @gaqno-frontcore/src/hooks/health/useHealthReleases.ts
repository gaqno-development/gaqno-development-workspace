import { useApiQuery } from "../useApiQuery";
import { coreAxiosClient } from "../../utils/api/api-client";
import type { ReleaseInfo } from "../../types/health";

export function useHealthReleases() {
  return useApiQuery<ReleaseInfo[]>(
    coreAxiosClient.admin,
    ["health", "releases"],
    async () => {
      const { data } = await coreAxiosClient.admin.get<ReleaseInfo[]>(
        "/health/releases"
      );
      return data ?? [];
    },
    { staleTime: 30 * 1000 }
  );
}

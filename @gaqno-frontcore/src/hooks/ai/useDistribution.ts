import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";
import type { PublishDistributionBody } from "../../utils/api";

export function usePublishDistribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PublishDistributionBody) =>
      aiApiClient.publishDistribution(body),
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData(["ai", "distribution-status", data.id], data);
      }
    },
  });
}

export function useDistributionStatus(distributionId: string) {
  return useQuery({
    queryKey: ["ai", "distribution-status", distributionId],
    queryFn: () => aiApiClient.getDistributionStatus(distributionId),
    enabled: !!distributionId,
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined;
      if (data?.status === "delivered" || data?.status === "failed") {
        return false;
      }
      return 3000;
    },
  });
}

export function useDistribution() {
  const publish = usePublishDistribution();
  return {
    publish,
    useDistributionStatus,
  };
}

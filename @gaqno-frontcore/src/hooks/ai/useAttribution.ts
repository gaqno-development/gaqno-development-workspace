import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";
import type { CreateCampaignBody } from "../../utils/api";

export function useCampaigns(tenantId: string) {
  return useQuery({
    queryKey: ["ai", "attribution-campaigns", tenantId],
    queryFn: () => aiApiClient.listCampaigns(tenantId),
    enabled: !!tenantId,
  });
}

export function useCampaign(id: string, tenantId: string) {
  return useQuery({
    queryKey: ["ai", "attribution-campaign", id, tenantId],
    queryFn: () => aiApiClient.getCampaign(id, tenantId),
    enabled: !!id && !!tenantId,
  });
}

export function useAttributionReport(campaignId: string, tenantId: string) {
  return useQuery({
    queryKey: ["ai", "attribution-report", campaignId, tenantId],
    queryFn: () => aiApiClient.getAttributionReport(campaignId, tenantId),
    enabled: !!campaignId && !!tenantId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCampaignBody) => aiApiClient.createCampaign(body),
    onSuccess: (_, variables) => {
      const tenantId =
        variables.tenantId ?? "00000000-0000-4000-a000-000000000000";
      queryClient.invalidateQueries({
        queryKey: ["ai", "attribution-campaigns", tenantId],
      });
    },
  });
}

export function useAttribution() {
  const createCampaignMutation = useCreateCampaign();
  return {
    useCampaigns,
    useCampaign,
    useAttributionReport,
    createCampaign: createCampaignMutation,
  };
}

import { useQuery } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";

export function useBillingSummary(
  tenantId: string,
  from?: string,
  to?: string
) {
  return useQuery({
    queryKey: ["ai", "billing-summary", tenantId, from, to],
    queryFn: () => aiApiClient.getBillingSummary(tenantId, from, to),
    enabled: !!tenantId,
  });
}

export function useBilling() {
  return {
    useBillingSummary,
  };
}

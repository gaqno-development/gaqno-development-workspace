import { useQuery } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";
import type { ErpProductsQuery } from "../../utils/api";

export function useErpProducts(query?: ErpProductsQuery) {
  return useQuery({
    queryKey: [
      "ai",
      "erp-products",
      query?.tenantId,
      query?.limit,
      query?.offset,
    ],
    queryFn: () => aiApiClient.getErpProducts(query),
    staleTime: 2 * 60 * 1000,
  });
}

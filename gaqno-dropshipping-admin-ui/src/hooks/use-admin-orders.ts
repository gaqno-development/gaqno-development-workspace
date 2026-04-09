import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

export function useAdminOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: async () => {
      const { data } = await adminApi.getOrders(params);
      return data as {
        items: Array<Record<string, unknown>>;
        total: number;
        page: number;
        limit: number;
      };
    },
  });
}

export function useAdminOrderDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: async () => {
      const { data } = await adminApi.getOrderDetail(id);
      return data as Record<string, unknown>;
    },
    enabled: !!id,
  });
}

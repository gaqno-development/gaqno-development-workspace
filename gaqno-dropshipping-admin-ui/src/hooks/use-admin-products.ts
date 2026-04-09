import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

const QUERY_KEY = ["admin", "products"];

export function useAdminProducts(params?: Record<string, string>) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await adminApi.getProducts(params);
      return data as {
        items: Array<Record<string, unknown>>;
        total: number;
        page: number;
        limit: number;
      };
    },
  });

  const publishMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      adminApi.publishProduct(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => adminApi.updateProduct(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateProductStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    products: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
    publish: publishMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    updateStatus: statusMutation.mutateAsync,
  };
}

export function useImportableProducts() {
  return useQuery({
    queryKey: ["admin", "importable-products"],
    queryFn: async () => {
      const { data } = await adminApi.getImportableProducts();
      return data as Array<Record<string, unknown>>;
    },
  });
}

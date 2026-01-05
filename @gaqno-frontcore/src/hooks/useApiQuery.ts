import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { AxiosInstance } from 'axios';

export function useApiQuery<TData = unknown>(
  client: AxiosInstance,
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData> {
  return useQuery<TData>({
    queryKey,
    queryFn,
    ...options,
  });
}

export { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';


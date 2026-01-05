import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { AxiosInstance } from 'axios';

export function useApiMutation<TData = unknown, TVariables = void>(
  client: AxiosInstance,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
): UseMutationResult<TData, Error, TVariables> {
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...options,
  });
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import {
  CustomClass,
  CreateCustomClassRequest,
  UpdateCustomClassRequest,
  GenerateCustomClassRequest,
} from '../types/custom-class.types';

const CUSTOM_CLASSES_QUERY_KEY = (campaignId: string) => ['rpg', 'campaigns', campaignId, 'custom-classes'];

export const useRpgCustomClasses = (campaignId: string | null) => {
  return useQuery<CustomClass[]>({
    queryKey: campaignId ? CUSTOM_CLASSES_QUERY_KEY(campaignId) : ['rpg', 'custom-classes', 'null'],
    queryFn: async () => {
      if (!campaignId) return [];
      const response = await coreAxiosClient.rpg.get(`/campaigns/${campaignId}/custom-classes`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

export const useRpgCustomClass = (campaignId: string | null, classId: string | null) => {
  return useQuery<CustomClass>({
    queryKey: campaignId && classId
      ? [...CUSTOM_CLASSES_QUERY_KEY(campaignId), classId]
      : ['rpg', 'custom-class', 'null'],
    queryFn: async () => {
      if (!campaignId || !classId) throw new Error('Campaign ID and Class ID are required');
      const response = await coreAxiosClient.rpg.get(`/campaigns/${campaignId}/custom-classes/${classId}`);
      return response.data;
    },
    enabled: !!campaignId && !!classId,
  });
};

export const useCreateRpgCustomClass = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomClassRequest) => {
      const response = await coreAxiosClient.rpg.post(`/campaigns/${campaignId}/custom-classes`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_CLASSES_QUERY_KEY(campaignId) });
    },
  });
};

export const useUpdateRpgCustomClass = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomClassRequest }) => {
      const response = await coreAxiosClient.rpg.patch(`/campaigns/${campaignId}/custom-classes/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_CLASSES_QUERY_KEY(campaignId) });
      queryClient.invalidateQueries({ queryKey: [...CUSTOM_CLASSES_QUERY_KEY(campaignId), variables.id] });
    },
  });
};

export const useDeleteRpgCustomClass = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await coreAxiosClient.rpg.delete(`/campaigns/${campaignId}/custom-classes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_CLASSES_QUERY_KEY(campaignId) });
    },
  });
};

export const useGenerateRpgCustomClass = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateCustomClassRequest) => {
      const response = await coreAxiosClient.rpg.post(`/campaigns/${campaignId}/custom-classes/generate`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_CLASSES_QUERY_KEY(campaignId) });
    },
  });
};


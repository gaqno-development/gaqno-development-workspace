import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import {
  Location,
  CreateLocationRequest,
  UpdateLocationRequest,
  GenerateLocationRequest,
  GenerateEncounterRequest,
} from '../types/location.types';

const LOCATIONS_QUERY_KEY = (campaignId: string) => ['rpg', 'campaigns', campaignId, 'locations'];

export const useRpgLocations = (campaignId: string | null) => {
  return useQuery<Location[]>({
    queryKey: campaignId ? LOCATIONS_QUERY_KEY(campaignId) : ['rpg', 'locations', 'null'],
    queryFn: async () => {
      if (!campaignId) return [];
      const response = await coreAxiosClient.rpg.get(`/campaigns/${campaignId}/locations`);
      return response.data;
    },
    enabled: !!campaignId,
  });
};

export const useRpgLocation = (campaignId: string | null, locationId: string | null) => {
  return useQuery<Location>({
    queryKey: campaignId && locationId
      ? [...LOCATIONS_QUERY_KEY(campaignId), locationId]
      : ['rpg', 'location', 'null'],
    queryFn: async () => {
      if (!campaignId || !locationId) throw new Error('Campaign ID and Location ID are required');
      const response = await coreAxiosClient.rpg.get(`/campaigns/${campaignId}/locations/${locationId}`);
      return response.data;
    },
    enabled: !!campaignId && !!locationId,
  });
};

export const useCreateRpgLocation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLocationRequest) => {
      const response = await coreAxiosClient.rpg.post(`/campaigns/${campaignId}/locations`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY(campaignId) });
    },
  });
};

export const useUpdateRpgLocation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLocationRequest }) => {
      const response = await coreAxiosClient.rpg.patch(`/campaigns/${campaignId}/locations/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY(campaignId) });
      queryClient.invalidateQueries({ queryKey: [...LOCATIONS_QUERY_KEY(campaignId), variables.id] });
    },
  });
};

export const useDeleteRpgLocation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await coreAxiosClient.rpg.delete(`/campaigns/${campaignId}/locations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY(campaignId) });
    },
  });
};

export const useGenerateRpgLocation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateLocationRequest) => {
      const response = await coreAxiosClient.rpg.post(`/campaigns/${campaignId}/locations/generate`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY(campaignId) });
    },
  });
};

export const useGenerateRpgEncounter = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, data }: { locationId: string; data: GenerateEncounterRequest }) => {
      const response = await coreAxiosClient.rpg.post(
        `/campaigns/${campaignId}/locations/${locationId}/generate-encounter`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY(campaignId) });
      queryClient.invalidateQueries({ queryKey: [...LOCATIONS_QUERY_KEY(campaignId), variables.locationId] });
    },
  });
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import { Campaign, GenerateStepRequest, CampaignStep } from '../types/campaign.types';

const CAMPAIGNS_QUERY_KEY = ['rpg', 'campaigns'];

export const useRpgCampaigns = () => {
  return useQuery<Campaign[]>({
    queryKey: CAMPAIGNS_QUERY_KEY,
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get('/campaigns');
      return response.data;
    },
  });
};

export const useRpgPublicCampaigns = () => {
  return useQuery<Campaign[]>({
    queryKey: [...CAMPAIGNS_QUERY_KEY, 'public'],
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get('/campaigns/public');
      return response.data;
    },
  });
};

export const useRpgMyCampaigns = () => {
  return useQuery<Campaign[]>({
    queryKey: [...CAMPAIGNS_QUERY_KEY, 'my'],
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get('/campaigns/my');
      return response.data;
    },
  });
};

export const useRpgCampaign = (id: string | null) => {
  return useQuery<Campaign>({
    queryKey: [...CAMPAIGNS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get(`/campaigns/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateRpgCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic?: boolean }) => {
      const response = await coreAxiosClient.rpg.post('/campaigns', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
};

export const useUpdateRpgCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      const response = await coreAxiosClient.rpg.patch(`/campaigns/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
};

export const useGenerateCampaignStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: GenerateStepRequest }) => {
      const response = await coreAxiosClient.rpg.post(`/campaigns/${id}/generate-step`, request);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_QUERY_KEY, variables.id] });
    },
  });
};

export const useUpdateCampaignStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, step, content }: { id: string; step: CampaignStep; content: any }) => {
      const response = await coreAxiosClient.rpg.patch(`/campaigns/${id}/step`, { step, content });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_QUERY_KEY, variables.id] });
    },
  });
};

export const useFinalizeCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await coreAxiosClient.rpg.post(`/campaigns/${id}/finalize`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
};


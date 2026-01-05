import { useQuery, useMutation } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import { RpgHistory, RpgMemory, RpgAction } from '../types/rpg.types';

export const useRpgHistory = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'history', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await coreAxiosClient.rpg.get(`/actions/history/${sessionId}`);
      return response.data as RpgHistory[];
    },
    enabled: !!sessionId
  });
};

export const useRpgMemory = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'memory', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await coreAxiosClient.rpg.get(`/actions/memory/${sessionId}`);
      return response.data as RpgMemory[];
    },
    enabled: !!sessionId
  });
};

export const useRpgActions = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'actions', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await coreAxiosClient.rpg.get(`/actions/actions/${sessionId}`);
      return response.data as RpgAction[];
    },
    enabled: !!sessionId
  });
};

export const useSubmitRpgAction = () => {
  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      characterId?: string;
      action: string;
      dice: {
        formula: string;
        roll: number;
        natural: number;
        target?: string;
      };
      context?: Record<string, any>;
    }) => {
      const response = await coreAxiosClient.rpg.post('/actions', data);
      return response.data;
    }
  });
};


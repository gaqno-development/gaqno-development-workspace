import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import { RpgCharacter } from '../types/rpg.types';

export const useRpgCharacters = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'characters', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await coreAxiosClient.rpg.get('/characters', {
        params: { sessionId }
      });
      return response.data as RpgCharacter[];
    },
    enabled: !!sessionId
  });
};

export const useRpgCharacter = (id: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'characters', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await coreAxiosClient.rpg.get(`/characters/${id}`);
      return response.data as RpgCharacter;
    },
    enabled: !!id
  });
};

export const useCreateRpgCharacter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      name: string;
      attributes?: Record<string, any>;
      resources?: Record<string, any>;
      metadata?: Record<string, any>;
    }) => {
      const response = await coreAxiosClient.rpg.post('/characters', data);
      return response.data as RpgCharacter;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'characters', variables.sessionId] });
    }
  });
};

export const useUpdateRpgCharacter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      name?: string;
      attributes?: Record<string, any>;
      resources?: Record<string, any>;
      metadata?: Record<string, any>;
    }) => {
      const response = await coreAxiosClient.rpg.patch(`/characters/${id}`, data);
      return response.data as RpgCharacter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'characters'] });
      queryClient.invalidateQueries({ queryKey: ['rpg', 'characters', 'detail', data.id] });
    }
  });
};

export const useDeleteRpgCharacter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await coreAxiosClient.rpg.delete(`/characters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'characters'] });
    }
  });
};


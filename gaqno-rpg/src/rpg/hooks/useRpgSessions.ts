import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import { RpgSession } from '../types/rpg.types';

export const useRpgSessions = () => {
  return useQuery({
    queryKey: ['rpg', 'sessions'],
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get('/sessions');
      return response.data as RpgSession[];
    }
  });
};

export const useRpgSession = (id: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'sessions', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await coreAxiosClient.rpg.get(`/sessions/${id}`);
      return response.data as RpgSession;
    },
    enabled: !!id
  });
};

export const useCreateRpgSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; campaignId?: string }) => {
      const response = await coreAxiosClient.rpg.post('/sessions', data);
      return response.data as RpgSession;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions', data.id, 'masters'] });
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions', data.id] });
      await queryClient.refetchQueries({ queryKey: ['rpg', 'sessions', data.id, 'masters'] });
    }
  });
};

export const useUpdateRpgSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string }) => {
      const response = await coreAxiosClient.rpg.patch(`/sessions/${id}`, data);
      return response.data as RpgSession;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions', variables.id] });
    }
  });
};

export const useDeleteRpgSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await coreAxiosClient.rpg.delete(`/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions'] });
    }
  });
};

export const useRpgSessionByCode = (code: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'sessions', 'code', code],
    queryFn: async () => {
      if (!code) return null;
      const response = await coreAxiosClient.rpg.get(`/sessions/code/${code.toUpperCase()}`);
      return response.data as RpgSession;
    },
    enabled: !!code && code.length >= 4,
    retry: false
  });
};

export const useSessionMasters = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['rpg', 'sessions', sessionId, 'masters'],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await coreAxiosClient.rpg.get(`/sessions/${sessionId}/masters`);
      return response.data as Array<{ id: string; userId: string; isOriginalCreator: boolean }>;
    },
    enabled: !!sessionId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0
  });
};

export const usePromoteToMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const response = await coreAxiosClient.rpg.post(`/sessions/${sessionId}/promote-master`, { userId });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions', variables.sessionId, 'masters'] });
    }
  });
};

export const useDemoteFromMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const response = await coreAxiosClient.rpg.post(`/sessions/${sessionId}/demote-master`, { userId });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions', variables.sessionId, 'masters'] });
    }
  });
};

export const useRenounceMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await coreAxiosClient.rpg.post(`/sessions/${sessionId}/renounce-master`);
      return response.data;
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions', sessionId, 'masters'] });
      queryClient.invalidateQueries({ queryKey: ['rpg', 'sessions', sessionId] });
    }
  });
};


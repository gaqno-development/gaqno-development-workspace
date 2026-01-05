import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';

const DND5E_QUERY_KEY = ['rpg', 'dnd5e'];

export const useDnd5eCategories = () => {
  return useQuery<Record<string, string>>({
    queryKey: [...DND5E_QUERY_KEY, 'categories'],
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get('/dnd5e/categories');
      return response.data;
    },
    staleTime: 1000 * 60 * 60,
  });
};

export const useDnd5eCategoryList = (
  category: string | null,
  offset?: number,
  limit?: number,
) => {
  return useQuery<{
    count: number;
    results: Array<{ index: string; name: string; url: string }>;
    offset?: number;
    limit?: number;
    hasMore?: boolean;
  }>({
    queryKey: [...DND5E_QUERY_KEY, 'category', category, offset, limit],
    queryFn: async () => {
      const params: Record<string, number> = {};
      if (offset !== undefined) params.offset = offset;
      if (limit !== undefined) params.limit = limit;
      const response = await coreAxiosClient.rpg.get(`/dnd5e/${category}`, { params });
      return response.data;
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 30,
  });
};

export const useDnd5eItem = (category: string | null, index: string | null, resolveReferences: boolean = false) => {
  return useQuery<any>({
    queryKey: [...DND5E_QUERY_KEY, 'item', category, index, resolveReferences ? 'resolved' : 'normal'],
    queryFn: async () => {
      const params = resolveReferences ? { resolve: 'true' } : {};
      const response = await coreAxiosClient.rpg.get(`/dnd5e/${category}/${index}`, { params });
      return response.data;
    },
    enabled: !!category && !!index,
    staleTime: 1000 * 60 * 30,
  });
};

export const useDnd5eSearch = (category: string | null, query: string | null) => {
  return useQuery<Array<{ name: string; index: string }>>({
    queryKey: [...DND5E_QUERY_KEY, 'search', category, query],
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get(`/dnd5e/${category}/search`, {
        params: { q: query },
      });
      return response.data;
    },
    enabled: !!category && !!query && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSyncDnd5eCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: string) => {
      const response = await coreAxiosClient.rpg.post(`/dnd5e/sync/${category}`);
      return response.data;
    },
    onSuccess: (_, category) => {
      queryClient.invalidateQueries({ queryKey: [...DND5E_QUERY_KEY, 'category', category] });
      queryClient.invalidateQueries({ queryKey: [...DND5E_QUERY_KEY, 'item'] });
    },
  });
};

export const useSyncAllDnd5e = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await coreAxiosClient.rpg.post('/dnd5e/sync/all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DND5E_QUERY_KEY });
    },
  });
};

export const useDnd5eHealth = () => {
  return useQuery<any>({
    queryKey: [...DND5E_QUERY_KEY, 'health'],
    queryFn: async () => {
      const response = await coreAxiosClient.rpg.get('/dnd5e/health/check');
      return response.data;
    },
    staleTime: 1000 * 60,
  });
};

// Helper function to extract category and index from API URL
const getCategoryAndIndexFromUrl = (url: string): { category: string; index: string } | null => {
  // URL format: /api/2014/{category}/{index}
  const match = url.match(/\/api\/2014\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { category: match[1], index: match[2] };
};

export const useDnd5eReferencedItem = (url: string | null | undefined) => {
  const urlInfo = url ? getCategoryAndIndexFromUrl(url) : null;
  
  return useQuery<any>({
    queryKey: [...DND5E_QUERY_KEY, 'referenced', url],
    queryFn: async () => {
      if (!urlInfo) throw new Error('Invalid URL');
      const response = await coreAxiosClient.rpg.get(`/dnd5e/${urlInfo.category}/${urlInfo.index}`);
      return response.data;
    },
    enabled: !!url && !!urlInfo,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};

export const useDnd5eSpecialEndpoint = (
  category: string | null,
  index: string | null,
  endpoint: string | null,
) => {
  return useQuery<any>({
    queryKey: [...DND5E_QUERY_KEY, 'special', category, index, endpoint],
    queryFn: async () => {
      if (!category || !index || !endpoint) throw new Error('Category, index, and endpoint are required');
      const response = await coreAxiosClient.rpg.get(`/dnd5e/${category}/${index}/${endpoint}`);
      return response.data;
    },
    enabled: !!category && !!index && !!endpoint,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};


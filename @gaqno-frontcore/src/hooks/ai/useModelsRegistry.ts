import { useQuery } from '@tanstack/react-query';
import { createServiceClient } from '../../utils/api/api-client';

function getAiServiceBaseUrl(): string {
  try {
    const env = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env : undefined;
    const url = env?.['VITE_SERVICE_AI_URL'];
    if (url) return url;
  } catch {
    // ignore
  }
  return 'http://localhost:4002';
}

export interface ModelInfo {
  id: string;
  name: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: ModelInfo[];
}

export interface CapabilityRegistry {
  providers: ProviderInfo[];
  defaultProvider: string;
  defaultModel: string;
}

export interface ModelsRegistryResponse {
  text: CapabilityRegistry;
  image: CapabilityRegistry;
}

const AI_CLIENT = createServiceClient(
  getAiServiceBaseUrl().replace(/\/$/, ''),
);

export const AI_MODEL_PREFERENCES_KEY = 'gaqno-ai-model-preferences';

export function useModelsRegistry(aiServiceBaseUrl?: string) {
  const client = aiServiceBaseUrl
    ? createServiceClient(aiServiceBaseUrl.replace(/\/$/, ''))
    : AI_CLIENT;

  return useQuery<ModelsRegistryResponse>({
    queryKey: ['models-registry', aiServiceBaseUrl ?? 'default'],
    queryFn: async () => {
      const { data } = await client.get<ModelsRegistryResponse>(
        '/v1/models/registry',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

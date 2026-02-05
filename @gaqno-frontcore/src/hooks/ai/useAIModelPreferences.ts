import { useLocalStorage } from '../useLocalStorage';
import { AI_MODEL_PREFERENCES_KEY } from './useModelsRegistry';

export interface AIModelPreferences {
  text?: { provider?: string; model?: string };
  image?: { provider?: string; model?: string };
}

const defaultPreferences: AIModelPreferences = {
  text: {},
  image: {},
};

export function useAIModelPreferences() {
  return useLocalStorage<AIModelPreferences>(
    AI_MODEL_PREFERENCES_KEY,
    defaultPreferences,
  );
}

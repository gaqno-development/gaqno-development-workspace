import { useState, useEffect, useMemo } from 'react';
import { NarratorResponse, LocationContext } from '../types/rpg.types';
import { useRpgMemory } from './useRpgActions';
import { useRpgCampaign } from './useRpgCampaigns';
import { useRpgSession } from './useRpgSessions';

export const useLocationContext = (
  sessionId: string | null,
  currentNarrative: NarratorResponse | null
): LocationContext | null => {
  const { data: session } = useRpgSession(sessionId);
  const { data: memory } = useRpgMemory(sessionId);
  const { data: campaign } = useRpgCampaign(session?.campaignId || null);
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);

  const memoryMap = useMemo(() => {
    if (!memory) return {};
    return memory.reduce((acc, m) => {
      acc[m.key] = m.value;
      return acc;
    }, {} as Record<string, string>);
  }, [memory]);

  useEffect(() => {
    let newLocationContext: LocationContext | null = null;

    if (currentNarrative?.locationContext) {
      newLocationContext = currentNarrative.locationContext;
    } else if (currentNarrative?.context?.location) {
      const locationStr = currentNarrative.context.location;
      newLocationContext = {
        city: locationStr,
        description: `Você está em ${locationStr}`,
      };
    } else if (memoryMap['current_location']) {
      try {
        const parsed = JSON.parse(memoryMap['current_location']);
        newLocationContext = typeof parsed === 'string' 
          ? { city: parsed, description: `Você está em ${parsed}` }
          : parsed;
      } catch {
        newLocationContext = {
          city: memoryMap['current_location'],
          description: `Você está em ${memoryMap['current_location']}`,
        };
      }
    } else if (campaign?.world) {
      const world = campaign.world;
      if (world.geography) {
        newLocationContext = {
          description: world.geography,
          terrain: world.geography,
        };
      }
    }

    if (newLocationContext) {
      setLocationContext(newLocationContext);
    }
  }, [currentNarrative, memoryMap, campaign]);

  return locationContext;
};


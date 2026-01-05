/**
 * useMotionByMode - Hook que retorna variants filtrados por modo
 * Aplica ajustes de modo (presentation/master/player) aos variants
 */
import { useMemo } from 'react';
import { Variants } from 'framer-motion';
import { SessionMode } from '../types/rpg.types';
import { getVariantsForEvent, MotionEventType } from '../motion/eventToMotionMap';
import { useMotionStore } from '../store/motionStore';
import { getModeAdjustedVariants } from '../motion/modeVariants';

/**
 * Hook que retorna variants para um evento, considerando o modo atual
 */
export function useMotionByMode(
  event: MotionEventType | null,
  modeOverride?: SessionMode
): Variants | null {
  const { currentMode } = useMotionStore();

  const effectiveMode = modeOverride || currentMode;

  return useMemo(() => {
    if (!event) return null;
    return getVariantsForEvent(event, effectiveMode || undefined);
  }, [event, effectiveMode]);
}

/**
 * Hook que retorna variants ajustados para o modo atual
 * Útil quando você quer aplicar variants base diretamente
 */
export function useModeAdjustedVariants(
  baseVariants: Variants,
  modeOverride?: SessionMode
): Variants {
    const { currentMode } = useMotionStore();
    const effectiveMode = modeOverride || currentMode;

  return useMemo(() => {
    if (!effectiveMode) return baseVariants;
    return getModeAdjustedVariants(baseVariants, effectiveMode);
  }, [baseVariants, effectiveMode]);
}


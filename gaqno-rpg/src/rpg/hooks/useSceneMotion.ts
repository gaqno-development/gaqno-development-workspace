/**
 * useSceneMotion - Hook para aplicar motion baseado em evento
 * Conecta eventos do store com variants de animação
 */
import { useMemo } from 'react';
import { Variants } from 'framer-motion';
import { useMotionStore } from '../store/motionStore';
import {
  getVariantsForEvent,
  MotionEventType,
  getHighestPriorityEvent,
} from '../motion/eventToMotionMap';

/**
 * Hook que retorna variants baseado em evento específico
 */
export function useSceneMotion(event: MotionEventType | null) {
  const { currentMode } = useMotionStore();

  return useMemo(() => {
    if (!event) return null;
    return getVariantsForEvent(event, currentMode || undefined);
  }, [event, currentMode]);
}

/**
 * Hook que retorna variants do evento de maior prioridade ativo
 */
export function useHighestPriorityMotion(): Variants | null {
  const { getHighestPriorityEvent } = useMotionStore();
  const { currentMode } = useMotionStore();

  const highestPriorityEvent = getHighestPriorityEvent();

  return useMemo(() => {
    if (!highestPriorityEvent) return null;
    return getVariantsForEvent(
      highestPriorityEvent.event.type,
      currentMode || undefined
    );
  }, [highestPriorityEvent, currentMode]);
}

/**
 * Hook que retorna todos os eventos ativos de um tipo específico
 */
export function useMotionEventsByType(type: MotionEventType) {
  const { getEventsByType } = useMotionStore();
  return getEventsByType(type);
}

/**
 * Hook que retorna se um evento específico está ativo
 */
export function useIsEventActive(type: MotionEventType): boolean {
  const { getEventsByType } = useMotionStore();
  const events = getEventsByType(type);
  return events.length > 0 && events.some((e) => !e.completed);
}


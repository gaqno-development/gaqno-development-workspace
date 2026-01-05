/**
 * Event to Motion Map - Mapeamento de eventos do backend para variants
 * Conecta ui_actions e outcomes do NarratorResponse com variants de animação
 */
import { Variants } from 'framer-motion';
import {
  sceneVariants,
  diceRollVariants,
  narrativeVariants,
  outcomeVariants,
  imageRevealVariants,
  toastVariants,
} from './variants';
import { getVariantsByMode } from './modeVariants';
import { SessionMode, Outcome, UIAction } from '../types/rpg.types';

export type MotionEventType =
  | 'scene.render'
  | 'scene.enter'
  | 'scene.exit'
  | 'dice.roll'
  | 'dice.result'
  | 'narrative.enter'
  | 'narrative.update'
  | 'outcome.critical_success'
  | 'outcome.success'
  | 'outcome.partial'
  | 'outcome.failure'
  | 'outcome.critical_failure'
  | 'image.reveal'
  | 'image.update'
  | 'toast.show'
  | 'character.update'
  | 'cinematic.zoom'
  | 'particle.effect';

export interface MotionEvent {
  type: MotionEventType;
  priority: 'alta' | 'média' | 'baixa';
  duration?: number;
  mode?: SessionMode;
}

/**
 * Mapeamento base de eventos para variants
 */
const baseEventMap: Record<MotionEventType, Variants> = {
  'scene.render': sceneVariants,
  'scene.enter': sceneVariants,
  'scene.exit': sceneVariants,
  'dice.roll': diceRollVariants,
  'dice.result': diceRollVariants,
  'narrative.enter': narrativeVariants,
  'narrative.update': narrativeVariants,
  'outcome.critical_success': outcomeVariants.critical_success,
  'outcome.success': outcomeVariants.success,
  'outcome.partial': outcomeVariants.partial,
  'outcome.failure': outcomeVariants.failure,
  'outcome.critical_failure': outcomeVariants.critical_failure,
  'image.reveal': imageRevealVariants,
  'image.update': imageRevealVariants,
  'toast.show': toastVariants,
  'character.update': narrativeVariants, // Reutiliza narrative para updates de personagem
  'cinematic.zoom': sceneVariants, // Reutiliza scene para zoom cinematográfico
  'particle.effect': sceneVariants, // Reutiliza scene para efeitos de partículas
};

/**
 * Mapeia ui_action.type para MotionEventType
 */
export function mapUIActionToEvent(uiAction: UIAction): MotionEventType | null {
  const actionMap: Record<string, MotionEventType> = {
    animation: 'scene.render',
    dice_roll: 'dice.roll',
    narrative: 'narrative.enter',
    image: 'image.reveal',
    toast: 'toast.show',
    character_update: 'character.update',
    cinematic_zoom: 'cinematic.zoom',
    particle: 'particle.effect',
  };

  // Mapeia pelo name se type for genérico
  if (uiAction.type === 'animation') {
    const nameMap: Record<string, MotionEventType> = {
      dice_roll: 'dice.roll',
      scene_enter: 'scene.enter',
      narrative: 'narrative.enter',
      image_reveal: 'image.reveal',
      cinematic_zoom: 'cinematic.zoom',
    };
    return nameMap[uiAction.name] || actionMap[uiAction.type] || null;
  }

  return actionMap[uiAction.type] || null;
}

/**
 * Mapeia outcome para MotionEventType
 */
export function mapOutcomeToEvent(outcome: Outcome): MotionEventType {
  return `outcome.${outcome}` as MotionEventType;
}

/**
 * Retorna variants para um evento, considerando o modo
 */
export function getVariantsForEvent(
  event: MotionEventType,
  mode?: SessionMode
): Variants {
  const baseVariants = baseEventMap[event];
  if (!baseVariants) {
    console.warn(`No variants found for event: ${event}`);
    return sceneVariants; // Fallback
  }

  // Se o evento é de cena ou narrativa, aplica ajustes por modo
  if (mode && (event.includes('scene') || event.includes('narrative'))) {
    const variantType = event.includes('scene') ? 'scene' : 'narrative';
    return getVariantsByMode(mode, variantType);
  }

  return baseVariants;
}

/**
 * Processa ui_actions e retorna array de MotionEvent
 */
export function processUIActions(
  uiActions: UIAction[] | undefined,
  mode?: SessionMode
): MotionEvent[] {
  if (!uiActions) return [];

  return uiActions
    .map((action) => {
      const eventType = mapUIActionToEvent(action);
      if (!eventType) return null;

      return {
        type: eventType,
        priority: action.priority,
        duration: action.duration_ms,
        mode,
      };
    })
    .filter((event): event is MotionEvent => event !== null);
}

/**
 * Processa outcome e retorna MotionEvent
 */
export function processOutcome(
  outcome: Outcome,
  mode?: SessionMode
): MotionEvent {
  return {
    type: mapOutcomeToEvent(outcome),
    priority: outcome.includes('critical') ? 'alta' : 'média',
    mode,
  };
}

/**
 * Ordena eventos por prioridade (alta > média > baixa)
 */
export function sortEventsByPriority(events: MotionEvent[]): MotionEvent[] {
  const priorityOrder = { alta: 0, média: 1, baixa: 2 };
  return [...events].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * Retorna o evento de maior prioridade de uma lista
 */
export function getHighestPriorityEvent(events: MotionEvent[]): MotionEvent | null {
  if (events.length === 0) return null;
  const sorted = sortEventsByPriority(events);
  return sorted[0];
}


/**
 * Mode Variants - Variants específicos por modo de sessão
 * Presentation: cinematográfico, sem interação
 * Master: moderado, com controles
 * Player: direto, feedback rápido
 */
import { Variants } from 'framer-motion';
import { motionTokens } from './tokens';
import { SessionMode } from '../types/rpg.types';

/**
 * Wrapper que ajusta variants baseado no modo
 */
export function getModeAdjustedVariants(
  baseVariants: Variants,
  mode: SessionMode
): Variants {
  const modeMultipliers = {
    presentation: 1.5, // Mais lento, mais cinematográfico
    master: 1.0, // Normal
    player: 0.7, // Mais rápido, feedback imediato
  };

  const multiplier = modeMultipliers[mode];

  // Deep clone e ajusta durações
  const adjusted = JSON.parse(JSON.stringify(baseVariants));

  const adjustTransition = (transition: any) => {
    if (typeof transition === 'object' && transition !== null) {
      if (transition.duration) {
        transition.duration = transition.duration * multiplier;
      }
      if (transition.delay) {
        transition.delay = transition.delay * multiplier;
      }
      if (Array.isArray(transition)) {
        return transition.map(adjustTransition);
      }
    }
    return transition;
  };

  const processVariants = (variants: any): any => {
    if (typeof variants !== 'object' || variants === null) {
      return variants;
    }

    const processed: any = {};
    for (const [key, value] of Object.entries(variants)) {
      if (key === 'transition' && typeof value === 'object') {
        processed[key] = adjustTransition(value);
      } else if (typeof value === 'object' && value !== null) {
        processed[key] = processVariants(value);
      } else {
        processed[key] = value;
      }
    }
    return processed;
  };

  return processVariants(adjusted);
}

/**
 * Variants específicos para modo Presentation
 * Animações mais longas e cinematográficas
 */
export const presentationVariants = {
  scene: {
    initial: {
      opacity: 0,
      y: 20,
      filter: 'blur(8px)',
    },
    enter: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: motionTokens.duration.cinematic,
        ease: motionTokens.easing.easeOut,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      filter: 'blur(4px)',
      transition: {
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.easeIn,
      },
    },
  },
  narrative: {
    initial: {
      opacity: 0,
      y: 30,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.easeOut,
        staggerChildren: motionTokens.stagger.slow,
      },
    },
  },
};

/**
 * Variants específicos para modo Master
 * Animações moderadas com controles visíveis
 */
export const masterVariants = {
  scene: {
    initial: {
      opacity: 0,
      y: 12,
      filter: 'blur(4px)',
    },
    enter: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: motionTokens.duration.normal,
        ease: motionTokens.easing.easeOut,
      },
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: {
        duration: motionTokens.duration.fast,
      },
    },
  },
  narrative: {
    initial: {
      opacity: 0,
      y: 20,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.duration.normal,
        ease: motionTokens.easing.easeOut,
        staggerChildren: motionTokens.stagger.normal,
      },
    },
  },
};

/**
 * Variants específicos para modo Player
 * Animações rápidas com feedback imediato
 */
export const playerVariants = {
  scene: {
    initial: {
      opacity: 0,
      y: 8,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.duration.fast,
        ease: motionTokens.easing.easeOut,
      },
    },
    exit: {
      opacity: 0,
      y: -4,
      transition: {
        duration: motionTokens.duration.fast,
      },
    },
  },
  narrative: {
    initial: {
      opacity: 0,
      y: 10,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.duration.fast,
        ease: motionTokens.easing.easeOut,
        staggerChildren: motionTokens.stagger.fast,
      },
    },
  },
};

/**
 * Retorna variants baseado no modo
 */
export function getVariantsByMode(mode: SessionMode, variantType: 'scene' | 'narrative'): Variants {
  switch (mode) {
    case 'presentation':
      return presentationVariants[variantType];
    case 'master':
      return masterVariants[variantType];
    case 'player':
      return playerVariants[variantType];
    default:
      return masterVariants[variantType];
  }
}


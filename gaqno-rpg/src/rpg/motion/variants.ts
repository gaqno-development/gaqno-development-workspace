/**
 * Motion Variants - Variants centralizados para animações
 * Separação clara: Tailwind = estilo, Framer = motion
 */
import { Variants } from 'framer-motion';
import { motionTokens } from './tokens';

// Variants para cenas
export const sceneVariants: Variants = {
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
    filter: 'blur(2px)',
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.easeIn,
    },
  },
};

// Variants para rolagem de dados
export const diceRollVariants: Variants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  rolling: {
    rotate: [0, 15, -15, 0, 10, -10, 0],
    scale: [1, 1.1, 1, 1.05, 1],
    transition: {
      duration: motionTokens.duration.normal,
      ease: motionTokens.easing.easeInOut,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
  },
  result: {
    rotate: 0,
    scale: 1,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.easeOut,
    },
  },
};

// Variants para narrativas
export const narrativeVariants: Variants = {
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
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: motionTokens.duration.fast,
    },
  },
};

// Variants por tipo de outcome
export const outcomeVariants: Record<string, Variants> = {
  critical_success: {
    initial: {
      scale: 0.9,
      opacity: 0,
    },
    enter: {
      scale: [0.9, 1.05, 1],
      opacity: 1,
      boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
      transition: {
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.bounce,
      },
    },
  },
  success: {
    initial: {
      opacity: 0,
      y: 10,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.duration.normal,
        ease: motionTokens.easing.easeOut,
      },
    },
  },
  partial: {
    initial: {
      opacity: 0,
      x: -10,
    },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        duration: motionTokens.duration.normal,
        ease: motionTokens.easing.easeOut,
      },
    },
  },
  failure: {
    initial: {
      opacity: 0,
      y: -10,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionTokens.duration.normal,
        ease: motionTokens.easing.easeOut,
      },
    },
  },
  critical_failure: {
    initial: {
      scale: 0.9,
      opacity: 0,
      rotate: -5,
    },
    enter: {
      scale: [0.9, 1.1, 1],
      opacity: 1,
      rotate: [0, -2, 2, 0],
      boxShadow: '0 0 40px rgba(239, 68, 68, 0.6)',
      transition: {
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.bounce,
      },
    },
  },
};

// Variants para revelação de imagens
export const imageRevealVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(8px)',
  },
  enter: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.easing.easeOut,
      delay: motionTokens.delay.short,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: motionTokens.duration.fast,
    },
  },
};

// Variants para toasts/notificações
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: motionTokens.duration.fast,
    },
  },
};

// Variants para transições de página
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: motionTokens.duration.normal,
      ease: motionTokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: motionTokens.duration.fast,
    },
  },
};


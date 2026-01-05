/**
 * Motion Tokens - Design system para animações
 * Define durações, easings e delays padrão para todo o sistema de motion
 */

export const motionTokens = {
  duration: {
    fast: 0.2,
    normal: 0.5,
    slow: 1.0,
    cinematic: 1.5,
  },
  easing: {
    easeOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
    easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
    easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    bounce: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
  },
  delay: {
    none: 0,
    short: 0.1,
    medium: 0.3,
    long: 0.5,
  },
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.2,
  },
} as const;

export type MotionDuration = keyof typeof motionTokens.duration;
export type MotionEasing = keyof typeof motionTokens.easing;
export type MotionDelay = keyof typeof motionTokens.delay;


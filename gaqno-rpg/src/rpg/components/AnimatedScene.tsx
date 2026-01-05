/**
 * AnimatedScene - Container de cena com motion integrado
 * Wrapper para cenas com animações de entrada/saída
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHighestPriorityMotion } from '../hooks/useSceneMotion';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface AnimatedSceneProps {
  children: React.ReactNode;
  className?: string;
  sceneId?: string;
  show?: boolean;
}

export const AnimatedScene: React.FC<AnimatedSceneProps> = ({
  children,
  className,
  sceneId,
  show = true,
}) => {
  const variants = useHighestPriorityMotion();

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.section
          key={sceneId || 'scene'}
          className={cn(
            'relative w-full h-full bg-black/40 rounded-xl overflow-hidden',
            className
          )}
          variants={variants || undefined}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {children}
        </motion.section>
      )}
    </AnimatePresence>
  );
};


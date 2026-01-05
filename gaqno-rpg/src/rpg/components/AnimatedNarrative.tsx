/**
 * AnimatedNarrative - NarrativeDisplay com motion integrado
 * Substitui NarrativeDisplay com animações baseadas em eventos do backend
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { NarratorResponse, UIAction } from '../types/rpg.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';
import { useMotionStore } from '../store/motionStore';
import { useMotionByMode } from '../hooks/useMotionByMode';
import {
  processUIActions,
  processOutcome,
  MotionEventType,
} from '../motion/eventToMotionMap';

interface AnimatedNarrativeProps {
  response: NarratorResponse | null;
  onAnimationComplete?: () => void;
  mode?: 'presentation' | 'master' | 'player';
}

const outcomeColors: Record<string, string> = {
  critical_success: 'text-green-600 border-green-500',
  success: 'text-blue-600 border-blue-500',
  partial: 'text-yellow-600 border-yellow-500',
  failure: 'text-orange-600 border-orange-500',
  critical_failure: 'text-red-600 border-red-500',
};

export const AnimatedNarrative: React.FC<AnimatedNarrativeProps> = ({
  response,
  onAnimationComplete,
  mode = 'player',
}) => {
  const { triggerEvent } = useMotionStore();
  const [currentEvent, setCurrentEvent] = React.useState<MotionEventType | null>(null);

  useEffect(() => {
    if (!response) {
      setCurrentEvent(null);
      return;
    }

    // Processa ui_actions
    const uiEvents = processUIActions(response.ui_actions, mode);
    uiEvents.forEach((event) => {
      triggerEvent(event);
    });

    // Processa outcome
    const outcomeEvent = processOutcome(response.outcome, mode);
    const outcomeEventId = triggerEvent(outcomeEvent);
    setCurrentEvent(outcomeEvent.type);

    // Limpa evento após duração
    if (outcomeEvent.duration) {
      setTimeout(() => {
        setCurrentEvent(null);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, outcomeEvent.duration);
    }
  }, [response, mode, triggerEvent, onAnimationComplete]);

  const variants = useMotionByMode(
    currentEvent || (response ? `outcome.${response.outcome}` as MotionEventType : null),
    mode
  );

  if (!response) {
    return null;
  }

  const narrative = response.narratives.find((n) => n.level === response.outcome);
  const outcomeColor = outcomeColors[response.outcome] || outcomeColors.success;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={response.outcome}
        variants={variants || undefined}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <Card className={cn('transition-all', outcomeColor)}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultado: {response.outcome.replace('_', ' ').toUpperCase()}</span>
              <span className="text-sm font-normal">
                Dado: {response.dice.roll} (Natural: {response.dice.natural})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              className="space-y-4"
              variants={{
                enter: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              <motion.p
                className="text-lg leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {narrative?.text}
              </motion.p>

              {response.mechanics.xp_gain && (
                <motion.div
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  XP ganho: +{response.mechanics.xp_gain}
                </motion.div>
              )}

              {response.mechanics.hp_change && (
                <motion.div
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  HP: {response.mechanics.hp_change > 0 ? '+' : ''}
                  {response.mechanics.hp_change}
                </motion.div>
              )}

              {response.next_scene_hooks && response.next_scene_hooks.length > 0 && (
                <motion.div
                  className="mt-4 pt-4 border-t"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-sm font-semibold mb-2">Ganchos para próxima cena:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {response.next_scene_hooks.map((hook, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                      >
                        {hook}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};


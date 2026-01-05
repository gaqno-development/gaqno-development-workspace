/**
 * AnimatedDice - DiceRoller com motion integrado
 * Substitui DiceRoller com animações baseadas em eventos
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { DiceResult } from '../types/rpg.types';
import { useMotionStore } from '../store/motionStore';
import { useMotionByMode } from '../hooks/useMotionByMode';
import { MotionEventType } from '../motion/eventToMotionMap';

interface AnimatedDiceProps {
  onRoll: (result: DiceResult) => void;
  formula?: string;
  target?: number;
  disabled?: boolean;
  mode?: 'presentation' | 'master' | 'player';
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export const AnimatedDice: React.FC<AnimatedDiceProps> = ({
  onRoll,
  formula = '1d20',
  target,
  disabled = false,
  mode = 'player',
}) => {
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceResult | null>(null);
  const [currentEvent, setCurrentEvent] = useState<MotionEventType | null>(null);
  const { triggerEvent } = useMotionStore();

  const variants = useMotionByMode(currentEvent, mode);

  const rollDice = () => {
    if (disabled || rolling) return;

    setRolling(true);
    setCurrentEvent('dice.roll');
    
    // Dispara evento de rolagem
    triggerEvent({
      type: 'dice.roll',
      priority: 'alta',
      mode,
    });

    setTimeout(() => {
      const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
      if (!match) {
        setRolling(false);
        setCurrentEvent(null);
        return;
      }

      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : 0;

      let total = 0;
      let natural = 0;
      for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        total += roll;
        if (i === 0) natural = roll;
      }
      total += modifier;

      const result: DiceResult = {
        formula,
        roll: total,
        natural,
        target,
      };

      setLastRoll(result);
      setRolling(false);
      setCurrentEvent('dice.result');
      
      // Dispara evento de resultado
      triggerEvent({
        type: 'dice.result',
        priority: natural === 20 || natural === 1 ? 'alta' : 'média',
        mode,
      });

      // Limpa evento após animação
      setTimeout(() => {
        setCurrentEvent(null);
      }, 500);

      onRoll(result);
    }, 500);
  };

  const DiceIcon = lastRoll && lastRoll.natural > 0 && lastRoll.natural <= 6
    ? diceIcons[lastRoll.natural - 1]
    : Dice1;

  return (
    <motion.div
      className="flex flex-col items-center gap-4 p-4 border rounded-lg"
      variants={variants || undefined}
      initial="initial"
      animate={rolling ? 'rolling' : lastRoll ? 'result' : 'initial'}
    >
      <motion.div
        className="flex items-center gap-2"
        animate={rolling ? {
          rotate: [0, 15, -15, 0, 10, -10, 0],
          scale: [1, 1.1, 1, 1.05, 1],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: rolling ? Infinity : 0,
          repeatType: 'reverse',
        }}
      >
        <DiceIcon className="w-12 h-12" />
        {lastRoll && (
          <motion.div
            className="text-2xl font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {lastRoll.roll}
            {lastRoll.natural === 20 && (
              <motion.span
                className="text-green-500 ml-2"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                🎯
              </motion.span>
            )}
            {lastRoll.natural === 1 && (
              <motion.span
                className="text-red-500 ml-2"
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                💥
              </motion.span>
            )}
          </motion.div>
        )}
      </motion.div>
      <div className="text-sm text-muted-foreground">
        {formula}
        {target && ` (DC: ${target})`}
      </div>
      <Button
        onClick={rollDice}
        disabled={disabled || rolling}
        loading={rolling}
      >
        {rolling ? 'Rolando...' : 'Rolar Dados'}
      </Button>
      {lastRoll && (
        <motion.div
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Natural: {lastRoll.natural}
        </motion.div>
      )}
    </motion.div>
  );
};


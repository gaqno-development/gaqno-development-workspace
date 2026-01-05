import React, { useState } from 'react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';
import { DiceResult } from '../types/rpg.types';

interface DiceRollerProps {
  onRoll: (result: DiceResult) => void;
  formula?: string;
  target?: number;
  disabled?: boolean;
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRoll,
  formula = '1d20',
  target,
  disabled = false
}) => {
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<DiceResult | null>(null);

  const rollDice = () => {
    if (disabled || rolling) return;

    setRolling(true);
    
    setTimeout(() => {
      const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
      if (!match) {
        setRolling(false);
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
        target
      };

      setLastRoll(result);
      setRolling(false);
      onRoll(result);
    }, 500);
  };

  const DiceIcon = lastRoll && lastRoll.natural > 0 && lastRoll.natural <= 6
    ? diceIcons[lastRoll.natural - 1]
    : Dice1;

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <DiceIcon className={`w-12 h-12 transition-transform ${rolling ? 'animate-spin' : ''}`} />
        {lastRoll && (
          <div className="text-2xl font-bold">
            {lastRoll.roll}
            {lastRoll.natural === 20 && <span className="text-green-500 ml-2">🎯</span>}
            {lastRoll.natural === 1 && <span className="text-red-500 ml-2">💥</span>}
          </div>
        )}
      </div>
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
        <div className="text-xs text-muted-foreground">
          Natural: {lastRoll.natural}
        </div>
      )}
    </div>
  );
};


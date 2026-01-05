import React, { useState } from 'react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import { AnimatedDice } from './AnimatedDice';
import { DiceResult } from '../types/rpg.types';
import { useMotionStore } from '../store/motionStore';

interface ActionFormProps {
  onSubmit: (data: {
    action: string;
    dice: DiceResult;
    context?: Record<string, any>;
  }) => void;
  characterId?: string;
  disabled?: boolean;
  mode?: 'presentation' | 'master' | 'player';
}

export const ActionForm: React.FC<ActionFormProps> = ({
  onSubmit,
  characterId,
  disabled = false,
  mode = 'player',
}) => {
  const [action, setAction] = useState('');
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [formula, setFormula] = useState('1d20');
  const [target, setTarget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action || !diceResult) return;

    onSubmit({
      action,
      dice: diceResult,
      context: {
        location: '',
        npc: ''
      }
    });

    setAction('');
    setDiceResult(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div>
        <Label htmlFor="action">Ação</Label>
        <Input
          id="action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Descreva a ação do personagem..."
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="formula">Fórmula do Dado</Label>
          <Input
            id="formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="1d20"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="target">DC Alvo (opcional)</Label>
          <Input
            id="target"
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="15"
            disabled={disabled}
          />
        </div>
      </div>

      <AnimatedDice
        onRoll={setDiceResult}
        formula={formula}
        target={target ? parseInt(target) : undefined}
        disabled={disabled}
        mode={mode}
      />

      <Button
        type="submit"
        disabled={disabled || !action || !diceResult}
        className="w-full"
      >
        Submeter Ação
      </Button>
    </form>
  );
};


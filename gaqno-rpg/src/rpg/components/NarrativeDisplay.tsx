import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { NarratorResponse, UIAction } from '../types/rpg.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface NarrativeDisplayProps {
  response: NarratorResponse | null;
  onAnimationComplete?: () => void;
}

const outcomeColors: Record<string, string> = {
  critical_success: 'text-green-600 border-green-500',
  success: 'text-blue-600 border-blue-500',
  partial: 'text-yellow-600 border-yellow-500',
  failure: 'text-orange-600 border-orange-500',
  critical_failure: 'text-red-600 border-red-500'
};

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  response,
  onAnimationComplete
}) => {
  const [currentNarrative, setCurrentNarrative] = useState<string>('');
  const [animations, setAnimations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!response) {
      setCurrentNarrative('');
      return;
    }

    const narrative = response.narratives.find(n => n.level === response.outcome);
    if (narrative) {
      setCurrentNarrative(narrative.text);
    }

    if (response.ui_actions) {
      response.ui_actions.forEach((action: UIAction) => {
        if (action.type === 'animation') {
          setAnimations(prev => new Set(prev).add(action.name));
          
          setTimeout(() => {
            setAnimations(prev => {
              const next = new Set(prev);
              next.delete(action.name);
              return next;
            });
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }, action.duration_ms);
        }
      });
    }
  }, [response, onAnimationComplete]);

  if (!response) {
    return null;
  }

  const narrative = response.narratives.find(n => n.level === response.outcome);
  const outcomeColor = outcomeColors[response.outcome] || outcomeColors.success;

  return (
    <Card className={cn('transition-all', outcomeColor, animations.has('fade') && 'opacity-50')}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resultado: {response.outcome.replace('_', ' ').toUpperCase()}</span>
          <span className="text-sm font-normal">
            Dado: {response.dice.roll} (Natural: {response.dice.natural})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">{currentNarrative || narrative?.text}</p>
          
          {response.mechanics.xp_gain && (
            <div className="text-sm text-muted-foreground">
              XP ganho: +{response.mechanics.xp_gain}
            </div>
          )}
          
          {response.mechanics.hp_change && (
            <div className="text-sm text-muted-foreground">
              HP: {response.mechanics.hp_change > 0 ? '+' : ''}{response.mechanics.hp_change}
            </div>
          )}

          {response.next_scene_hooks && response.next_scene_hooks.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-semibold mb-2">Ganchos para próxima cena:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {response.next_scene_hooks.map((hook, idx) => (
                  <li key={idx}>{hook}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


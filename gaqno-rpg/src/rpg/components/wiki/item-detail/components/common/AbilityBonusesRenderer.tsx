import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { ReferencedItem } from '../ReferencedItem';

interface AbilityBonusesRendererProps {
  abilityBonuses: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const AbilityBonusesRenderer: React.FC<AbilityBonusesRendererProps> = ({
  abilityBonuses,
  onItemClick,
  resolvedData,
}) => {
  if (!abilityBonuses || abilityBonuses.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {abilityBonuses.map((bonus: any, idx: number) => {
        if (!bonus.ability_score) return null;
        
        const abilityScore = bonus.ability_score;
        const bonusValue = bonus.bonus || 0;
        const bonusText = bonusValue > 0 ? `+${bonusValue}` : String(bonusValue);
        
        if (abilityScore.url) {
          return (
            <div key={idx} className="flex items-center gap-2">
              <ReferencedItem
                url={abilityScore.url}
                item={abilityScore}
                onItemClick={onItemClick}
                resolvedData={resolvedData}
              />
              <Badge variant="default" className="bg-primary text-primary-foreground">
                {bonusText}
              </Badge>
            </div>
          );
        }
        
        return (
          <div key={idx} className="flex items-center gap-2">
            <Badge variant="secondary">{abilityScore.name || abilityScore.index}</Badge>
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {bonusText}
            </Badge>
          </div>
        );
      })}
    </div>
  );
};


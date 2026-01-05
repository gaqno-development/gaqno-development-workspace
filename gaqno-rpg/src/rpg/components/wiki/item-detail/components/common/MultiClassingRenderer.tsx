import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';

interface MultiClassingRendererProps {
  multiClassing: any;
  onItemClick?: (category: string, index: string) => void;
}

export const MultiClassingRenderer: React.FC<MultiClassingRendererProps> = ({ multiClassing }) => {
  if (!multiClassing) return null;
  
  return (
    <div className="space-y-3">
      {multiClassing.prerequisites && multiClassing.prerequisites.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Pré-requisitos</h4>
          <div className="flex flex-wrap gap-2">
            {multiClassing.prerequisites.map((prereq: any, idx: number) => {
              if (prereq.ability_score) {
                return (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {prereq.ability_score.name || prereq.ability_score.index}: {prereq.minimum_score}+
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
      
      {multiClassing.proficiencies && multiClassing.proficiencies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Proficiências</h4>
          <div className="flex flex-wrap gap-2">
            {multiClassing.proficiencies.map((prof: any, idx: number) => (
              <Badge key={idx} variant="outline">
                {prof.name || prof.index}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


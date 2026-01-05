import React from 'react';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { ReferencedItem } from '../ReferencedItem';

interface ProficiencyChoicesRendererProps {
  choices: any;
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const ProficiencyChoicesRenderer: React.FC<ProficiencyChoicesRendererProps> = ({
  choices,
  onItemClick,
  resolvedData,
}) => {
  if (!choices || !choices.from || !choices.from.options) return null;
  
  const options = choices.from.options || [];
  const desc = choices.desc || '';
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {desc && <p className="text-sm font-medium mb-2">{desc}</p>}
          <div className="flex flex-wrap gap-2">
            {options.map((option: any, idx: number) => {
              if (option.option_type === 'reference' && option.item) {
                return (
                  <ReferencedItem
                    key={idx}
                    url={option.item.url}
                    item={option.item}
                    onItemClick={onItemClick}
                    resolvedData={resolvedData}
                    compact={true}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


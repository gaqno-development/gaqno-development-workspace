import React from 'react';
import { Badge, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@gaqno-dev/frontcore/components/ui';
import { ChevronDown } from 'lucide-react';

interface SpellcastingRendererProps {
  spellcasting: any;
}

export const SpellcastingRenderer: React.FC<SpellcastingRendererProps> = ({ spellcasting }) => {
  if (!spellcasting) return null;
  
  return (
    <div className="space-y-4">
      {spellcasting.level && (
        <div className="flex items-center gap-2">
          <Badge>Nível {spellcasting.level}</Badge>
          {spellcasting.spellcasting_ability && (
            <Badge variant="outline">
              {spellcasting.spellcasting_ability.name || spellcasting.spellcasting_ability.index}
            </Badge>
          )}
        </div>
      )}
      
      {spellcasting.info && Array.isArray(spellcasting.info) && (
        <div className="space-y-3">
          {spellcasting.info.map((info: any, idx: number) => (
            <Collapsible key={idx} defaultOpen={idx === 0} className="group">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                <span className="font-semibold text-sm">{info.name || `Seção ${idx + 1}`}</span>
                <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/group:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-4">
                  {Array.isArray(info.desc) ? (
                    info.desc.map((desc: string, descIdx: number) => (
                      <p key={descIdx} className="text-sm leading-relaxed">{desc}</p>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed">{info.desc}</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};


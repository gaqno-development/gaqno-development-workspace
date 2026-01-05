import React from 'react';
import { Badge, Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { formatDamage } from '../../helpers';

interface SpecialAbilitiesRendererProps {
  abilities: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const SpecialAbilitiesRenderer: React.FC<SpecialAbilitiesRendererProps> = ({
  abilities,
  onItemClick,
  resolvedData,
}) => {
  if (!abilities || abilities.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {abilities.map((ability: any, idx: number) => (
        <Card key={idx} className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm">{ability.name}</h4>
              {ability.usage && (
                <Badge variant="outline" className="text-xs">
                  {ability.usage.type === 'per day' && `${ability.usage.times}/dia`}
                  {ability.usage.type === 'recharge on roll' && `Recarga ${ability.usage.dice} (${ability.usage.min_value}+)`}
                </Badge>
              )}
            </div>
            {ability.desc && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {Array.isArray(ability.desc) ? ability.desc.join(' ') : ability.desc}
              </p>
            )}
            {ability.damage && ability.damage.length > 0 && (
              <div className="mt-2">
                {formatDamage(ability.damage, onItemClick, resolvedData)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


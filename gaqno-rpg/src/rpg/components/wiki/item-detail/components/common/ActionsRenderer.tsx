import React from 'react';
import { Badge, Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { formatDamage } from '../../helpers';

interface ActionsRendererProps {
  actions: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const ActionsRenderer: React.FC<ActionsRendererProps> = ({
  actions,
  onItemClick,
  resolvedData,
}) => {
  if (!actions || actions.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {actions.map((action: any, idx: number) => (
        <Card key={idx} className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm">{action.name}</h4>
              {action.attack_bonus !== undefined && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  +{action.attack_bonus} to hit
                </Badge>
              )}
            </div>
            {action.desc && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {Array.isArray(action.desc) ? action.desc.join(' ') : action.desc}
              </p>
            )}
            {action.damage && action.damage.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-semibold mr-2">Dano:</span>
                {formatDamage(action.damage, onItemClick, resolvedData)}
              </div>
            )}
            {action.dc && (
              <div className="mb-2">
                <Badge variant="outline">
                  CD {action.dc.dc_value} {action.dc.dc_type.name || action.dc.dc_type.index}
                  {action.dc.success_type === 'half' && ' (metade em sucesso)'}
                </Badge>
              </div>
            )}
            {action.usage && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {action.usage.type === 'per day' && `${action.usage.times}/dia`}
                  {action.usage.type === 'recharge on roll' && `Recarga ${action.usage.dice} (${action.usage.min_value}+)`}
                </Badge>
              </div>
            )}
            {action.actions && action.actions.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold">Ações:</span> {action.actions.map((a: any) => a.action_name).join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


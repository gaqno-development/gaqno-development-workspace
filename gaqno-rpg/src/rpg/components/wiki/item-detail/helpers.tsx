import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { ComponentIcon, DamageTypeIcon } from '../Dnd5eIcons';
import { ReferencedItem } from './components/ReferencedItem';

export const getResolvedReference = (resolvedData: any, url: string): any | null => {
  if (!resolvedData || !url) return null;
  
  const urlParts = url.split('/').filter((p) => p && p !== 'api' && p !== '2014');
  if (urlParts.length < 2) return null;
  
  const category = urlParts[0];
  const index = urlParts[1];
  const key = `${category}:${index}`;
  
  return resolvedData[key] || null;
};

export const getCategoryFromUrl = (url: string): string | null => {
  const match = url.match(/\/api\/2014\/([^/]+)\//);
  return match ? match[1] : null;
};

export const formatSpellLevel = (level: number): React.ReactNode => {
  const colors: Record<number, string> = {
    0: 'bg-gray-500',
    1: 'bg-blue-500',
    2: 'bg-green-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
    6: 'bg-purple-500',
    7: 'bg-pink-500',
    8: 'bg-indigo-500',
    9: 'bg-cyan-500',
  };
  return (
    <Badge className={colors[level] || 'bg-gray-500'} variant="default">
      Nível {level}
    </Badge>
  );
};

export const formatComponents = (components: string[]): React.ReactNode => {
  if (!components || components.length === 0) return null;
  
  return (
    <div className="flex gap-2 items-center">
      {components.map((comp, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <ComponentIcon component={comp} />
          <span className="text-sm font-mono">{comp}</span>
        </div>
      ))}
    </div>
  );
};

export const formatCost = (cost: any): string | null => {
  if (!cost) return null;
  if (typeof cost === 'string') return cost;
  if (cost.quantity !== undefined && cost.unit) {
    return `${cost.quantity} ${cost.unit}`;
  }
  return null;
};

export const formatDamage = (
  damage: any,
  onItemClick?: (category: string, index: string) => void,
  resolvedData?: any
): React.ReactNode => {
  if (!damage) return null;
  
  if (Array.isArray(damage)) {
    return (
      <div className="space-y-1">
        {damage.map((dmg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {dmg.damage_type && (
              <>
                <DamageTypeIcon type={dmg.damage_type.name || dmg.damage_type.index || ''} />
                {dmg.damage_type.url ? (
                  <ReferencedItem
                    url={dmg.damage_type.url}
                    item={dmg.damage_type}
                    onItemClick={onItemClick}
                    resolvedData={resolvedData}
                    compact
                  />
                ) : (
                  <span className="text-sm font-semibold">{dmg.damage_type.name || dmg.damage_type.index}:</span>
                )}
              </>
            )}
            <span className="text-sm">{dmg.damage_dice || dmg.damage || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof damage === 'object') {
    const damageDice = damage.damage_dice || damage.damage || '';
    const damageType = damage.damage_type;
    
    if (damageType) {
      return (
        <div className="flex items-center gap-2">
          <DamageTypeIcon type={damageType.name || damageType.index || ''} />
          {damageType.url ? (
            <ReferencedItem
              url={damageType.url}
              item={damageType}
              onItemClick={onItemClick}
              resolvedData={resolvedData}
              compact
            />
          ) : (
            <span className="text-sm font-semibold">{damageType.name || damageType.index}:</span>
          )}
          {damageDice && <span className="text-sm">{damageDice}</span>}
        </div>
      );
    }
    
    if (damageDice) {
      return <span className="text-sm">{damageDice}</span>;
    }
    
    if (damage.url) {
      return (
        <ReferencedItem
          url={damage.url}
          item={damage}
          onItemClick={onItemClick}
          resolvedData={resolvedData}
        />
      );
    }
    
    return (
      <div className="text-xs bg-muted p-2 rounded overflow-auto">
        <pre className="whitespace-pre-wrap">{JSON.stringify(damage, null, 2)}</pre>
      </div>
    );
  }
  
  return <span className="text-sm">{String(damage)}</span>;
};


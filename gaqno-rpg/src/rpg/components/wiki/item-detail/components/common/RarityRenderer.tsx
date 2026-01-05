import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';

interface RarityRendererProps {
  rarity: any;
}

export const RarityRenderer: React.FC<RarityRendererProps> = ({ rarity }) => {
  if (!rarity) return null;
  
  const rarityName = typeof rarity === 'string' ? rarity : rarity.name || rarity;
  if (!rarityName) return null;
  
  const rarityColors: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
    'Common': { variant: 'secondary' },
    'Uncommon': { variant: 'default' },
    'Rare': { variant: 'outline', className: 'border-purple-500 text-purple-700 dark:text-purple-400' },
    'Very Rare': { variant: 'destructive' },
    'Legendary': { variant: 'default', className: 'bg-yellow-500 text-yellow-950 border-yellow-600' },
    'Artifact': { variant: 'default', className: 'bg-amber-500 text-amber-950 border-amber-600' },
  };
  
  const config = rarityColors[rarityName] || { variant: 'secondary' };
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {rarityName}
    </Badge>
  );
};


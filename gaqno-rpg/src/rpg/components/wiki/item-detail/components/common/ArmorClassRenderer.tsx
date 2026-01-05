import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';

interface ArmorClassRendererProps {
  armorClass: any;
}

export const ArmorClassRenderer: React.FC<ArmorClassRendererProps> = ({ armorClass }) => {
  if (!armorClass) return null;
  
  if (typeof armorClass === 'object' && armorClass !== null) {
    const type = armorClass.type || 'armor';
    let value: number | null = null;
    
    if (armorClass.value !== undefined && armorClass.value !== null) {
      value = typeof armorClass.value === 'number' ? armorClass.value : Number(armorClass.value);
    } else if (typeof armorClass === 'number') {
      value = armorClass;
    }
    
    if (value === null || isNaN(value)) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          CA -
        </Badge>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-primary text-primary-foreground font-bold text-sm">
          CA {value}
        </Badge>
        {type && type !== 'armor' && (
          <span className="text-xs text-muted-foreground capitalize">({type})</span>
        )}
      </div>
    );
  }
  
  if (typeof armorClass === 'number') {
    return (
      <Badge variant="default" className="bg-primary text-primary-foreground font-bold text-sm">
        CA {armorClass}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline">
      CA {String(armorClass)}
    </Badge>
  );
};


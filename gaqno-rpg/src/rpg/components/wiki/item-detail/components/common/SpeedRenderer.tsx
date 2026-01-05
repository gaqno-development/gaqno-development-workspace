import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';

interface SpeedRendererProps {
  speed: any;
}

export const SpeedRenderer: React.FC<SpeedRendererProps> = ({ speed }) => {
  if (!speed) return null;
  
  if (typeof speed === 'object') {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(speed).map(([type, value]) => (
          <Badge key={type} variant="outline" className="font-medium">
            <span className="capitalize font-semibold">{type}:</span> {String(value)}
          </Badge>
        ))}
      </div>
    );
  }
  
  return <Badge variant="outline" className="font-medium">{String(speed)}</Badge>;
};


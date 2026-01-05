import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';

interface SensesRendererProps {
  senses: any;
}

export const SensesRenderer: React.FC<SensesRendererProps> = ({ senses }) => {
  if (!senses) return null;
  
  if (typeof senses === 'string') {
    return <span className="text-sm font-medium">{senses}</span>;
  }
  
  if (typeof senses === 'object') {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(senses).map(([key, value]) => (
          <Badge key={key} variant="secondary" className="font-medium">
            <span className="capitalize font-semibold">{key.replace(/_/g, ' ')}:</span> {String(value)}
          </Badge>
        ))}
      </div>
    );
  }
  
  return <span className="text-sm font-medium">{String(senses)}</span>;
};


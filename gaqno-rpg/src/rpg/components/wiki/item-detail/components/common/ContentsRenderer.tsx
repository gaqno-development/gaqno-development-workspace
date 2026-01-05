import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { ReferencedItem } from '../ReferencedItem';

interface ContentsRendererProps {
  contents: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const ContentsRenderer: React.FC<ContentsRendererProps> = ({
  contents,
  onItemClick,
  resolvedData,
}) => {
  if (!contents || contents.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {contents.map((content: any, idx: number) => {
        if (!content.item) return null;
        
        const item = content.item;
        const quantity = content.quantity || 1;
        
        if (item.url) {
          return (
            <div key={idx} className="flex items-center gap-2">
              <Badge variant="outline">{quantity}x</Badge>
              <ReferencedItem
                url={item.url}
                item={item}
                onItemClick={onItemClick}
                resolvedData={resolvedData}
              />
            </div>
          );
        }
        
        return (
          <div key={idx} className="flex items-center gap-2">
            <Badge variant="outline">{quantity}x</Badge>
            <Badge variant="secondary">{item.name || item.index || 'Item'}</Badge>
          </div>
        );
      })}
    </div>
  );
};


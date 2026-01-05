import React from 'react';
import { ReferencedItem } from './ReferencedItem';

interface ReferencedItemArrayProps {
  items: any[];
  title?: string;
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const ReferencedItemArray: React.FC<ReferencedItemArrayProps> = ({
  items,
  title,
  onItemClick,
  resolvedData,
}) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-semibold">{title}</h4>}
      <div className="grid grid-cols-1 gap-2">
        {items.map((item, idx) => {
          if (!item || !item.url) return null;
          return <ReferencedItem key={idx} url={item.url} item={item} onItemClick={onItemClick} resolvedData={resolvedData} />;
        })}
      </div>
    </div>
  );
};


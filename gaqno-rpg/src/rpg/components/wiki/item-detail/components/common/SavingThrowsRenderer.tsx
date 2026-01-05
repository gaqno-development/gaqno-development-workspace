import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { ReferencedItem } from '../ReferencedItem';

interface SavingThrowsRendererProps {
  savingThrows: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const SavingThrowsRenderer: React.FC<SavingThrowsRendererProps> = ({
  savingThrows,
  onItemClick,
  resolvedData,
}) => {
  if (!savingThrows || savingThrows.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {savingThrows.map((st, idx) => {
        if (typeof st === 'string') {
          return (
            <Badge key={idx} variant="secondary">
              {st}
            </Badge>
          );
        }
        if (st.url) {
          return (
            <ReferencedItem
              key={idx}
              url={st.url}
              item={st}
              onItemClick={onItemClick}
              resolvedData={resolvedData}
            />
          );
        }
        return (
          <Badge key={idx} variant="secondary">
            {st.name || st.index || st}
          </Badge>
        );
      })}
    </div>
  );
};


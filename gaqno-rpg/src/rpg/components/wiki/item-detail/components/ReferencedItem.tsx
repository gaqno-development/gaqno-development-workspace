import React from 'react';
import { Badge, Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { ExternalLink } from 'lucide-react';
import { useDnd5eReferencedItem } from '../../../../hooks/useDnd5e';
import { CategoryIcon } from '../../Dnd5eIcons';
import { getCategoryFromUrl, getResolvedReference } from '../helpers';

interface ReferencedItemProps {
  url: string;
  item: any;
  onItemClick?: (category: string, index: string) => void;
  compact?: boolean;
  resolvedData?: any;
}

export const ReferencedItem: React.FC<ReferencedItemProps> = ({
  url,
  item,
  onItemClick,
  compact = false,
  resolvedData,
}) => {
  const category = getCategoryFromUrl(url);
  const resolved = resolvedData ? getResolvedReference(resolvedData, url) : null;
  const { data: referencedData, isLoading } = useDnd5eReferencedItem(resolved ? null : url);
  
  const displayData = resolved || referencedData || item;
  const name = displayData?.name || item?.name || item?.index || 'Unknown';
  const index = item?.index || url.split('/').pop() || '';
  
  const handleClick = () => {
    if (category && index && onItemClick) {
      onItemClick(category, index);
    }
  };
  
  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className="cursor-pointer hover:bg-accent transition-colors flex items-center gap-1"
        onClick={handleClick}
      >
        {category && <CategoryIcon category={category} size={12} />}
        <span>{name}</span>
        <ExternalLink className="w-3 h-3" />
      </Badge>
    );
  }
  
  return (
    <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={handleClick}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {category && <CategoryIcon category={category} />}
          <span className="text-sm font-medium flex-1">{name}</span>
          {isLoading && <span className="text-xs text-muted-foreground">Carregando...</span>}
          {referencedData && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
        </div>
        {referencedData?.desc && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {Array.isArray(referencedData.desc) 
              ? referencedData.desc[0] 
              : referencedData.desc}
          </p>
        )}
      </CardContent>
    </Card>
  );
};


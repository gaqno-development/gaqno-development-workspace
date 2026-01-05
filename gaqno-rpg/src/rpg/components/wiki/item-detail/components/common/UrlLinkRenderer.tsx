import React from 'react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { ExternalLink, Link2 } from 'lucide-react';
import { getCategoryFromUrl } from '../../helpers';
import { SpecialEndpointRenderer } from './SpecialEndpointRenderer';

interface UrlLinkRendererProps {
  url: string;
  label: string;
  onItemClick?: (category: string, index: string) => void;
}

export const UrlLinkRenderer: React.FC<UrlLinkRendererProps> = ({
  url,
  label,
  onItemClick,
}) => {
  if (!url) return null;
  
  const urlParts = url.split('/').filter((p) => p && p !== 'api' && p !== '2014');
  
  if (urlParts.length === 3) {
    const [category, index, endpoint] = urlParts;
    return (
      <SpecialEndpointRenderer
        category={category}
        index={index}
        endpoint={endpoint}
        label={label}
        onItemClick={onItemClick}
      />
    );
  }
  
  const category = getCategoryFromUrl(url);
  const index = url.split('/').pop() || '';
  
  const handleClick = () => {
    if (category && index && onItemClick) {
      onItemClick(category, index);
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="w-full justify-start"
    >
      <Link2 className="w-4 h-4 mr-2" />
      {label}
      <ExternalLink className="w-4 h-4 ml-auto" />
    </Button>
  );
};


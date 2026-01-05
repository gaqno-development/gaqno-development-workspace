import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageRendererProps {
  image: any;
  className?: string;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({ image, className = '' }) => {
  if (!image) return null;
  
  const imageUrl = typeof image === 'string' 
    ? image 
    : (image.url || image);
  
  if (!imageUrl) return null;
  
  const getFullImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/api/images/')) {
      return `https://www.dnd5eapi.co${url}`;
    }
    return url;
  };
  
  const fullUrl = getFullImageUrl(imageUrl);
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-md ${className}`}>
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <img
      src={fullUrl}
      alt="Item"
      className={`rounded-md object-contain ${className}`}
      onError={() => setImageError(true)}
    />
  );
};


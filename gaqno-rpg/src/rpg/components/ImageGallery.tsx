import React from 'react';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { RpgImage } from '../types/rpg.types';

interface ImageGalleryProps {
  images: RpgImage[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  if (images.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma imagem gerada ainda
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <Card key={image.id}>
          <CardContent className="p-0">
            <img
              src={image.imageUrl}
              alt={image.promptId || 'Generated image'}
              className="w-full h-auto rounded-lg"
            />
            {image.metadata?.prompt && (
              <div className="p-2 text-xs text-muted-foreground">
                {image.metadata.prompt}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


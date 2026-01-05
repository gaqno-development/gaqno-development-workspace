import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { MapPin, Mountain, TreePine, Building2 } from 'lucide-react';
import { LocationContext } from '../types/rpg.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface LocationDisplayProps {
  locationContext: LocationContext | null;
  backgroundImageUrl?: string;
  className?: string;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  locationContext,
  backgroundImageUrl,
  className,
}) => {
  if (!locationContext) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Localização desconhecida</p>
        </CardContent>
      </Card>
    );
  }

  const { city, terrain, environment, description } = locationContext;

  return (
    <Card 
      className={cn('h-full relative overflow-hidden', className)}
      style={{
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {backgroundImageUrl && (
        <div className="absolute inset-0 bg-black/40 z-0" />
      )}
      <div className={cn('relative z-10', backgroundImageUrl && 'bg-background/90 backdrop-blur-sm')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {city && (
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-semibold">Cidade</p>
                <p className="text-sm text-muted-foreground">{city}</p>
              </div>
            </div>
          )}
          
          {terrain && (
            <div className="flex items-start gap-2">
              <Mountain className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-semibold">Terreno</p>
                <p className="text-sm text-muted-foreground">{terrain}</p>
              </div>
            </div>
          )}
          
          {environment && (
            <div className="flex items-start gap-2">
              <TreePine className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-semibold">Ambiente</p>
                <p className="text-sm text-muted-foreground">{environment}</p>
              </div>
            </div>
          )}
          
          {description && (
            <div className="pt-2 border-t">
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};


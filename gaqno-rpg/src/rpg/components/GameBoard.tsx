import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { LocationDisplay } from './LocationDisplay';
import { NarrativeFlow } from './NarrativeFlow';
import { NarratorResponse, LocationContext, SessionMode } from '../types/rpg.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface GameBoardProps {
  narratives: NarratorResponse[];
  locationContext: LocationContext | null;
  backgroundImageUrl?: string;
  mode?: SessionMode;
  className?: string;
  children?: React.ReactNode;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  narratives,
  locationContext,
  backgroundImageUrl,
  mode = 'player',
  className,
  children,
}) => {
  React.useEffect(() => {
    console.log('[GameBoard] Rendering with:', { 
      narrativesCount: narratives.length, 
      locationContext, 
      backgroundImageUrl 
    });
  }, [narratives, locationContext, backgroundImageUrl]);

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-10 gap-6 w-full', className)}>
      <div className="lg:col-span-3">
        <LocationDisplay
          locationContext={locationContext}
          backgroundImageUrl={backgroundImageUrl}
          className="sticky top-6"
        />
      </div>
      
      <div className="lg:col-span-7 space-y-4 flex flex-col w-full">
        <Card className="flex flex-col w-full min-h-[500px]">
          <CardHeader>
            <CardTitle>Narrativas</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 w-full min-h-[400px]">
            <NarrativeFlow narratives={narratives} className="h-full w-full" />
          </CardContent>
        </Card>
        
        {children && (
          <div className="mt-4 w-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};


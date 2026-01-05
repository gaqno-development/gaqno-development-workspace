import React from 'react';
import {
  MapPin,
  Building2,
  Landmark,
  Castle,
  Map,
} from 'lucide-react';
import { Location, LocationType } from '../types/location.types';
import { RpgCard } from './ui/RpgCard';
import { Badge } from '@gaqno-dev/frontcore/components/ui';

interface LocationCardProps {
  location: Location;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const locationIcons: Record<LocationType, React.ComponentType<{ className?: string }>> = {
  dungeon: Castle,
  city: Building2,
  region: Map,
  landmark: Landmark,
  building: Building2,
};

const locationVariants: Record<LocationType, 'purple' | 'blue' | 'green' | 'yellow' | 'orange'> = {
  dungeon: 'purple',
  city: 'blue',
  region: 'green',
  landmark: 'yellow',
  building: 'orange',
};

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onClick,
  onEdit,
  onDelete,
  className,
}) => {
  const LocationIcon = locationIcons[location.type] || MapPin;
  const variant = locationVariants[location.type] || 'default';
  const hasEncounters = location.content?.encounters && Array.isArray(location.content.encounters) && location.content.encounters.length > 0;

  return (
    <RpgCard
      variant={variant}
      icon={LocationIcon}
      badge={location.type}
      badgeIcon={LocationIcon}
      animated={true}
      onClick={onClick}
      onEdit={onEdit}
      onDelete={onDelete}
      className={className}
      header={
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate mb-1">{location.name}</h3>
          {location.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {location.description}
            </p>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {location.coordinates && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>
              {location.coordinates.x !== undefined && `X: ${location.coordinates.x}`}
              {location.coordinates.y !== undefined && ` Y: ${location.coordinates.y}`}
              {location.coordinates.z !== undefined && ` Z: ${location.coordinates.z}`}
            </span>
          </div>
        )}

        {hasEncounters && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {location.content.encounters.length} Encontro{location.content.encounters.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {location.metadata && Object.keys(location.metadata).length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">Tags: </span>
            {Object.keys(location.metadata).slice(0, 3).join(', ')}
            {Object.keys(location.metadata).length > 3 && '...'}
          </div>
        )}
      </div>
    </RpgCard>
  );
};


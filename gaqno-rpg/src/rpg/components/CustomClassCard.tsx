import React from 'react';
import {
  Sword,
  Shield,
  Sparkles,
} from 'lucide-react';
import { CustomClass } from '../types/custom-class.types';
import { RpgCard } from './ui/RpgCard';
import { Badge } from '@gaqno-dev/frontcore/components/ui';

interface CustomClassCardProps {
  customClass: CustomClass;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const CustomClassCard: React.FC<CustomClassCardProps> = ({
  customClass,
  onClick,
  onEdit,
  onDelete,
  className,
}) => {
  const hasFeatures = customClass.features && Object.keys(customClass.features).length > 0;
  const hasSpellcasting = customClass.spellcasting && Object.keys(customClass.spellcasting).length > 0;

  return (
    <RpgCard
      variant="info"
      icon={Sword}
      badge={customClass.baseClass}
      badgeIcon={Sword}
      animated={true}
      onClick={onClick}
      onEdit={onEdit}
      onDelete={onDelete}
      className={className}
      header={
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate mb-1">{customClass.name}</h3>
          {customClass.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {customClass.description}
            </p>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-xs">
          {customClass.hitDie && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>d{customClass.hitDie}</span>
            </div>
          )}
          {hasSpellcasting && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>Conjurador</span>
            </div>
          )}
        </div>

        {hasFeatures && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">Características: </span>
            {Object.keys(customClass.features).slice(0, 3).join(', ')}
            {Object.keys(customClass.features).length > 3 && '...'}
          </div>
        )}

        {customClass.proficiencies && Object.keys(customClass.proficiencies).length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">Proficiências: </span>
            {Object.keys(customClass.proficiencies).slice(0, 2).join(', ')}
            {Object.keys(customClass.proficiencies).length > 2 && '...'}
          </div>
        )}
      </div>
    </RpgCard>
  );
};


import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface CardActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const CardActionButtons: React.FC<CardActionButtonsProps> = ({
  onEdit,
  onDelete,
  className,
}) => {
  if (!onEdit && !onDelete) {
    return null;
  }

  return (
    <div className={cn('flex gap-2 pt-2', className)}>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors flex items-center justify-center gap-1"
        >
          <Edit className="w-3 h-3" />
          Editar
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};


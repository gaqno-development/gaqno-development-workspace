import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Eye } from 'lucide-react';

interface Dnd5eItemCardProps {
  name: string;
  index: string;
  description?: string;
  metadata?: Record<string, any>;
  onViewDetails?: () => void;
  className?: string;
}

export const Dnd5eItemCard: React.FC<Dnd5eItemCardProps> = ({
  name,
  index,
  description,
  metadata,
  onViewDetails,
  className = '',
}) => {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(metadata).slice(0, 3).map(([key, value]) => (
              <span
                key={key}
                className="text-xs bg-muted px-2 py-1 rounded"
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onViewDetails}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          )}
        </CardContent>
      )}
      {!description && onViewDetails && (
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
        </CardContent>
      )}
    </Card>
  );
};


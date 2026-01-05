import React, { useState } from 'react';
import { AlertCircle, Zap, Lightbulb } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

export type ActionDotType = 'crisis' | 'action' | 'insight';

export interface ActionDot {
  id: string;
  type: ActionDotType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

interface ActionDotsProps {
  dots: ActionDot[];
  onDotClick?: (dot: ActionDot) => void;
  className?: string;
}

const typeConfig: Record<ActionDotType, { icon: React.ComponentType; color: string; bgColor: string; pulseColor: string }> = {
  crisis: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    pulseColor: 'animate-pulse',
  },
  action: {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    pulseColor: 'animate-pulse',
  },
  insight: {
    icon: Lightbulb,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    pulseColor: '',
  },
};

export const ActionDots: React.FC<ActionDotsProps> = ({
  dots,
  onDotClick,
  className,
}) => {
  const [expandedDot, setExpandedDot] = useState<string | null>(null);

  const handleDotClick = (dot: ActionDot) => {
    if (expandedDot === dot.id) {
      setExpandedDot(null);
    } else {
      setExpandedDot(dot.id);
    }
    if (onDotClick) {
      onDotClick(dot);
    }
  };

  if (dots.length === 0) {
    return null;
  }

  const sortedDots = [...dots].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className={cn('space-y-2', className)}>
      {sortedDots.map((dot) => {
        const config = typeConfig[dot.type];
        const Icon = config.icon;
        const isExpanded = expandedDot === dot.id;
        const isHighPriority = dot.priority === 'high';

        return (
          <GlassCard
            key={dot.id}
            variant="light"
            onClick={() => handleDotClick(dot)}
            className={cn(
              'transition-all duration-200',
              config.bgColor,
              isExpanded && 'ring-2 ring-primary',
              isHighPriority && config.pulseColor
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('shrink-0', config.color)}>
                <Icon className={cn('w-5 h-5', isHighPriority && 'animate-pulse')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm high-contrast-text">{dot.title}</h4>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    dot.priority === 'high' && 'bg-red-500/30 text-red-300',
                    dot.priority === 'medium' && 'bg-yellow-500/30 text-yellow-300',
                    dot.priority === 'low' && 'bg-blue-500/30 text-blue-300'
                  )}>
                    {dot.priority === 'high' ? 'Alta' : dot.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <p className="text-sm text-readable-sm high-contrast-text-muted">
                  {dot.description}
                </p>
                {isExpanded && dot.metadata && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    {Object.entries(dot.metadata).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-medium high-contrast-text-muted">{key}:</span>{' '}
                        <span className="high-contrast-text">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};


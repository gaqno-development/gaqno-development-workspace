import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@gaqno-dev/frontcore/components/ui';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { cn } from '@gaqno-dev/frontcore/lib/utils';
import { CardActionButtons } from './CardActionButtons';

export type RpgCardVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'blue' | 'green' | 'yellow' | 'orange' | 'red';

interface RpgCardProps {
  variant?: RpgCardVariant;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  animated?: boolean;
  index?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  showActions?: boolean;
}

const variantConfig: Record<RpgCardVariant, {
  bg: string;
  border: string;
  text: string;
  icon: string;
  badge: string;
}> = {
  default: {
    bg: 'bg-background/80 dark:bg-background/60',
    border: 'border-border/50',
    text: 'text-foreground',
    icon: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
  },
  success: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-500',
    text: 'text-blue-900 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-600 text-white',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-100',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-600 text-white',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-500',
    text: 'text-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-600 text-white',
  },
  info: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-500',
    text: 'text-indigo-900 dark:text-indigo-100',
    icon: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-600 text-white',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-500',
    text: 'text-purple-900 dark:text-purple-100',
    icon: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-600 text-white',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-500',
    text: 'text-blue-900 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-600 text-white',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-500',
    text: 'text-green-900 dark:text-green-100',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-600 text-white',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-100',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-600 text-white',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-500',
    text: 'text-orange-900 dark:text-orange-100',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-600 text-white',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-500',
    text: 'text-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-600 text-white',
  },
};

export const RpgCard: React.FC<RpgCardProps> = ({
  variant = 'default',
  icon: Icon,
  badge,
  badgeIcon: BadgeIcon,
  animated = true,
  index = 0,
  onClick,
  onEdit,
  onDelete,
  className,
  header,
  children,
  showActions = true,
}) => {
  const config = variantConfig[variant];

  const animationVariants = animated ? {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  } : undefined;

  const iconVariants = animated && Icon ? {
    hidden: {
      scale: 0,
      rotate: -180,
    },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        delay: 0.1 + (index * 0.05),
        type: 'spring',
        stiffness: 200,
        damping: 15,
      },
    },
  } : undefined;

  const cardContent = (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'backdrop-blur-sm',
        config.bg,
        config.border,
        'border-2',
        onClick && 'cursor-pointer',
        'hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}
      />

      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between gap-2">
          {header ? (
            header
          ) : (
            <div className="flex-1 min-w-0">
              {Icon && (
                <motion.div
                  variants={iconVariants}
                  initial={animated ? 'hidden' : false}
                  animate={animated ? 'visible' : false}
                  className={cn(
                    'flex-shrink-0 p-2 rounded-lg mb-2',
                    config.bg
                  )}
                >
                  <Icon className={cn('w-6 h-6', config.icon)} />
                </motion.div>
              )}
            </div>
          )}
          {badge && (
            <Badge className={cn('shrink-0', config.badge)}>
              {BadgeIcon && <BadgeIcon className="w-3 h-3 mr-1" />}
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('relative z-10 pt-6', config.text)}>
        <div className="space-y-3">
          {children}
        </div>
        {showActions && (onEdit || onDelete) && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <CardActionButtons onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (animated) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={animationVariants}
        className={className}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};




import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { cn } from '@gaqno-dev/frontcore/lib/utils'

interface IEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const EmptyState: React.FC<IEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  }

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className={cn('flex flex-col items-center justify-center text-center', sizeClasses[size])}>
        {Icon && (
          <div className={cn('mb-4 text-muted-foreground', iconSizes[size])}>
            <Icon className={cn('h-full w-full', iconSizes[size])} strokeWidth={1.5} />
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick} size="lg" className="min-w-[140px]">
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size="lg"
              className="min-w-[140px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

EmptyState.displayName = 'EmptyState'


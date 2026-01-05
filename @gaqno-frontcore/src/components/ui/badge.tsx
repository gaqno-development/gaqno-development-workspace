import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@gaqno-dev/frontcore/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-sm ' +
            'hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground shadow-sm ' +
            'hover:bg-secondary/80 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-sm ' +
            'hover:bg-destructive/90 dark:bg-destructive dark:text-destructive-foreground dark:hover:bg-destructive/90',
        outline:
          'border-border bg-background text-foreground shadow-sm ' +
            'hover:bg-accent hover:text-accent-foreground ' +
            'dark:border-muted-foreground dark:bg-transparent dark:hover:bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }


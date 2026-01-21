

import React from 'react'
import { Skeleton } from './skeleton'
import { Card, CardContent, CardHeader } from './card'
import { cn } from '../../lib/utils'

interface ILoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'text'
  count?: number
  className?: string
}

export const LoadingSkeleton: React.FC<ILoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  className,
}) => {
  const renderCardSkeleton = () => (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  )

  const renderListSkeleton = () => (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  const renderTableSkeleton = () => (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  )

  const renderTextSkeleton = () => (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )

  const renderGridSkeleton = () => (
    <div className={cn('grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  switch (variant) {
    case 'card':
      return (
        <div className={cn('grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <React.Fragment key={i}>{renderCardSkeleton()}</React.Fragment>
          ))}
        </div>
      )
    case 'list':
      return renderListSkeleton()
    case 'table':
      return renderTableSkeleton()
    case 'text':
      return renderTextSkeleton()
    default:
      return renderGridSkeleton()
  }
}

LoadingSkeleton.displayName = 'LoadingSkeleton'


import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@gaqno-dev/frontcore/lib/utils'

interface IBreadcrumbItem {
  label: string
  href?: string
}

interface IBreadcrumbsProps {
  items: IBreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export const Breadcrumbs: React.FC<IBreadcrumbsProps> = ({
  items,
  className,
  showHome = true,
}) => {
  const allItems = showHome
    ? [{ label: 'Dashboard', href: '/dashboard' }, ...items]
    : items

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1

          return (
            <li key={index} className="flex items-center">
              {index === 0 && showHome ? (
                <Link
                  to={item.href || '#'}
                  className="hover:text-foreground transition-colors"
                  aria-label="Home"
                >
                  <Home className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  {item.href && !isLast ? (
                    <Link
                      to={item.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={cn(isLast && 'text-foreground font-medium')}>
                      {item.label}
                    </span>
                  )}
                </>
              )}
              {!isLast && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

Breadcrumbs.displayName = 'Breadcrumbs'


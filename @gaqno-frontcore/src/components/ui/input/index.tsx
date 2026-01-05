import React from 'react'
import { cn } from '@gaqno-dev/frontcore/lib/utils'
import { IInputProps } from './types'
import { useInput } from './hooks/useInput'

export const Input = React.forwardRef<HTMLInputElement, IInputProps>(
  ({ className, type, error, ...props }, ref) => {
    const { isFocused, handleFocus, handleBlur } = useInput({ error, ...props })

    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'


import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@gaqno-dev/frontcore/lib/utils'
import { IButtonProps } from './types'
import { useButton } from './hooks/useButton'
import { buttonVariants } from './variants'

export const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
  ({ className, variant, size, disabled, loading, onClick, children, asChild = false, ...props }, ref) => {
    const { isPressed, handleMouseDown, handleMouseUp } = useButton({
      variant,
      size,
      disabled,
      loading,
      onClick,
      children,
    })
    
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={onClick}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'


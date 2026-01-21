import React from 'react'
import { cn } from '../../../lib/utils'
import { Input } from './Input'
import type { IInputProps } from './types'
import { Button } from '../button'
import { Sparkles, Loader2 } from 'lucide-react'

export interface InputWithAIProps extends IInputProps {
  onAISuggest?: () => void | Promise<void>
  isAIGenerating?: boolean
  aiSuggestLabel?: string
}

export const InputWithAI = React.forwardRef<HTMLInputElement, InputWithAIProps>(
  ({ onAISuggest, isAIGenerating = false, aiSuggestLabel = 'Gerar com IA', className, ...inputProps }, ref) => {
    const hasAISuggest = !!onAISuggest

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          className={cn(hasAISuggest && 'pr-28', className)}
          {...inputProps}
        />
        {hasAISuggest && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAISuggest}
              disabled={isAIGenerating || inputProps.disabled}
              className="h-8 px-2 text-xs shadow-sm"
            >
              {isAIGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  <span className="hidden sm:inline">Gerando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{aiSuggestLabel}</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }
)

InputWithAI.displayName = 'InputWithAI'

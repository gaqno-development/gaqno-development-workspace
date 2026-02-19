import React from "react";
import { cn } from "../../../lib/utils";
import { IInputProps } from "./types";
import { useInput } from "./hooks/useInput";
import { Button } from "../button";
import { LoaderPinwheelIcon } from "../loader-pinwheel";
import { SparklesIcon } from "../sparkles";
import { InputHTMLAttributes } from "react";

const CUSTOM_PROPS: readonly string[] = [
  "error",
  "showAISuggest",
  "onAISuggest",
  "isAIGenerating",
  "aiSuggestLabel",
] as const;

export const Input = React.forwardRef<HTMLInputElement, IInputProps>(
  (
    {
      className,
      type,
      error,
      showAISuggest = false,
      onAISuggest,
      isAIGenerating = false,
      aiSuggestLabel = "Gerar com IA",
      ...restProps
    },
    ref
  ) => {
    const hasAISuggest = showAISuggest && onAISuggest;

    const inputProps = Object.fromEntries(
      Object.entries(restProps).filter(([key]) => !CUSTOM_PROPS.includes(key))
    ) as InputHTMLAttributes<HTMLInputElement>;

    const { isFocused, handleFocus, handleBlur } = useInput({
      error,
      ...inputProps,
    });

    return (
      <div className="w-full">
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow duration-150 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              hasAISuggest && "pr-28",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
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
                    <LoaderPinwheelIcon size={12} className="mr-1" />
                    <span className="hidden sm:inline">Gerando...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon size={12} className="mr-1" />
                    <span className="hidden sm:inline">{aiSuggestLabel}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "motion/react"

import { cn } from "../../lib/utils"

const TABS_INDICATOR_LAYOUT_ID = "tabs-indicator"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex flex-nowrap items-center gap-0.5 rounded-md bg-muted p-1 text-muted-foreground",
      "min-h-[44px] sm:min-h-10",
      "overflow-x-auto overflow-y-hidden scroll-smooth",
      "min-w-0 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]",
      "relative",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement>(null)
  const [isActive, setIsActive] = React.useState(false)
  const mergedRef = React.useMemo(
    () => (el: HTMLButtonElement | null) => {
      (internalRef as React.MutableRefObject<HTMLButtonElement | null>).current = el
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el
    },
    [ref]
  )
  React.useLayoutEffect(() => {
    setIsActive(internalRef.current?.getAttribute("data-state") === "active")
  })
  return (
    <TabsPrimitive.Trigger
      ref={mergedRef}
      className={cn(
        "relative inline-flex flex-shrink-0 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all touch-manipulation",
        "min-h-[44px] sm:min-h-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layoutId={TABS_INDICATOR_LAYOUT_ID}
          className="absolute inset-0 rounded-sm bg-background shadow-sm"
          transition={{ duration: 0.2 }}
          style={{ zIndex: 0 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }


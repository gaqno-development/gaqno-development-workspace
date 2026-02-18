"use client";

import * as React from "react";
import { useIsMobile } from "../../hooks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "./sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from "./drawer";
import { cn } from "../../lib/utils";

type SheetSide = "top" | "right" | "bottom" | "left";
type DrawerDirection = "top" | "bottom" | "left" | "right";

export interface ResponsiveSheetDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sheetSide?: SheetSide;
  drawerDirection?: DrawerDirection;
  children?: React.ReactNode;
}

const ResponsiveSheetDrawerContext = React.createContext<{
  isMobile: boolean;
  sheetSide: SheetSide;
  drawerDirection: DrawerDirection;
} | null>(null);

function useResponsiveContext() {
  const ctx = React.useContext(ResponsiveSheetDrawerContext);
  if (!ctx) {
    throw new Error(
      "ResponsiveSheetDrawer components must be used within ResponsiveSheetDrawer"
    );
  }
  return ctx;
}

function ResponsiveSheetDrawerRoot({
  open: openProp,
  onOpenChange,
  sheetSide = "right",
  drawerDirection = "bottom",
  children,
}: ResponsiveSheetDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const isControlled = openProp !== undefined;
  const value = isControlled ? openProp : open;
  const setValue = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const contextValue = React.useMemo(
    () => ({ isMobile, sheetSide, drawerDirection }),
    [isMobile, sheetSide, drawerDirection]
  );

  if (isMobile) {
    return (
      <ResponsiveSheetDrawerContext.Provider value={contextValue}>
        <Drawer
          open={isControlled ? openProp : open}
          onOpenChange={setValue}
          direction={drawerDirection}
        >
          {children}
        </Drawer>
      </ResponsiveSheetDrawerContext.Provider>
    );
  }

  return (
    <ResponsiveSheetDrawerContext.Provider value={contextValue}>
      <Sheet
        open={isControlled ? openProp : open}
        onOpenChange={setValue}
      >
        {children}
      </Sheet>
    </ResponsiveSheetDrawerContext.Provider>
  );
}
ResponsiveSheetDrawerRoot.displayName = "ResponsiveSheetDrawer";

const ResponsiveSheetDrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>((props, ref) => {
  const { isMobile } = useResponsiveContext();
  if (isMobile) {
    return <DrawerTrigger ref={ref} {...props} />;
  }
  return <SheetTrigger ref={ref} {...props} />;
});
ResponsiveSheetDrawerTrigger.displayName = "ResponsiveSheetDrawerTrigger";

const ResponsiveSheetDrawerContent = React.forwardRef<
  React.ComponentRef<typeof SheetContent>,
  React.ComponentPropsWithoutRef<typeof SheetContent> & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => {
  const { isMobile, sheetSide } = useResponsiveContext();
  if (isMobile) {
    return (
      <DrawerContent
        ref={ref as React.Ref<React.ComponentRef<typeof DrawerContent>>}
        showCloseButton={showCloseButton}
        className={className}
      >
        {children}
      </DrawerContent>
    );
  }
  return (
    <SheetContent ref={ref} side={sheetSide} className={className} {...props}>
      {children}
    </SheetContent>
  );
});
ResponsiveSheetDrawerContent.displayName = "ResponsiveSheetDrawerContent";

const ResponsiveSheetDrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { isMobile } = useResponsiveContext();
  const Comp = isMobile ? DrawerHeader : SheetHeader;
  return (
    <Comp
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
};
ResponsiveSheetDrawerHeader.displayName = "ResponsiveSheetDrawerHeader";

const ResponsiveSheetDrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { isMobile } = useResponsiveContext();
  const Comp = isMobile ? DrawerFooter : SheetFooter;
  return (
    <Comp
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
};
ResponsiveSheetDrawerFooter.displayName = "ResponsiveSheetDrawerFooter";

const ResponsiveSheetDrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = useResponsiveContext();
  const Comp = isMobile ? DrawerTitle : SheetTitle;
  return (
    <Comp
      ref={ref}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
});
ResponsiveSheetDrawerTitle.displayName = "ResponsiveSheetDrawerTitle";

const ResponsiveSheetDrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = useResponsiveContext();
  const Comp = isMobile ? DrawerDescription : SheetDescription;
  return (
    <Comp
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
ResponsiveSheetDrawerDescription.displayName =
  "ResponsiveSheetDrawerDescription";

const ResponsiveSheetDrawerClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button">
>((props, ref) => {
  const { isMobile } = useResponsiveContext();
  if (isMobile) {
    return <DrawerClose ref={ref} {...props} />;
  }
  return <SheetClose ref={ref} {...props} />;
});
ResponsiveSheetDrawerClose.displayName = "ResponsiveSheetDrawerClose";

export const ResponsiveSheetDrawer = Object.assign(ResponsiveSheetDrawerRoot, {
  Trigger: ResponsiveSheetDrawerTrigger,
  Content: ResponsiveSheetDrawerContent,
  Header: ResponsiveSheetDrawerHeader,
  Footer: ResponsiveSheetDrawerFooter,
  Title: ResponsiveSheetDrawerTitle,
  Description: ResponsiveSheetDrawerDescription,
  Close: ResponsiveSheetDrawerClose,
});

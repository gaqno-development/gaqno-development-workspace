import * as React from "react";

import { cn } from "../../lib/utils";

export interface AspectRatioProps
  extends React.HTMLAttributes<HTMLDivElement> {
  ratio: number;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ className, ratio, style, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("overflow-hidden", className)}
      style={{
        aspectRatio: String(ratio),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };

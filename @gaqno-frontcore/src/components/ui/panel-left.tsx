"use client";

import type { Variants } from "motion/react";
import { motion } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/utils";

interface PanelLeftIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const RECT_VARIANTS: Variants = {
  initial: { scaleX: 1, originX: 0 },
  hover: {
    scaleX: [1, 1.05, 1],
    transition: { duration: 0.35, ease: "easeInOut" },
  },
};

const PanelLeftIcon = forwardRef<HTMLDivElement, PanelLeftIconProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        {...props}
      >
        <motion.svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
          initial="initial"
          whileHover="hover"
          variants={RECT_VARIANTS}
        >
          <rect height="18" width="18" x="3" y="3" rx="2" ry="2" />
          <line x1="9" x2="9" y1="3" y2="21" />
        </motion.svg>
      </div>
    );
  }
);

PanelLeftIcon.displayName = "PanelLeftIcon";

export { PanelLeftIcon };

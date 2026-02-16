"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { cn } from "../../lib/utils";

export interface LoaderPinwheelIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LoaderPinwheelIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  running?: boolean;
}

const G_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      duration: 1,
      ease: "linear",
    },
  },
};

const LoaderPinwheelIcon = forwardRef<
  LoaderPinwheelIconHandle,
  LoaderPinwheelIconProps
>(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 28,
      running = true,
      ...props
    },
    ref
  ) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useEffect(() => {
      if (running) {
        controls.start("animate");
      } else {
        controls.start("normal");
      }
    }, [running, controls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.g animate={controls} variants={G_VARIANTS}>
            <path d="M12 2v4" />
            <path d="m6.8 4.8-2.8 2.8" />
            <path d="M4 12H2" />
            <path d="m6.8 19.2-2.8-2.8" />
            <path d="M12 18v4" />
            <path d="m17.2 19.2 2.8-2.8" />
            <path d="M20 12h2" />
            <path d="m17.2 4.8 2.8 2.8" />
          </motion.g>
        </svg>
      </div>
    );
  }
);

LoaderPinwheelIcon.displayName = "LoaderPinwheelIcon";

export { LoaderPinwheelIcon };

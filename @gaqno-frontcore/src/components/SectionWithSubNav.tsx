import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "../lib/utils";

export interface SectionWithSubNavChild {
  segment: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

const CONTENT_TRANSITION = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.2 },
};

const STORAGE_KEY_PREFIX = "section-subnav-collapsed-";

function getStorageKey(title: string): string {
  return STORAGE_KEY_PREFIX + title.replace(/\s+/g, "-").toLowerCase();
}

function loadCollapsed(title: string, defaultCollapsed: boolean): boolean {
  if (typeof window === "undefined") return defaultCollapsed;
  const key = getStorageKey(title);
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultCollapsed;
  return stored === "true";
}

function saveCollapsed(title: string, collapsed: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(title), String(collapsed));
}

export interface SectionWithSubNavProps {
  basePath: string;
  defaultSegment: string;
  children: SectionWithSubNavChild[];
  segmentToComponent: Record<string, React.ComponentType>;
  title: string;
  variant: "vertical" | "horizontal";
  breadcrumbRoot: { label: string; href: string };
  enableContentTransition?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

function getSegmentFromPath(pathname: string, basePath: string): string {
  const normalizedBase = basePath.replace(/\/$/, "");
  const normalizedPath = pathname.replace(/\/$/, "");
  if (!normalizedPath.startsWith(normalizedBase)) return "";
  const remainder = normalizedPath
    .slice(normalizedBase.length)
    .replace(/^\//, "");
  return remainder.split("/")[0] ?? "";
}

export function SectionWithSubNav({
  basePath,
  defaultSegment,
  children,
  segmentToComponent,
  title,
  variant,
  breadcrumbRoot,
  enableContentTransition = false,
  collapsible = true,
  defaultCollapsed = false,
}: SectionWithSubNavProps) {
  const { pathname } = useLocation();
  const rawSegment = getSegmentFromPath(pathname, basePath);
  const segment =
    rawSegment && segmentToComponent[rawSegment] ? rawSegment : defaultSegment;
  const ChildComponent = segmentToComponent[segment];

  const canCollapse = collapsible && variant === "vertical";
  const [collapsed, setCollapsedState] = useState(() =>
    canCollapse ? loadCollapsed(title, defaultCollapsed) : false
  );

  useEffect(() => {
    if (canCollapse) saveCollapsed(title, collapsed);
  }, [title, collapsed, canCollapse]);

  const toggleCollapsed = () => setCollapsedState((c) => !c);

  const navClassName =
    variant === "vertical"
      ? collapsed
        ? "flex flex-col gap-1 border-r pr-2 mr-2 w-[52px] min-w-[52px] shrink-0 items-center"
        : "flex flex-col gap-1 border-r pr-4 mr-4 min-w-[180px] shrink-0"
      : "flex flex-wrap gap-1 border-b pb-2 mb-4";

  const contentArea = ChildComponent ? (
    enableContentTransition ? (
      <AnimatePresence mode="wait">
        <motion.div
          key={segment}
          initial={CONTENT_TRANSITION.initial}
          animate={CONTENT_TRANSITION.animate}
          exit={CONTENT_TRANSITION.exit}
          transition={CONTENT_TRANSITION.transition}
          className="h-full"
        >
          <ChildComponent />
        </motion.div>
      </AnimatePresence>
    ) : (
      <ChildComponent />
    )
  ) : null;

  const navContent = (
    <TooltipProvider delayDuration={300}>
      <nav className={navClassName} aria-label={`${title} sub-navigation`}>
        {canCollapse && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "shrink-0",
                  collapsed ? "mb-1 h-8 w-8" : "mb-2 h-8 w-8 -ml-1"
                )}
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        )}
        {children.map(({ segment: s, label, href, icon: Icon }) => {
          const link = (
            <Link
              key={s}
              to={href}
              className={cn(
                "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center p-2 w-9 h-9" : "px-3 py-2",
                segment === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={segment === s ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
          if (collapsed) {
            return (
              <Tooltip key={s}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-muted-foreground mb-4 shrink-0"
      >
        <Link
          to={breadcrumbRoot.href}
          className="hover:text-foreground transition-colors"
        >
          {breadcrumbRoot.label}
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      <div
        className={cn(
          "flex",
          variant === "vertical" ? "flex-1 min-h-0 gap-4" : "flex-col"
        )}
      >
        {navContent}
        <div className="flex-1 min-h-0 overflow-auto">{contentArea}</div>
      </div>
    </div>
  );
}

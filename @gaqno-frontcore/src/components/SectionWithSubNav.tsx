import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useIsMobile } from "../hooks";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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

export interface SectionWithSubNavGroup {
  label: string;
  children: SectionWithSubNavChild[];
}

export interface SectionWithSubNavProps {
  basePath: string;
  defaultSegment: string;
  children: SectionWithSubNavChild[];
  segmentToComponent: Record<string, React.ComponentType>;
  title: string;
  variant: "vertical" | "horizontal";
  breadcrumbRoot?: { label: string; href: string };
  enableContentTransition?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  navGroups?: SectionWithSubNavGroup[];
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

function renderLink(
  s: string,
  label: string,
  href: string,
  Icon: LucideIcon,
  segment: string,
  collapsed: boolean,
) {
  const link = (
    <Link
      key={s}
      to={href}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
        collapsed ? "justify-center p-2 w-9 h-9" : "px-3 py-2",
        segment === s
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted",
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
  defaultCollapsed = true,
  navGroups,
}: SectionWithSubNavProps) {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const rawSegment = getSegmentFromPath(pathname, basePath);
  const segment =
    rawSegment && segmentToComponent[rawSegment] ? rawSegment : defaultSegment;
  const ChildComponent = segmentToComponent[segment];

  const canCollapse = collapsible && variant === "vertical";
  const [collapsed, setCollapsedState] = useState(() =>
    canCollapse ? loadCollapsed(title, defaultCollapsed) : false,
  );

  useEffect(() => {
    if (canCollapse) saveCollapsed(title, collapsed);
  }, [title, collapsed, canCollapse]);

  const toggleCollapsed = () => setCollapsedState((c) => !c);

  const navWrapperClassName =
    variant === "vertical"
      ? "flex flex-col border-r shrink-0 min-h-0 self-stretch"
      : "";
  const verticalNavBase = "flex flex-col gap-1";
  const verticalNavSizes = collapsed
    ? "pr-2 mr-2 w-[52px] min-w-[52px] items-center"
    : "pr-4 mr-4 min-w-[180px]";
  const navClassName =
    variant === "vertical"
      ? canCollapse
        ? `${verticalNavBase} flex-1 min-h-0 ${verticalNavSizes}`
        : `${verticalNavBase} shrink-0 ${verticalNavSizes}`
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

  const collapseButton = canCollapse ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0",
            collapsed ? "mb-1 h-8 w-8" : "mb-2 h-8 w-8 -ml-1",
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
  ) : null;

  const linkList = navGroups ? (
    <>
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </div>
          )}
          {group.children.map(({ segment: s, label, href, icon: Icon }) =>
            renderLink(s, label, href, Icon, segment, collapsed),
          )}
        </div>
      ))}
    </>
  ) : (
    <>
      {children.map(({ segment: s, label, href, icon: Icon }) =>
        renderLink(s, label, href, Icon, segment, collapsed),
      )}
    </>
  );

  const navItems = navGroups
    ? navGroups.flatMap((group) => group.children)
    : children;
  const currentNavItem = navItems.find((item) => item.segment === segment);
  const CurrentIcon = currentNavItem?.icon;

  const navContent =
    variant === "vertical" && canCollapse ? (
      <TooltipProvider delayDuration={300}>
        <div
          className={cn(
            navWrapperClassName,
            collapsed ? "w-[52px]" : "min-w-[180px]",
          )}
        >
          <nav className={navClassName} aria-label={`${title} sub-navigation`}>
            {collapseButton}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-1">
              {linkList}
            </div>
          </nav>
        </div>
      </TooltipProvider>
    ) : variant === "vertical" ? (
      <TooltipProvider delayDuration={300}>
        <div className={navWrapperClassName}>
          <nav className={navClassName} aria-label={`${title} sub-navigation`}>
            {linkList}
          </nav>
        </div>
      </TooltipProvider>
    ) : (
      <TooltipProvider delayDuration={300}>
        <nav className={navClassName} aria-label={`${title} sub-navigation`}>
          {collapseButton}
          {linkList}
        </nav>
      </TooltipProvider>
    );

  const isMobileLayout = isMobile;
  const mobileNavTrigger = isMobileLayout ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 min-w-[180px] justify-between gap-2 px-3 text-left font-medium"
          aria-label={`Open ${title} navigation`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {CurrentIcon ? <CurrentIcon className="h-4 w-4 shrink-0" /> : null}
            <span className="truncate">{currentNavItem?.label || title}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(90vw,20rem)] max-h-[60vh] overflow-y-auto"
      >
        {navGroups
          ? navGroups.map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.children.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem key={item.segment} asChild>
                      <Link
                        to={item.href}
                        className="flex items-center gap-2"
                        aria-current={
                          segment === item.segment ? "page" : undefined
                        }
                      >
                        <ItemIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </React.Fragment>
            ))
          : children.map((item) => {
              const ItemIcon = item.icon;
              return (
                <DropdownMenuItem key={item.segment} asChild>
                  <Link
                    to={item.href}
                    className="flex items-center gap-2"
                    aria-current={segment === item.segment ? "page" : undefined}
                  >
                    <ItemIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const breadcrumbCollapseButton =
    !isMobileLayout && canCollapse ? (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={toggleCollapsed}
              aria-label={
                collapsed
                  ? "Expand sidebar (icons only)"
                  : "Collapse sidebar to icons"
              }
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {collapsed ? "Expand sidebar" : "Collapse to icons"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className={cn(
          "flex",
          variant === "vertical" && !isMobileLayout
            ? "flex-1 min-h-0 gap-4"
            : "flex-col",
        )}
      >
        {!isMobileLayout && navContent}
        <div className="flex-1 min-h-0 overflow-auto">{contentArea}</div>
      </div>
    </div>
  );
}

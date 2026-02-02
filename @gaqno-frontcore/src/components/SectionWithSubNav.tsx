import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export interface SectionWithSubNavChild {
  segment: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SectionWithSubNavProps {
  basePath: string;
  defaultSegment: string;
  children: SectionWithSubNavChild[];
  segmentToComponent: Record<string, React.ComponentType>;
  title: string;
  variant: "vertical" | "horizontal";
  breadcrumbRoot: { label: string; href: string };
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
}: SectionWithSubNavProps) {
  const { pathname } = useLocation();
  const rawSegment = getSegmentFromPath(pathname, basePath);
  const segment =
    rawSegment && segmentToComponent[rawSegment] ? rawSegment : defaultSegment;
  const ChildComponent = segmentToComponent[segment];

  const navClassName =
    variant === "vertical"
      ? "flex flex-col gap-1 border-r pr-4 mr-4 min-w-[180px] shrink-0"
      : "flex flex-wrap gap-1 border-b pb-2 mb-4";

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
        <nav className={navClassName} aria-label={`${title} sub-navigation`}>
          {children.map(({ segment: s, label, href, icon: Icon }) => (
            <Link
              key={s}
              to={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                segment === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={segment === s ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 min-h-0 overflow-auto">
          {ChildComponent ? <ChildComponent /> : null}
        </div>
      </div>
    </div>
  );
}

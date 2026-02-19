import React from "react";
import { AppSidebar } from "../app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "../../ui/sidebar";
import { useDashboardLayout } from "./hooks/useDashboardLayout";
import { IDashboardLayoutProps } from "./types";
import { useWhiteLabel } from "../../../hooks/useWhiteLabel";
import { useIsMobile } from "../../../hooks";
import { PanelLeft } from "lucide-react";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";

const MobileTopBar: React.FC = () => {
  const { config: whiteLabel } = useWhiteLabel();
  const companyName =
    whiteLabel?.companyName || whiteLabel?.appName || "Dashboard";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
      <SidebarTrigger aria-label="Open menu" className="h-9 w-9" />
      {whiteLabel?.logoUrl ? (
        <img
          src={whiteLabel.logoUrl}
          alt={companyName}
          width={120}
          height={32}
          className="h-8 w-auto max-w-[65vw] object-contain"
          onError={(event) => {
            const target = event.currentTarget;
            target.style.display = "none";
          }}
        />
      ) : null}
      <span className="min-w-0 truncate text-sm font-semibold text-foreground">
        {companyName}
      </span>
    </header>
  );
};

export const DashboardLayout: React.FC<IDashboardLayoutProps> = ({
  children,
  menuItems,
}) => {
  const { open, defaultOpen, onOpenChange } = useDashboardLayout();

  return (
    <SidebarProvider
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <div className="h-screen w-full flex overflow-hidden">
        <AppSidebar customMenuItems={menuItems} />
        <SidebarInset className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <MobileTopBar />
          <main className="flex-1 min-h-0 overflow-auto bg-background">
            <div className="min-h-full md:ml-[3em]">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

DashboardLayout.displayName = "DashboardLayout";

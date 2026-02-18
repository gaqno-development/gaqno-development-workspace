import React from 'react'
import { AppSidebar } from '../app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '../../ui/sidebar'
import { useDashboardLayout } from './hooks/useDashboardLayout'
import { IDashboardLayoutProps } from './types'
import { useWhiteLabel } from '../../../hooks/useWhiteLabel'

const SidebarInsetWithMargin: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarInset
      className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden md:transition-[margin-left] md:duration-200 md:ease-linear ${isCollapsed ? 'md:ml-[3rem]' : 'md:ml-[16rem]'
        } ${className || ''}`}
    >
      {children}
    </SidebarInset>
  )
}

const MobileTopBar: React.FC = () => {
  const { config: whiteLabel } = useWhiteLabel()
  const companyName = whiteLabel?.companyName || whiteLabel?.appName || 'Dashboard'

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
            const target = event.currentTarget
            target.style.display = 'none'
          }}
        />
      ) : null}
      <span className="min-w-0 truncate text-sm font-semibold text-foreground">
        {companyName}
      </span>
    </header>
  )
}

export const DashboardLayout: React.FC<IDashboardLayoutProps> = ({ children, menuItems }) => {
  const { open, defaultOpen, onOpenChange } = useDashboardLayout()

  return (
    <SidebarProvider open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <div className="h-screen w-full flex overflow-hidden">
        <AppSidebar customMenuItems={menuItems} />
        <SidebarInsetWithMargin>
          <MobileTopBar />
          <main className="flex-1 min-h-0 overflow-auto">
            {children}
          </main>
        </SidebarInsetWithMargin>
      </div>
    </SidebarProvider>
  )
}

DashboardLayout.displayName = 'DashboardLayout'


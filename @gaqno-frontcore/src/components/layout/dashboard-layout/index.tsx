import React from 'react'
import { AppSidebar } from '../app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '../../ui/sidebar'
import { useDashboardLayout } from './hooks/useDashboardLayout'
import { IDashboardLayoutProps } from './types'
import { useWhiteLabel } from '../../../hooks/useWhiteLabel'
import { useIsMobile } from '../../../hooks'
import { PanelLeft } from 'lucide-react'
import { Button } from '../../ui/button'
import { cn } from '../../../lib/utils'

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

const MobileShellMenuFAB: React.FC = () => {
  const isMobile = useIsMobile()
  const { toggleSidebar } = useSidebar()

  if (!isMobile) return null

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        'fixed bottom-6 left-4 z-30 h-12 w-12 rounded-full shadow-lg md:hidden',
        'bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
      onClick={toggleSidebar}
      aria-label="Open modules menu"
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
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
          <MobileShellMenuFAB />
        </SidebarInsetWithMargin>
      </div>
    </SidebarProvider>
  )
}

DashboardLayout.displayName = 'DashboardLayout'


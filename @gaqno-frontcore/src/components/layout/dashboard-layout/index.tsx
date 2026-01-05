import React from 'react'
import { Header } from '../header'
import { AppSidebar } from '../app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '../../ui/sidebar'
import { useDashboardLayout } from './hooks/useDashboardLayout'
import { IDashboardLayoutProps } from './types'

const SidebarInsetWithMargin: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  
  return (
    <SidebarInset 
      className={`flex-1 flex flex-col min-w-0 overflow-hidden md:transition-[margin-left] md:duration-200 md:ease-linear ${
        isCollapsed ? 'md:ml-[3rem]' : 'md:ml-[16rem]'
      } ${className || ''}`}
    >
      {children}
    </SidebarInset>
  )
}

export const DashboardLayout: React.FC<IDashboardLayoutProps> = ({ children, menuItems }) => {
  const { open, defaultOpen, onOpenChange } = useDashboardLayout()

  return (
    <SidebarProvider open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <div className="min-h-screen w-full flex">
        <AppSidebar customMenuItems={menuItems} />
        <SidebarInsetWithMargin>
          <Header userProfile={null} />
          <main className="flex-1 p-4 sm:p-6 overflow-auto min-h-0">
            <div className="mx-auto w-full">
              {children}
            </div>
          </main>
        </SidebarInsetWithMargin>
      </div>
    </SidebarProvider>
  )
}

DashboardLayout.displayName = 'DashboardLayout'


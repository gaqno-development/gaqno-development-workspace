import { ReactNode } from 'react'
import { ISidebarItem } from '../app-sidebar/types'

export interface IDashboardLayoutProps {
  children: ReactNode
  menuItems?: ISidebarItem[]
}


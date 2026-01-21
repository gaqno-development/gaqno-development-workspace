import { UserRole, FeatureModule, FeaturePermissionLevel } from '../../../types/user'
import { LucideIcon } from 'lucide-react'

export interface ISidebarItem {
  label: string
  href?: string
  icon: LucideIcon
  iconBackgroundColor?: string
  notificationCount?: number
  roles?: UserRole[]
  featureRequired?: FeatureModule
  minPermissionLevel?: FeaturePermissionLevel
  children?: ISidebarItem[]
  isCollapsible?: boolean
}

export interface ISidebarProps {
  isOpen: boolean
}


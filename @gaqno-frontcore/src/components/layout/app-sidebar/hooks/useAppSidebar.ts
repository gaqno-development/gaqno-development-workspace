import { useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Settings, 
  FolderKanban, 
  Building, 
  Wallet,
  TrendingUp,
  Wrench,
  BookOpen,
} from 'lucide-react'
import { FeatureModule, FeaturePermissionLevel } from '@gaqno-development/frontcore/types/user'
import { ISidebarItem } from '../types'
import { usePermissions } from '@gaqno-development/frontcore/hooks/usePermissions'
import { useTenant } from '@gaqno-development/frontcore/contexts'
import { useUserPermissions } from '@gaqno-development/frontcore/hooks/useUserPermissions'

export const useAppSidebar = () => {
  const location = useLocation()
  const pathname = location.pathname
  const { isRootAdmin, hasAccess, hasRole } = usePermissions()
  const { tenantId } = useTenant()
  const { hasPlatformAll, hasPermission } = useUserPermissions()

  // Fallback: if profile is null but user has platform.all, treat as root admin
  const effectiveIsRootAdmin = isRootAdmin || hasPlatformAll

  const adminGroup: ISidebarItem | null = effectiveIsRootAdmin || hasPermission('admin.access')
    ? {
        label: 'Administração',
        icon: Settings,
        isCollapsible: true,
        children: [
          {
            label: 'Usuários',
            href: '/dashboard/users',
            icon: Users,
          },
          {
            label: 'Tenants',
            href: '/admin/tenants',
            icon: Building,
          },
          {
            label: 'Gerenciamento',
            href: '/dashboard/manager',
            icon: FolderKanban,
          },
        ],
      }
    : null

  const financeGroup: ISidebarItem | null = hasAccess(FeatureModule.FINANCE, tenantId) || hasPermission('finance.access')
    ? {
        label: 'Finanças',
        icon: Wallet,
        isCollapsible: true,
        children: [
          {
            label: 'Dashboard',
            href: '/finance',
            icon: Home,
          },
          {
            label: 'Investimentos',
            href: '/finance?view=investments',
            icon: TrendingUp,
          },
          {
            label: 'Configurações',
            href: '/finance?view=settings',
            icon: Settings,
          },
        ].filter(item => {
          if (item.href === '/finance?view=settings') {
            return hasRole(FeatureModule.FINANCE, FeaturePermissionLevel.ADMIN, tenantId)
          }
          return true
        }),
      }
    : null

  const crmGroup: ISidebarItem | null = hasAccess(FeatureModule.CRM, tenantId) || hasPermission('crm.access')
    ? {
        label: 'CRM',
        icon: Users,
        isCollapsible: true,
        children: [
          {
            label: 'Dashboard',
            href: '/dashboard/crm',
            icon: Home,
          },
          {
            label: 'Contacts',
            href: '/dashboard/crm/contacts',
            icon: Users,
          },
          {
            label: 'Settings',
            href: '/dashboard/crm/settings',
            icon: Settings,
          },
        ].filter(item => {
          if (item.href === '/dashboard/crm/settings') {
            return hasRole(FeatureModule.CRM, FeaturePermissionLevel.ADMIN, tenantId)
          }
          return true
        }),
      }
    : null

  const erpGroup: ISidebarItem | null = hasAccess(FeatureModule.ERP, tenantId) || hasPermission('erp.access')
    ? {
        label: 'ERP',
        icon: FolderKanban,
        isCollapsible: true,
        children: [
          {
            label: 'Dashboard',
            href: '/dashboard/erp',
            icon: Home,
          },
          {
            label: 'Settings',
            href: '/dashboard/erp/settings',
            icon: Settings,
          },
        ].filter(item => {
          if (item.href === '/dashboard/erp/settings') {
            return hasRole(FeatureModule.ERP, FeaturePermissionLevel.ADMIN, tenantId)
          }
          return true
        }),
      }
    : null

  const pdvGroup: ISidebarItem | null = hasAccess(FeatureModule.PDV, tenantId) || hasPermission('pdv.access')
    ? {
        label: 'PDV',
        icon: Wrench,
        isCollapsible: true,
        children: [
          {
            label: 'Dashboard',
            href: '/dashboard/pdv',
            icon: Home,
          },
          {
            label: 'Settings',
            href: '/dashboard/pdv/settings',
            icon: Settings,
          },
        ].filter(item => {
          if (item.href === '/dashboard/pdv/settings') {
            return hasRole(FeatureModule.PDV, FeaturePermissionLevel.ADMIN, tenantId)
          }
          return true
        }),
      }
    : null

  const bookCreatorGroup: ISidebarItem | null = hasAccess(FeatureModule.BOOK_CREATOR, tenantId) || hasPermission('ai.access')
    ? {
        label: 'Criador de Livros',
        icon: BookOpen,
        isCollapsible: true,
        children: [
          {
            label: 'Meus Livros',
            href: '/dashboard/books',
            icon: BookOpen,
          },
        ],
      }
    : null

  const menuItems: ISidebarItem[] = [
    adminGroup,
    financeGroup,
    crmGroup,
    erpGroup,
    pdvGroup,
    bookCreatorGroup,
  ].filter((item): item is ISidebarItem => item !== null)

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return {
    menuItems,
    isActive,
  }
}

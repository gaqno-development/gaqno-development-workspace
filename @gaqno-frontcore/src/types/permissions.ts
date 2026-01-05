import { FeatureModule, FeaturePermissionLevel, IUserProfile, IUserFeaturePermission } from './user'

export type PermissionKey = `${FeatureModule}:${FeaturePermissionLevel}`

export interface IPermissionCheckParams {
  user: IUserProfile | null | undefined
  feature: FeatureModule
  minRole?: FeaturePermissionLevel
  tenantId?: string | null
}

export interface IFeatureAccessResult {
  hasAccess: boolean
  roles: FeaturePermissionLevel[]
  isRootAdmin: boolean
}

export const PERMISSION_HIERARCHY: Record<FeaturePermissionLevel, number> = {
  [FeaturePermissionLevel.ADMIN]: 3,
  [FeaturePermissionLevel.MANAGER]: 2,
  [FeaturePermissionLevel.USER]: 1,
  [FeaturePermissionLevel.ACCESS]: 0,
}

export const hasMinimumRole = (
  userRole: FeaturePermissionLevel,
  requiredRole: FeaturePermissionLevel
): boolean => {
  return PERMISSION_HIERARCHY[userRole] >= PERMISSION_HIERARCHY[requiredRole]
}

export const getHighestRole = (roles: FeaturePermissionLevel[]): FeaturePermissionLevel | null => {
  if (!roles || roles.length === 0) return null
  
  return roles.reduce((highest, current) => {
    return PERMISSION_HIERARCHY[current] > PERMISSION_HIERARCHY[highest] ? current : highest
  })
}

export interface IFeatureMenuConfig {
  feature: FeatureModule
  label: string
  icon: string
  minRole: FeaturePermissionLevel
  routes: IFeatureRouteConfig[]
}

export interface IFeatureRouteConfig {
  label: string
  href: string
  icon?: string
  minRole?: FeaturePermissionLevel
}

export const FEATURE_CONFIGS: Partial<Record<FeatureModule, IFeatureMenuConfig>> = {
  [FeatureModule.FINANCE]: {
    feature: FeatureModule.FINANCE,
    label: 'Finanças',
    icon: 'Wallet',
    minRole: FeaturePermissionLevel.ACCESS,
    routes: [
      {
        label: 'Dashboard',
        href: '/finance',
        minRole: FeaturePermissionLevel.ACCESS,
      },
      {
        label: 'Investimentos',
        href: '/finance?view=investments',
        minRole: FeaturePermissionLevel.USER,
      },
      {
        label: 'Configurações',
        href: '/finance?view=settings',
        minRole: FeaturePermissionLevel.ADMIN,
      },
    ],
  },
  [FeatureModule.CRM]: {
    feature: FeatureModule.CRM,
    label: 'CRM',
    icon: 'Users',
    minRole: FeaturePermissionLevel.USER,
    routes: [
      {
        label: 'Dashboard',
        href: '/dashboard/crm',
        minRole: FeaturePermissionLevel.USER,
      },
      {
        label: 'Contacts',
        href: '/dashboard/crm/contacts',
        minRole: FeaturePermissionLevel.USER,
      },
      {
        label: 'Settings',
        href: '/dashboard/crm/settings',
        minRole: FeaturePermissionLevel.ADMIN,
      },
    ],
  },
  [FeatureModule.ERP]: {
    feature: FeatureModule.ERP,
    label: 'ERP',
    icon: 'Rocket',
    minRole: FeaturePermissionLevel.USER,
    routes: [
      {
        label: 'Dashboard',
        href: '/dashboard/erp',
        minRole: FeaturePermissionLevel.USER,
      },
      {
        label: 'Settings',
        href: '/dashboard/erp/settings',
        minRole: FeaturePermissionLevel.ADMIN,
      },
    ],
  },
  [FeatureModule.PDV]: {
    feature: FeatureModule.PDV,
    label: 'PDV',
    icon: 'ShoppingCart',
    minRole: FeaturePermissionLevel.USER,
    routes: [
      {
        label: 'Dashboard',
        href: '/dashboard/pdv',
        minRole: FeaturePermissionLevel.USER,
      },
      {
        label: 'Settings',
        href: '/dashboard/pdv/settings',
        minRole: FeaturePermissionLevel.ADMIN,
      },
    ],
  },
  [FeatureModule.BOOK_CREATOR]: {
    feature: FeatureModule.BOOK_CREATOR,
    label: 'Criador de Livros',
    icon: 'BookOpen',
    minRole: FeaturePermissionLevel.USER,
    routes: [
      {
        label: 'Meus Livros',
        href: '/dashboard/books',
        minRole: FeaturePermissionLevel.USER,
      },
    ],
  },
}

export interface IAdminMenuConfig {
  label: string
  icon: string
  routes: IAdminRouteConfig[]
}

export interface IAdminRouteConfig {
  label: string
  href: string
  icon?: string
}

export const ADMIN_CONFIG: IAdminMenuConfig = {
  label: 'Administração',
  icon: 'Settings',
  routes: [
    {
      label: 'Usuários',
      href: '/dashboard/users',
      icon: 'Users',
    },
    {
      label: 'Tenants',
      href: '/admin/tenants',
      icon: 'Building',
    },
    {
      label: 'Gerenciamento',
      href: '/dashboard/manager',
      icon: 'FolderKanban',
    },
  ],
}


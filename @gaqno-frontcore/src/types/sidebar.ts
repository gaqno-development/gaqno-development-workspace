import type { UserRole, FeatureModule, FeaturePermissionLevel } from './user';
import type { LucideIcon } from 'lucide-react';

export interface ISidebarItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  iconBackgroundColor?: string;
  notificationCount?: number;
  roles?: UserRole[];
  featureRequired?: FeatureModule;
  minPermissionLevel?: FeaturePermissionLevel;
  children?: ISidebarItem[];
  isCollapsible?: boolean;
}

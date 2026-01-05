import { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getIconComponent } from '../utils/icon-mapper';
import { ssoClient } from '../utils/api';
import { ISidebarItem } from '../components/layout/app-sidebar/types';

interface MenuItemFromBackend {
  id: string;
  label: string;
  href: string;
  icon: string;
  iconBackgroundColor?: string;
  notificationCount?: number;
  requiredPermissions: string[];
  isCollapsible?: boolean;
  children?: MenuItemFromBackend[];
}

interface MenuResponse {
  items: MenuItemFromBackend[];
  userPermissions?: string[];
}

const MENU_STORAGE_KEY = 'gaqno_menu_items';
const MENU_STORAGE_MAX_AGE = 30 * 60 * 1000;

function getStoredMenu(): MenuItemFromBackend[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(MENU_STORAGE_KEY);
    if (!stored) return null;

    const { items, timestamp } = JSON.parse(stored);
    const now = Date.now();

    if (now - timestamp > MENU_STORAGE_MAX_AGE) {
      localStorage.removeItem(MENU_STORAGE_KEY);
      return null;
    }

    return items;
  } catch {
    return null;
  }
}

function setStoredMenu(items: MenuItemFromBackend[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      items,
      timestamp: Date.now(),
    };
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

function mapToSidebarItems(menuData: MenuItemFromBackend[]): ISidebarItem[] {
  const mapToSidebarItem = (item: MenuItemFromBackend): ISidebarItem => ({
    label: item.label,
    href: item.href,
    icon: getIconComponent(item.icon),
    iconBackgroundColor: item.iconBackgroundColor,
    notificationCount: item.notificationCount,
    isCollapsible: item.isCollapsible,
    children: item.children?.map(mapToSidebarItem),
  });

  return menuData.map(mapToSidebarItem);
}

export function useFilteredMenu(): ISidebarItem[] {
  const [cachedMenu] = useState<MenuItemFromBackend[] | null>(() => getStoredMenu());
  const [mappedCachedMenu] = useState<ISidebarItem[]>(() => {
    if (cachedMenu && cachedMenu.length > 0) {
      return mapToSidebarItems(cachedMenu);
    }
    return [];
  });

  const { data, error } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data: response } = await ssoClient.get<MenuResponse>('/menu');
      return response.items as MenuItemFromBackend[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: cachedMenu || undefined,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
    enabled: true,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      setStoredMenu(data);
    }
  }, [data]);

  const mappedItems = useMemo(() => {
    if (data && data.length > 0) {
      return mapToSidebarItems(data);
    }
    return mappedCachedMenu;
  }, [data, mappedCachedMenu]);

  if (error && mappedCachedMenu.length === 0) {
    return [];
  }

  return mappedItems;
}


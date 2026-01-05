import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '../../ui/sidebar'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../../ui/collapsible'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { useLocation } from 'react-router-dom'
import { useFilteredMenu } from '@gaqno-dev/frontcore/hooks/useFilteredMenu'
import { ISidebarItem } from './types'
import { useWhiteLabel } from '@gaqno-dev/frontcore'

interface AppSidebarProps {
    customMenuItems?: ISidebarItem[]
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ customMenuItems }) => {
    const location = useLocation()
    const pathname = location.pathname
    const searchParams = location.search
    const backendMenuItems = useFilteredMenu()
    const { config: whiteLabel } = useWhiteLabel()
    const { state } = useSidebar()
    const isCollapsed = state === 'collapsed'
    
    // Use only backend menu (server-side filtered by permissions)
    // Custom menu items can override if provided
    const menuItems = customMenuItems || backendMenuItems

    const isActive = (href: string) => {
        const [hrefPath, hrefSearch] = href.split('?')
        const currentPath = pathname
        const currentSearch = searchParams

        if (hrefPath !== currentPath) {
            return false
        }

        if (!hrefSearch) {
            return !currentSearch || currentSearch === ''
        }

        const hrefParams = new URLSearchParams(hrefSearch)
        const currentParams = new URLSearchParams(currentSearch)

        for (const [key, value] of hrefParams.entries()) {
            if (currentParams.get(key) !== value) {
                return false
            }
        }

        return true
    }

    const CollapsedMenuItemWithDropdown: React.FC<{ item: ISidebarItem }> = ({ item }) => {
        const [open, setOpen] = useState(false)
        const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
        const Icon = item.icon

        const handleMouseEnter = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            setOpen(true)
        }

        const handleMouseLeave = () => {
            timeoutRef.current = setTimeout(() => {
                setOpen(false)
            }, 150)
        }

        React.useEffect(() => {
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
            }
        }, [])

        return (
            <SidebarMenuItem key={item.label}>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <div
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className="w-full"
                        >
                            <SidebarMenuButton tooltip={open ? undefined : item.label}>
                                <div 
                                    className="flex items-center justify-center rounded-md p-1.5"
                                    style={{ backgroundColor: item.iconBackgroundColor || 'transparent' }}
                                >
                                    <Icon />
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <span>{item.label}</span>
                                        {item.notificationCount !== undefined && item.notificationCount > 0 && (
                                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium ml-auto">
                                                {item.notificationCount > 99 ? '99+' : item.notificationCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </SidebarMenuButton>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="right"
                        align="start"
                        className="w-56"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {item.children?.map((child) => {
                            const ChildIcon = child.icon
                            const displayChildren = child.children && child.children.length > 0 
                                ? child.children 
                                : [];
                            
                            return (
                                <React.Fragment key={child.href || child.label}>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to={child.href || '#'}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            {ChildIcon && <ChildIcon className="h-4 w-4" />}
                                            <span>{child.label}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    {/* Render second level children */}
                                    {displayChildren.map((grandChild) => {
                                        const GrandChildIcon = grandChild.icon
                                        return (
                                            <DropdownMenuItem key={grandChild.href || grandChild.label} asChild className="pl-8">
                                                <Link
                                                    to={grandChild.href || '#'}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    {GrandChildIcon && <GrandChildIcon className="h-3 w-3" />}
                                                    <span className="text-sm">{grandChild.label}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )
                                    })}
                                </React.Fragment>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        )
    }

    const renderMenuItem = (item: ISidebarItem) => {
        const Icon = item.icon

        if (item.isCollapsible && item.children) {
            if (isCollapsed) {
                return <CollapsedMenuItemWithDropdown item={item} />
            }

            return (
                <Collapsible key={item.label} className="group/collapsible">
                    <SidebarGroup className="p-0">
                        <SidebarGroupLabel asChild className="px-2">
                            <CollapsibleTrigger
                                className="flex w-full items-center gap-2 min-h-[44px] touch-manipulation transition-all duration-150 ease-out"
                                aria-label={`${item.label} menu`}
                            >
                                <div 
                                    className="flex items-center justify-center rounded-md p-1.5 flex-shrink-0"
                                    style={{ backgroundColor: item.iconBackgroundColor || 'transparent' }}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.notificationCount !== undefined && item.notificationCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
                                        {item.notificationCount > 99 ? '99+' : item.notificationCount}
                                    </span>
                                )}
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 ease-out group-data-[state=open]/collapsible:rotate-180 flex-shrink-0" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent className="px-2">
                                <SidebarMenu>
                                    {item.children.map((child) => {
                                        const ChildIcon = child.icon
                                        // Render only 2 levels - flatten nested children
                                        const displayChildren = child.children && child.children.length > 0 
                                            ? child.children 
                                            : [];
                                        
                                        return (
                                            <React.Fragment key={child.href || child.label}>
                                                <SidebarMenuItem>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={child.href ? isActive(child.href) : false}
                                                        className="min-h-[44px] touch-manipulation"
                                                    >
                                                        <Link
                                                            to={child.href || '#'}
                                                            className="flex items-center gap-2 flex-1"
                                                            aria-label={child.label}
                                                        >
                                                            {ChildIcon && (
                                                                <div 
                                                                    className="flex items-center justify-center rounded-md p-1.5"
                                                                    style={{ backgroundColor: child.iconBackgroundColor || 'transparent' }}
                                                                >
                                                                    <ChildIcon className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                            <span className="flex-1">{child.label}</span>
                                                            {child.notificationCount !== undefined && child.notificationCount > 0 && (
                                                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                                                    {child.notificationCount > 99 ? '99+' : child.notificationCount}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                                {/* Render second level children as flat items */}
                                                {displayChildren.map((grandChild) => {
                                                    const GrandChildIcon = grandChild.icon
                                                    return (
                                                        <SidebarMenuItem key={grandChild.href || grandChild.label} className="ml-6">
                                                            <SidebarMenuButton
                                                                asChild
                                                                isActive={grandChild.href ? isActive(grandChild.href) : false}
                                                                className="min-h-[44px] touch-manipulation"
                                                            >
                                                                <Link
                                                                    to={grandChild.href || '#'}
                                                                    className="flex items-center gap-2 flex-1"
                                                                    aria-label={grandChild.label}
                                                                >
                                                                    {GrandChildIcon && (
                                                                        <div 
                                                                            className="flex items-center justify-center rounded-md p-1.5"
                                                                            style={{ backgroundColor: grandChild.iconBackgroundColor || 'transparent' }}
                                                                        >
                                                                            <GrandChildIcon className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                    <span className="flex-1 text-sm">{grandChild.label}</span>
                                                                    {grandChild.notificationCount !== undefined && grandChild.notificationCount > 0 && (
                                                                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                                                            {grandChild.notificationCount > 99 ? '99+' : grandChild.notificationCount}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    )
                                                })}
                                            </React.Fragment>
                                        )
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            )
        }

        const itemIsActive = item.href ? isActive(item.href) : false
        
        return (
            <SidebarMenuItem key={item.href || item.label} isActive={itemIsActive}>
                <SidebarMenuButton
                    asChild
                    isActive={itemIsActive}
                    tooltip={item.label}
                    className="min-h-[44px] touch-manipulation"
                >
                    <Link
                        to={item.href || '#'}
                        className="flex items-center gap-2 flex-1"
                        aria-label={item.label}
                    >
                        <div 
                            className="flex items-center justify-center rounded-md p-1.5"
                            style={{ backgroundColor: item.iconBackgroundColor || 'transparent' }}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {item.notificationCount !== undefined && item.notificationCount > 0 && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                {item.notificationCount > 99 ? '99+' : item.notificationCount}
                            </span>
                        )}
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-center p-4">
                        {whiteLabel?.logoUrl ? (
                            <img 
                                src={whiteLabel.logoUrl} 
                                alt={whiteLabel?.companyName || 'Logo'} 
                                width={120} 
                                height={40} 
                                className="object-contain h-10 w-auto"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    const parent = target.parentElement
                                    if (parent) {
                                        parent.innerHTML = `<div class="text-lg font-bold">${whiteLabel?.companyName || whiteLabel?.appName || 'Logo'}</div>`
                                    }
                                }}
                            />
                        ) : (
                            <div className="text-lg font-bold text-center">
                                {whiteLabel?.companyName || whiteLabel?.appName || 'Logo'}
                            </div>
                        )}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item, index) => (
                                <React.Fragment key={item.label || item.href || `menu-item-${index}`}>
                                    {renderMenuItem(item)}
                                </React.Fragment>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

AppSidebar.displayName = 'AppSidebar'

import React from 'react'
import { LogOut, User, Settings, Bell } from 'lucide-react'
import { Button } from '../../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Separator } from '../../ui/separator'
import { SidebarTrigger, useSidebar } from '../../ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { useHeader } from './hooks/useHeader'
import { IHeaderProps } from './types'
import { useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './components/ThemeToggle'

export const Header: React.FC<IHeaderProps> = () => {
  const { profile, user, handleSignOut, whiteLabelConfig } = useHeader()
  const location = useLocation()
  const pathname = location.pathname
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const navigate = useNavigate()

  const isTenantDetailsPage = pathname.includes('/admin/tenants/') && pathname.split('/').length > 4

  const handleProfileClick = () => {
    navigate('/dashboard/profile')
  }

  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b bg-card flex items-center px-6 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-4 w-full">
        <SidebarTrigger />

        <div className="flex items-center gap-2">
          {whiteLabelConfig && 'logoUrl' in whiteLabelConfig ? (
            <img
              src={whiteLabelConfig.logoUrl}
              alt={whiteLabelConfig.companyName || whiteLabelConfig.appName || 'Logo'}
              width={120}
              height={40}
              className="whitelabel-logo h-8 w-auto object-contain"
            />
          ) : (
            <h1 className="text-xl font-bold">
              {whiteLabelConfig && 'appName' in whiteLabelConfig ? whiteLabelConfig.appName : 'Dashboard'}
            </h1>
          )}
        </div>

        <div className="flex-1" />

        {/* Show tenant branding info when on tenant details page */}
        {isTenantDetailsPage && whiteLabelConfig && 'logoUrl' in whiteLabelConfig && (
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
            {whiteLabelConfig.logoUrl ? (
              <img
                src={whiteLabelConfig.logoUrl}
                alt={whiteLabelConfig.companyName || whiteLabelConfig.appName || 'Tenant Logo'}
                className="w-8 h-8 object-contain rounded"
              />
            ) : (
              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-sm font-bold">
                {whiteLabelConfig.companyName?.charAt(0).toUpperCase() || whiteLabelConfig.appName?.charAt(0).toUpperCase() || 'T'}
              </div>
            )}
            <div className="text-sm">
              <div className="font-medium">{whiteLabelConfig.companyName}</div>
              <div className="text-muted-foreground text-xs">{whiteLabelConfig.appName}</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {(profile || user) && (
            <>
              <Separator orientation="vertical" className="h-8" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.name || user?.email} />
                  <AvatarFallback>
                        {(profile?.name || user?.email)?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.name || user?.email}</p>
                      {user?.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                      {profile?.role && (
                        <p className="text-xs leading-none text-muted-foreground capitalize mt-1">
                    {profile.role}
                  </p>
                      )}
                </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Ver Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notificações</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

Header.displayName = 'Header'


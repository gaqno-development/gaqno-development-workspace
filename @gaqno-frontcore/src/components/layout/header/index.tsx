import React from 'react'
import { SidebarTrigger } from '../../ui/sidebar'
import { useHeader } from './hooks/useHeader'
import { IHeaderProps } from './types'
import { useLocation } from 'react-router-dom'

export const Header: React.FC<IHeaderProps> = () => {
  const { whiteLabelConfig } = useHeader()
  const location = useLocation()
  const pathname = location.pathname

  const isTenantDetailsPage = pathname.includes('/admin/tenants/') && pathname.split('/').length > 4

  return (
    <header className="absolute top-0 z-40 w-full h-14 border-b bg-card flex items-center px-6 shadow-sm flex-shrink-0">
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
      </div>
    </header>
  )
}

Header.displayName = 'Header'


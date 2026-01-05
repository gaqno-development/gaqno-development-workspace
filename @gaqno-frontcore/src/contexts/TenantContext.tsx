
import React, { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { UserRole } from '../types/user'

interface ITenantContext {
  tenantId: string | null
  isAdmin: boolean
  isLoading: boolean
}

const TenantContext = createContext<ITenantContext | undefined>(undefined)

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth()

  const value = useMemo(() => {
    const tenantId = profile?.tenant_id ?? null
    const isAdmin = profile?.role === UserRole.ADMIN

    return {
      tenantId,
      isAdmin,
      isLoading: loading,
    }
  }, [profile, loading])

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

TenantProvider.displayName = 'TenantProvider'


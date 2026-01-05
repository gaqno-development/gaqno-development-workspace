import React from 'react'
import { AuthProvider, QueryProvider, TenantProvider, ThemeProvider } from "@gaqno-dev/frontcore";


function SSOPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">SSO Module</h1>
      <p className="text-muted-foreground mt-2">SSO functionality coming soon...</p>
    </div>
  )
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>
          <SSOPage />
        </TenantProvider>
      </AuthProvider>
    </QueryProvider>
  )
}


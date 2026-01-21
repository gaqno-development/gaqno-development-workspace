

import { AppProvider as AppStateProvider } from '@gaqno-development/frontcore/hooks';
import { ReactNode } from 'react'

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AppStateProvider>
      {children}
    </AppStateProvider>
  )
}


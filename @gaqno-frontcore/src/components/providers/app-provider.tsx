

import { AppProvider as AppStateProvider } from '@gaqno-dev/frontcore/hooks';
import { ReactNode } from 'react'

export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AppStateProvider>
      {children}
    </AppStateProvider>
  )
}


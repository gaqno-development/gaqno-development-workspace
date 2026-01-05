import { createContext, useContext, ReactNode } from 'react'
import { useUIStore } from '../store/uiStore'

type UIStoreType = ReturnType<typeof useUIStore>

const AppContext = createContext<UIStoreType | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const uiStore = useUIStore()

  return (
    <AppContext.Provider value={uiStore}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppState = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }
  return context
}


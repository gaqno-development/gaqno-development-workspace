// INotification moved to store/uiStore.ts to avoid duplicate exports
// Import from '@gaqno-dev/frontcore/store' instead

export interface IAppState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
}

export type IAppAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }


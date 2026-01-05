/**
 * Clears all application storage including:
 * - localStorage items (all gaqno_ prefixed and specific keys)
 * - sessionStorage items
 * - Zustand persisted stores (auth-storage, etc.)
 * 
 * Note: React Query cache should be cleared separately via queryClient.clear()
 * Note: Cookies are cleared by the backend /sign-out endpoint
 */
export const clearAllStorage = () => {
  if (typeof window === 'undefined') return

  try {
    // First, clear all localStorage items that start with 'gaqno_'
    const keysToRemove: string[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('gaqno_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove localStorage key "${key}":`, error)
        }
      })
    } catch (error) {
      console.warn('Failed to clear gaqno_ prefixed localStorage items:', error)
    }

    // Clear specific known storage keys
    const storageKeys = [
      'gaqno_auth_state',
      'gaqno_menu_items',
      'auth-storage',
      // Zustand persist stores use these keys
    ]

    storageKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove localStorage key "${key}":`, error)
      }
    })

    // Clear all sessionStorage items
    try {
      sessionStorage.clear()
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error)
    }

    // Note: Zustand persist stores are automatically cleared when we remove the localStorage key
    // Note: React Query cache should be cleared separately via queryClient.clear()
    // Note: Cookies are cleared by the backend /sign-out endpoint
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}


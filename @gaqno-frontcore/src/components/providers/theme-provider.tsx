import { useEffect } from 'react'
import { useUIStore } from '@gaqno-dev/frontcore/store';

const THEME_STORAGE_KEY = 'theme'

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme

  if (effectiveTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const ThemeProvider = ({ children, attribute, defaultTheme, enableSystem, disableTransitionOnChange }: ThemeProviderProps) => {
  const theme = useUIStore((state) => state.theme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return <>{children}</>
}

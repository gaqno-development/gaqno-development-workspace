import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useFilteredMenu } from '../useFilteredMenu'
import * as api from '../../utils/api'

jest.mock('../../utils/api', () => ({
  ssoClient: {
    get: jest.fn(),
  },
}))

const mockSsoClient = api.ssoClient as jest.Mocked<typeof api.ssoClient>

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useFilteredMenu', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should return empty array when no cached data and API fails', async () => {
    mockSsoClient.get.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useFilteredMenu(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('should load menu from localStorage on mount', () => {
    const mockMenuItems = [
      {
        id: '1',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'Home',
        requiredPermissions: [],
      },
    ]

    const storedData = {
      items: mockMenuItems,
      timestamp: Date.now(),
    }
    localStorage.setItem('gaqno_menu_items', JSON.stringify(storedData))

    const { result } = renderHook(() => useFilteredMenu(), {
      wrapper: createWrapper(),
    })

    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current[0].label).toBe('Dashboard')
  })

  it('should fetch menu from API and save to localStorage', async () => {
    const mockMenuItems = [
      {
        id: '1',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'Home',
        requiredPermissions: [],
      },
    ]

    mockSsoClient.get.mockResolvedValue({
      data: { items: mockMenuItems },
    } as any)

    const { result } = renderHook(() => useFilteredMenu(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0)
    })

    const stored = localStorage.getItem('gaqno_menu_items')
    expect(stored).toBeTruthy()
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.items).toEqual(mockMenuItems)
    }
  })

  it('should use cached menu when API is loading', () => {
    const mockMenuItems = [
      {
        id: '1',
        label: 'Cached Menu',
        href: '/dashboard',
        icon: 'Home',
        requiredPermissions: [],
      },
    ]

    const storedData = {
      items: mockMenuItems,
      timestamp: Date.now(),
    }
    localStorage.setItem('gaqno_menu_items', JSON.stringify(storedData))

    mockSsoClient.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: { items: mockMenuItems },
            } as any)
          }, 1000)
        })
    )

    const { result } = renderHook(() => useFilteredMenu(), {
      wrapper: createWrapper(),
    })

    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current[0].label).toBe('Cached Menu')
  })

  it('should ignore expired cached menu', () => {
    const expiredTimestamp = Date.now() - 31 * 60 * 1000
    const storedData = {
      items: [{ id: '1', label: 'Expired', href: '/', icon: 'Home', requiredPermissions: [] }],
      timestamp: expiredTimestamp,
    }
    localStorage.setItem('gaqno_menu_items', JSON.stringify(storedData))

    const { result } = renderHook(() => useFilteredMenu(), {
      wrapper: createWrapper(),
    })

    const stored = localStorage.getItem('gaqno_menu_items')
    expect(stored).toBeNull()
    expect(result.current).toEqual([])
  })

  it('should map menu items correctly with icons', async () => {
    const mockMenuItems = [
      {
        id: '1',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'Home',
        requiredPermissions: [],
      },
      {
        id: '2',
        label: 'Settings',
        href: '/settings',
        icon: 'Settings',
        requiredPermissions: [],
        children: [
          {
            id: '2-1',
            label: 'Profile',
            href: '/settings/profile',
            icon: 'User',
            requiredPermissions: [],
          },
        ],
      },
    ]

    mockSsoClient.get.mockResolvedValue({
      data: { items: mockMenuItems },
    } as any)

    const { result } = renderHook(() => useFilteredMenu(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.length).toBe(2)
    })

    expect(result.current[0].label).toBe('Dashboard')
    expect(result.current[0].href).toBe('/dashboard')
    expect(result.current[0].icon).toBeDefined()
    expect(result.current[1].children).toBeDefined()
    expect(result.current[1].children?.length).toBe(1)
  })

  it('should use cached menu when API fails', async () => {
    const mockMenuItems = [
      {
        id: '1',
        label: 'Cached Menu',
        href: '/dashboard',
        icon: 'Home',
        requiredPermissions: [],
      },
    ]

    const storedData = {
      items: mockMenuItems,
      timestamp: Date.now(),
    }
    localStorage.setItem('gaqno_menu_items', JSON.stringify(storedData))

    mockSsoClient.get.mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useFilteredMenu(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.length).toBeGreaterThan(0)
      expect(result.current[0].label).toBe('Cached Menu')
    })
  })
})


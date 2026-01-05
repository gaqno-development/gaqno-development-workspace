import { create } from 'zustand'
import { IWhiteLabelConfig } from '../types/whitelabel'

interface IWhiteLabelState {
  config: IWhiteLabelConfig | null
  loading: boolean
  error: string | null
  setConfig: (config: IWhiteLabelConfig | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useWhiteLabelStore = create<IWhiteLabelState>((set) => ({
  config: null,
  loading: false,
  error: null,
  setConfig: (config) => set({ config }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))

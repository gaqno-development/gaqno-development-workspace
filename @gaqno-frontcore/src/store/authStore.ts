import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IUserProfile } from "../types/user";
import { SessionContext, SessionUser } from "../types/shared";

interface IAuthStore {
  user: SessionUser | null;
  session: SessionContext | null;
  profile: IUserProfile | null;
  loading: boolean;
  error: string | null;
  setUser: (user: SessionUser | null) => void;
  setSession: (session: SessionContext | null) => void;
  setProfile: (profile: IUserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      loading: false,
      error: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearAuth: () =>
        set({
          user: null,
          session: null,
          profile: null,
          error: null,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
      }),
    }
  )
);

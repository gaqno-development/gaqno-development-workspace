import { createContext, useContext, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SessionContext, SessionUser } from "../types/shared";
import { IUserProfile } from "../types/user";
import { useMe, useSignOut } from "../hooks/auth/useSsoAuth";
import { clearAllStorage } from "../utils/storage/clearAllStorage";
import { useAuthStore } from "../store/authStore";

interface IAuthContext {
  user: SessionUser | null;
  session: SessionContext | null;
  profile: IUserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: sessionContext, isLoading, refetch } = useMe({ enabled: true });
  const signOutMutation = useSignOut();
  const queryClient = useQueryClient();

  const user = sessionContext?.user ?? null;
  const session = sessionContext ?? null;
  const profile: IUserProfile | null = null;
  const loading = isLoading;

  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleSignOut = useCallback(async () => {
    try {
      // Call backend sign-out endpoint
      await signOutMutation.mutateAsync();
    } catch (error) {
      console.error("Error during sign-out:", error);
    } finally {
      // Clear all storage regardless of API call success
      clearAllStorage();
      clearAuth();
      // Invalidate and remove menu query to force refetch on next login
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.removeQueries({ queryKey: ["menu-items"] });
    }
  }, [signOutMutation, clearAuth, queryClient]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      signOut: handleSignOut,
    }),
    [user, session, profile, loading, handleSignOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

AuthProvider.displayName = "AuthProvider";

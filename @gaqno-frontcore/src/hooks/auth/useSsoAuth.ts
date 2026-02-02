import { useQueryClient } from "@tanstack/react-query";
import { SessionContext } from "../../types/shared/auth";
import { ssoAxiosClient } from "../../utils/api/sso-client";
import { useApiQuery } from "../useApiQuery";
import { useApiMutation } from "../useApiMutation";

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
};

export const useSignIn = () => {
  const queryClient = useQueryClient();

  return useApiMutation<SessionContext, SignInInput>(
    ssoAxiosClient,
    async (input) => {
      const { data } = await ssoAxiosClient.post<SessionContext>(
        "/sign-in",
        input
      );
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      },
    }
  );
};

export const useSignUp = () => {
  const queryClient = useQueryClient();

  return useApiMutation<SessionContext, SignUpInput>(
    ssoAxiosClient,
    async (input) => {
      const { data } = await ssoAxiosClient.post<SessionContext>(
        "/sign-up",
        input
      );
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      },
    }
  );
};

export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useApiMutation<{ success: boolean }, void>(
    ssoAxiosClient,
    async () => {
      const { data } = await ssoAxiosClient.post<{ success: boolean }>(
        "/sign-out"
      );
      return data;
    },
    {
      onSuccess: () => {
        queryClient.clear();
      },
    }
  );
};

export const useRefresh = () => {
  const queryClient = useQueryClient();

  return useApiMutation<SessionContext, void>(
    ssoAxiosClient,
    async () => {
      const { data } = await ssoAxiosClient.post<SessionContext>("/refresh");
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      },
    }
  );
};

const PUBLIC_PATHS = ["/login", "/register", "/auth"];

function isPublicPath(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname === "/") return false;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export const useMe = (options?: { enabled?: boolean }) => {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const skipOnPublic = isPublicPath(pathname);
  const enabled = options?.enabled !== false && !skipOnPublic;

  return useApiQuery<SessionContext>(
    ssoAxiosClient,
    ["auth", "me"],
    async () => {
      const { data } = await ssoAxiosClient.get<SessionContext>("/me");
      return data;
    },
    {
      retry: false,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      ...options,
      enabled,
    }
  );
};

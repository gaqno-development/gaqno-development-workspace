import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

type AxiosClientConfig = {
  baseURL?: string;
  timeout?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
  onRefreshToken?: () => Promise<void>;
  onRefreshError?: () => void;
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleRefreshToken = async (): Promise<void> => {
  try {
    const cookies = document.cookie.split(";");
    const hasRefreshToken = cookies.some(
      (c) =>
        c.trim().startsWith("refresh_token=") ||
        c.trim().startsWith("gaqno_refresh_token=")
    );

    if (!hasRefreshToken) {
      throw new Error("No refresh token available");
    }

    console.log("Token refresh needed but not implemented");
    throw new Error("Token refresh not available");
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

const handleRefreshError = () => {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  const isAuthPage =
    currentPath.includes("/login") ||
    currentPath.includes("/auth") ||
    currentPath.includes("/signin") ||
    currentPath.includes("/signup");
  const isPublicRoute =
    currentPath.startsWith("/rpg") ||
    currentPath === "/" ||
    currentPath.startsWith("/register");

  if (isAuthPage || isPublicRoute) {
    console.log("Already on auth/public page, skipping redirect");
    return;
  }

  console.error("Auth error, redirecting to login");
  window.location.href = "/login";
};

const AUTH_STORAGE_KEY = "gaqno_auth_state";

function getTokenFromCookies(): string | null {
  const cookies = document.cookie.split(";");
  const gaqnoSessionCookie = cookies.find((c) =>
    c.trim().startsWith("gaqno_session=")
  );
  if (gaqnoSessionCookie) return gaqnoSessionCookie.split("=")[1];
  const sessionCookie = cookies.find((c) => c.trim().startsWith("session="));
  if (sessionCookie) return sessionCookie.split("=")[1];
  const accessTokenCookie = cookies.find((c) =>
    c.trim().startsWith("access_token=")
  );
  if (accessTokenCookie) return accessTokenCookie.split("=")[1];
  return null;
}

function getTokenFromStorage(): string | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    const state = JSON.parse(stored) as {
      session?: { access_token?: string };
      timestamp?: number;
    };
    const maxAge = 24 * 60 * 60 * 1000;
    if (state.timestamp && Date.now() - state.timestamp > maxAge) return null;
    return state.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return getTokenFromCookies() ?? getTokenFromStorage();
};

const onRequest = (config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const onRequestError = (error: AxiosError) => Promise.reject(error);

const onResponse = <T = unknown>(response: AxiosResponse<T>) => response;

const onResponseError = async (
  error: AxiosError,
  onRefreshToken?: () => Promise<void>,
  onRefreshError?: () => void
) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

  if (error.response?.status === 401) {
    const requestUrl = originalRequest.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/") ||
      requestUrl.includes("/login") ||
      requestUrl.includes("/refresh") ||
      requestUrl.includes("/sign-in") ||
      requestUrl.includes("/sign-up") ||
      requestUrl.includes("/signin") ||
      requestUrl.includes("/signup");
    const isRpgEndpoint = requestUrl.includes("/v1/rpg/");
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    const isRpgRoute = currentPath.startsWith("/rpg");

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRpgEndpoint && isRpgRoute) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || !getAuthToken()) {
      if (onRefreshError) {
        onRefreshError();
      } else {
        handleRefreshError();
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return axios(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      if (onRefreshToken) {
        await onRefreshToken();
      } else {
        await handleRefreshToken();
      }
      processQueue(null, null);
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      if (onRefreshError) {
        onRefreshError();
      } else {
        handleRefreshError();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};

export const createAxiosClient = (
  config: AxiosClientConfig = {}
): AxiosInstance => {
  const {
    baseURL,
    timeout = 30000,
    withCredentials = true,
    headers = {},
    onRefreshToken,
    onRefreshError,
  } = config;

  const instance = axios.create({
    baseURL,
    timeout,
    withCredentials,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  instance.interceptors.request.use(onRequest, onRequestError);

  instance.interceptors.response.use(onResponse, async (error: AxiosError) =>
    onResponseError(error, onRefreshToken, onRefreshError)
  );

  return instance;
};

export const apiClient = createAxiosClient();

export const createServiceClient = (baseURL: string): AxiosInstance => {
  return createAxiosClient({ baseURL });
};

const getServiceBaseUrl = (serviceName: string): string => {
  if (typeof window === "undefined") {
    const defaultUrls: Record<string, string> = {
      sso: "http://localhost:4001",
      ai: "http://localhost:4002",
      finance: "http://localhost:4005",
      pdv: "http://localhost:4006",
      crm: "http://localhost:3004",
      erp: "http://localhost:3005",
      rpg: "http://localhost:4007",
    };
    return defaultUrls[serviceName] || "http://localhost:4001";
  }

  const getEnvVar = (key: string, defaultValue: string): string => {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      return (import.meta as any).env[key] || defaultValue;
    }
    return defaultValue;
  };

  const envUrls: Record<string, string> = {
    sso: getEnvVar("VITE_SERVICE_SSO_URL", "http://localhost:4001"),
    finance: getEnvVar("VITE_SERVICE_FINANCE_URL", "http://localhost:4005"),
    pdv: getEnvVar("VITE_SERVICE_PDV_URL", "http://localhost:4006"),
    crm: getEnvVar("VITE_SERVICE_CRM_URL", "http://localhost:3004"),
    erp: getEnvVar("VITE_SERVICE_ERP_URL", "http://localhost:3005"),
    ai: getEnvVar("VITE_SERVICE_AI_URL", "http://localhost:4002"),
    rpg: getEnvVar("VITE_SERVICE_RPG_URL", "http://localhost:4007"),
    omnichannel: getEnvVar(
      "VITE_SERVICE_OMNICHANNEL_URL",
      "http://localhost:4010"
    ),
  };
  return envUrls[serviceName] || "http://localhost:4001";
};

const createServiceClientWithPrefix = (serviceName: string): AxiosInstance => {
  const serviceUrl = getServiceBaseUrl(serviceName);
  const aiIntensiveServices = ["rpg", "ai"];
  const timeoutConfig = aiIntensiveServices.includes(serviceName)
    ? { timeout: 180000 }
    : {};
  const pathPrefix = serviceName === "sso" ? "/v1" : `/v1/${serviceName}`;
  const baseURL =
    serviceName === "sso"
      ? serviceUrl.includes("/sso")
        ? serviceUrl
        : `${serviceUrl}/sso`
      : serviceUrl;
  return createAxiosClient({
    baseURL: `${baseURL}${pathPrefix}`,
    ...timeoutConfig,
  });
};

export const coreAxiosClient = {
  sso: createServiceClientWithPrefix("sso"),
  finance: createServiceClientWithPrefix("finance"),
  pdv: createServiceClientWithPrefix("pdv"),
  crm: createServiceClientWithPrefix("crm"),
  erp: createServiceClientWithPrefix("erp"),
  ai: createServiceClientWithPrefix("ai"),
  rpg: createServiceClientWithPrefix("rpg"),
};

export const ssoClient = coreAxiosClient.sso;
export const financeClient = coreAxiosClient.finance;

export type Role =
  | "admin"
  | "user"
  | "viewer"
  | "management"
  | "front_seller"
  | string;

export type RequestUser = {
  sub?: string;
  tenantId?: string;
  role?: Role;
};

export type SessionUser = {
  id: string;
  email: string;
  roles: Role[];
  tenantId?: string;
  orgId?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatar?: string | null;
  metadata?: Record<string, unknown>;
  permissions?: string[];
};

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  tokenType?: string;
};

export type SessionContext = {
  user: SessionUser;
  tokens: TokenSet;
};

export type CookieConfig = {
  sessionCookieName: string;
  refreshCookieName: string;
  domain?: string;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  sessionTtlSeconds: number;
  refreshTtlSeconds: number;
};

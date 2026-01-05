export type Role = 'admin' | 'user' | 'viewer' | 'management' | 'front_seller';

export type SessionUser = {
  id: string;
  email: string;
  roles: Role[];
  orgId?: string;
  metadata?: Record<string, unknown>;
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
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  sessionTtlSeconds: number;
  refreshTtlSeconds: number;
};


import type { ApiRoute } from '@mastra/core/server';
import { injectPortalAuthToken } from './portal-request-context';
import { injectTenantIdFromHeader } from './tenant-request-context';
import { redirectMisplacedStudioPath } from './studio-prefix-redirect';

export interface BuildServerOptionsInput {
  readonly studioChatRoute?: ApiRoute;
}

function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export function buildMastraServerOptions(input: BuildServerOptionsInput = {}) {
  const raw = process.env.MASTRA_CORS_ORIGINS?.trim();
  const origins = raw ? parseOrigins(raw) : [];
  const cors =
    origins.length > 0
      ? {
          origin: origins.length === 1 ? origins[0]! : origins,
          allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type', 'x-tenant-id'],
          exposeHeaders: ['Content-Length', 'X-Requested-With'],
          credentials: false,
        }
      : undefined;
  const apiRoutes = input.studioChatRoute ? [input.studioChatRoute] : [];
  return {
    ...(cors ? { cors } : {}),
    middleware: [
      { path: '*', handler: redirectMisplacedStudioPath },
      { path: '*', handler: injectTenantIdFromHeader },
      { path: '*', handler: injectPortalAuthToken },
    ],
    apiRoutes,
  };
}

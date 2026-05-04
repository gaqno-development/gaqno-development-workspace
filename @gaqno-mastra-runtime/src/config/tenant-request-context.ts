import type { MiddlewareHandler } from 'hono';
import type { RequestContext } from '@mastra/core/request-context';
import { collectionNameForTenant } from '../lib/collection-name-for-tenant';

const TENANT_HEADER = 'x-tenant-id';

export const injectTenantIdFromHeader: MiddlewareHandler = async (c, next) => {
  const rc = c.get('requestContext') as RequestContext | undefined;
  const raw = c.req.header(TENANT_HEADER)?.trim();
  if (rc && raw) {
    try {
      void collectionNameForTenant(raw);
      rc.set('tenantId', raw);
    } catch {
    }
  }
  await next();
};

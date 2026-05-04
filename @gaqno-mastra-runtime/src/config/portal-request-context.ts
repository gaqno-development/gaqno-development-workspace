import type { MiddlewareHandler } from 'hono';
import type { RequestContext } from '@mastra/core/request-context';
import { MASTRA_AUTH_TOKEN_KEY } from '@mastra/core/request-context';

export const injectPortalAuthToken: MiddlewareHandler = async (c, next) => {
  const rc = c.get('requestContext') as RequestContext | undefined;
  const header = c.req.header('authorization')?.trim();
  if (!rc || !header) {
    await next();
    return;
  }
  const lower = header.toLowerCase();
  if (!lower.startsWith('bearer ')) {
    await next();
    return;
  }
  const token = header.slice(7).trim();
  if (token.length > 0) {
    rc.set(MASTRA_AUTH_TOKEN_KEY, token);
  }
  await next();
};

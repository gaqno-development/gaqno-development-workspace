import type { MiddlewareHandler } from 'hono';

export function resolveStudioPrefixRedirect(path: string): string | null {
  if (path === '/studio' || path === '/studio/') {
    return '/';
  }
  if (!path.startsWith('/studio/')) {
    return null;
  }
  return path.slice('/studio'.length);
}

export const redirectMisplacedStudioPath: MiddlewareHandler = async (c, next) => {
  const method = c.req.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return next();
  }
  const target = resolveStudioPrefixRedirect(c.req.path);
  if (!target) {
    return next();
  }
  return c.redirect(target, 302);
};

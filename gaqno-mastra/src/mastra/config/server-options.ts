import { chatRoute } from '@mastra/ai-sdk';

function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export function buildMastraServerOptions() {
  const raw = process.env.MASTRA_CORS_ORIGINS?.trim();
  const origins = raw ? parseOrigins(raw) : [];
  const cors =
    origins.length > 0
      ? {
          origin: origins.length === 1 ? origins[0]! : origins,
          allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type'],
          exposeHeaders: ['Content-Length', 'X-Requested-With'],
          credentials: false,
        }
      : undefined;
  return {
    ...(cors ? { cors } : {}),
    apiRoutes: [chatRoute({ path: '/chat/:agentId' })],
  };
}

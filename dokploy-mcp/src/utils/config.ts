export type Config = {
  dokployApiKey: string;
  dokployBaseUrl: string;
  mcpTransport: 'stdio' | 'http' | 'both';
  mcpHttpPort: number;
  mcpHttpAuthToken: string | undefined;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
};

export function getConfig(): Config {
  const dokployApiKey = process.env.DOKPLOY_API_KEY;
  if (!dokployApiKey) {
    throw new Error('DOKPLOY_API_KEY is required');
  }
  const mcpTransport = (process.env.MCP_TRANSPORT ?? 'stdio') as Config['mcpTransport'];
  if (!['stdio', 'http', 'both'].includes(mcpTransport)) {
    throw new Error('MCP_TRANSPORT must be stdio, http, or both');
  }
  return {
    dokployApiKey,
    dokployBaseUrl: process.env.DOKPLOY_BASE_URL ?? 'http://localhost:3000/api',
    mcpTransport,
    mcpHttpPort: parseInt(process.env.MCP_HTTP_PORT ?? '3001', 10),
    mcpHttpAuthToken: process.env.MCP_HTTP_AUTH_TOKEN ?? undefined,
    logLevel: (process.env.LOG_LEVEL ?? 'info') as Config['logLevel'],
  };
}

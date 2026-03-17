import { startHttpTransport } from '../src/transports/http';
import { startStdioTransport } from '../src/transports/stdio';
import type { Config } from '../src/utils/config';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: 'test-session',
  })),
}));

const baseConfig: Config = {
  dokployApiKey: 'test',
  dokployBaseUrl: 'http://localhost:3000/api',
  mcpTransport: 'http',
  mcpHttpPort: 19876,
  mcpHttpAuthToken: undefined,
  logLevel: 'error',
};

function createMockMcpServer(): McpServer {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  } as unknown as McpServer;
}

async function waitForServer(port: number, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/health`);
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  throw new Error(`Server on port ${port} did not become ready`);
}

describe('HTTP transport', () => {
  it('should respond to /health', async () => {
    const port = 19876;
    const config: Config = { ...baseConfig, mcpHttpPort: port };
    await startHttpTransport(createMockMcpServer, config);
    await waitForServer(port);

    const res = await fetch(`http://localhost:${port}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      status: 'ok',
      server: 'dokploy-mcp',
      transport: 'http',
    });
  });

  it('should return 400 for /messages without sessionId', async () => {
    const port = 19877;
    const config: Config = { ...baseConfig, mcpHttpPort: port };
    await startHttpTransport(createMockMcpServer, config);
    await waitForServer(port);

    const res = await fetch(`http://localhost:${port}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('sessionId query parameter required');
  });

  it('should return 404 for /messages with unknown sessionId', async () => {
    const port = 19878;
    const config: Config = { ...baseConfig, mcpHttpPort: port };
    await startHttpTransport(createMockMcpServer, config);
    await waitForServer(port);

    const res = await fetch(`http://localhost:${port}/messages?sessionId=unknown-session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Session not found');
  });

  it('should return 401 when auth token required but not provided', async () => {
    const port = 19879;
    const config: Config = {
      ...baseConfig,
      mcpHttpPort: port,
      mcpHttpAuthToken: 'secret-token',
    };
    await startHttpTransport(createMockMcpServer, config);
    await waitForServer(port);

    const res = await fetch(`http://localhost:${port}/health`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should allow request with valid auth token', async () => {
    const port = 19880;
    const config: Config = {
      ...baseConfig,
      mcpHttpPort: port,
      mcpHttpAuthToken: 'secret-token',
    };
    await startHttpTransport(createMockMcpServer, config);
    await waitForServer(port);

    const res = await fetch(`http://localhost:${port}/health`, {
      headers: { Authorization: 'Bearer secret-token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

describe('STDIO transport', () => {
  it('should connect server to STDIO transport', async () => {
    const mockServer = createMockMcpServer();
    await startStdioTransport(mockServer);
    expect(mockServer.connect).toHaveBeenCalledOnce();
  });
});

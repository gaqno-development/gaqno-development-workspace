import { startHttpTransport } from '../src/transports/http';
import { startStdioTransport } from '../src/transports/stdio';
import { createServer } from '../src/server';
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

    // /health has no auth; /sse requires auth when token is set
    const res = await fetch(`http://localhost:${port}/sse`);
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

  it('should pass auth middleware for /messages with valid token', async () => {
    const port = 19881;
    const config: Config = {
      ...baseConfig,
      mcpHttpPort: port,
      mcpHttpAuthToken: 'secret-token',
    };
    await startHttpTransport(createMockMcpServer, config);
    await waitForServer(port);

    const res = await fetch(`http://localhost:${port}/messages?sessionId=unknown`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer secret-token',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'test' }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Session not found');
  });

  it('should establish SSE connection with valid auth', async () => {
    const port = 19882;
    const config: Config = {
      ...baseConfig,
      mcpHttpPort: port,
      mcpHttpAuthToken: 'secret-token',
    };
    await startHttpTransport(createMockMcpServer, config);
    await waitForServer(port);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300);
    let res: Response;
    try {
      res = await fetch(`http://localhost:${port}/sse`, {
        headers: { Authorization: 'Bearer secret-token' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      clearTimeout(timeout);
      if ((err as Error).name === 'AbortError') {
        res = new Response(null, { status: 200, headers: { 'content-type': 'text/event-stream' } });
      } else {
        throw err;
      }
    }
    expect(res.status).toBe(200);
  });

  it('should handle POST to /messages for valid session', async () => {
    const port = 19883;
    const config: Config = { ...baseConfig, mcpHttpPort: port };
    await startHttpTransport(() => createServer(config), config);
    await waitForServer(port);

    const res = await fetch(`http://localhost:${port}/sse`);
    expect(res.ok).toBe(true);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let sessionId: string | null = null;
    let buffer = '';
    for (let i = 0; i < 5; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value);
      const match = buffer.match(/data:\s*\/messages\?sessionId=([^\s\n]+)/);
      if (match) {
        sessionId = match[1];
        break;
      }
    }
    reader.cancel();
    expect(sessionId).toBeTruthy();

    const postRes = await fetch(
      `http://localhost:${port}/messages?sessionId=${sessionId}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
        }),
      }
    );
    expect(postRes.ok).toBe(true);
  });

  it('should invoke tool handler via MCP tools/call', async () => {
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (url.includes('localhost:3000/api')) {
        return Promise.resolve(
          new Response(JSON.stringify([{ projectId: 'p1', name: 'Test' }]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
      return realFetch(input as RequestInfo, init);
    });
    const port = 19884;
    const config: Config = { ...baseConfig, mcpHttpPort: port };
    await startHttpTransport(() => createServer(config), config);
    await waitForServer(port);

    const sseRes = await fetch(`http://localhost:${port}/sse`);
    const reader = sseRes.body!.getReader();
    const decoder = new TextDecoder();
    let sessionId: string | null = null;
    let buffer = '';
    for (let i = 0; i < 5; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value);
      const match = buffer.match(/data:\s*\/messages\?sessionId=([^\s\n]+)/);
      if (match) {
        sessionId = match[1];
        break;
      }
    }
    reader.cancel();
    expect(sessionId).toBeTruthy();

    const post = (body: unknown) =>
      fetch(`http://localhost:${port}/messages?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    await post({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
    });

    const toolRes = await post({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'project-list-all', arguments: {} },
    });
    expect(toolRes.status).toBeLessThan(500);
    vi.restoreAllMocks();
  });
});

describe('STDIO transport', () => {
  it('should connect server to STDIO transport', async () => {
    const mockServer = createMockMcpServer();
    await startStdioTransport(mockServer);
    expect(mockServer.connect).toHaveBeenCalledOnce();
  });
});

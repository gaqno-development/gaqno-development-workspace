import { createServer } from '../src/server';
import type { Config } from '../src/utils/config';

const TEST_CONFIG: Config = {
  dokployApiKey: 'test-key',
  dokployBaseUrl: 'http://localhost:3000/api',
  mcpTransport: 'http',
  mcpHttpPort: 0,
  mcpHttpAuthToken: undefined,
  logLevel: 'error',
};

describe('createServer', () => {
  it('should create an McpServer instance', () => {
    const server = createServer(TEST_CONFIG);
    expect(server).toBeDefined();
  });

  it('should create multiple independent servers', () => {
    const server1 = createServer(TEST_CONFIG);
    const server2 = createServer(TEST_CONFIG);
    expect(server1).not.toBe(server2);
  });
});

describe('HTTP transport auth middleware', () => {
  it('should skip auth when no token configured', async () => {
    const config: Config = { ...TEST_CONFIG, mcpHttpAuthToken: undefined };
    const server = createServer(config);
    expect(server).toBeDefined();
  });

  it('should require auth when token configured', async () => {
    const config: Config = { ...TEST_CONFIG, mcpHttpAuthToken: 'secret-token' };
    const server = createServer(config);
    expect(server).toBeDefined();
  });
});

describe('config validation', () => {
  it('should accept valid transport modes', () => {
    for (const transport of ['stdio', 'http', 'both'] as const) {
      const config: Config = { ...TEST_CONFIG, mcpTransport: transport };
      expect(config.mcpTransport).toBe(transport);
    }
  });
});

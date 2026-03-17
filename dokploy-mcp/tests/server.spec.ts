import { createServer } from '../src/server';
import type { Config } from '../src/utils/config';

const config: Config = {
  dokployApiKey: 'test',
  dokployBaseUrl: 'http://localhost:3000/api',
  mcpTransport: 'stdio',
  mcpHttpPort: 3001,
  mcpHttpAuthToken: undefined,
  logLevel: 'error',
};

describe('createServer', () => {
  it('should create a server with registerTool calls', () => {
    const server = createServer(config);
    expect(server).toBeDefined();
  });

  it('should create multiple independent servers', () => {
    const server1 = createServer(config);
    const server2 = createServer(config);
    expect(server1).not.toBe(server2);
  });
});

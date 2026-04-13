import { DokployClient } from '../src/dokploy-client/client';
import { handleToolCall } from '../src/handlers/tool-handler';
import { handleResourceRead } from '../src/handlers/resource-handler';
import { handlePromptGet } from '../src/handlers/prompt-handler';
import { TOOLS } from '../src/capabilities/tools';
import { FIXED_RESOURCES, RESOURCE_TEMPLATES } from '../src/capabilities/resources';
import { PROMPTS } from '../src/capabilities/prompts';
import { getConfig } from '../src/utils/config';
import { createLogger } from '../src/utils/logger';

function createMockClient(response: unknown = {}): DokployClient {
  const client = new DokployClient({ apiKey: 'test', baseUrl: 'http://localhost:3000/api' });
  vi.spyOn(client, 'request').mockResolvedValue(response);
  return client;
}

describe('end-to-end tool flow', () => {
  it('should handle full project lifecycle', async () => {
    const created = { projectId: 'new-p1', name: 'E2E Project' };
    const client = createMockClient(created);

    const result = await handleToolCall(client, 'project-create', {
      name: 'E2E Project',
      description: 'Created by integration test',
    });
    expect(result).toEqual(created);

    vi.spyOn(client, 'request').mockResolvedValue({ ...created, description: 'Updated' });
    const updated = await handleToolCall(client, 'project-update', {
      projectId: 'new-p1',
      description: 'Updated',
    });
    expect(updated).toHaveProperty('description', 'Updated');

    vi.spyOn(client, 'request').mockResolvedValue({});
    const deleted = await handleToolCall(client, 'project-delete', { projectId: 'new-p1' });
    expect(deleted).toBeDefined();
  });

  it('should handle full application lifecycle', async () => {
    const client = createMockClient({ applicationId: 'a1', name: 'TestApp' });
    await handleToolCall(client, 'application-create', { name: 'TestApp', projectId: 'p1' });
    await handleToolCall(client, 'application-deploy', { applicationId: 'a1' });
    await handleToolCall(client, 'application-start', { applicationId: 'a1' });
    await handleToolCall(client, 'application-stop', { applicationId: 'a1' });
    await handleToolCall(client, 'application-restart', { applicationId: 'a1' });
    await handleToolCall(client, 'application-delete', { applicationId: 'a1' });
    expect(client.request).toHaveBeenCalledTimes(6);
  });

  it('should handle full database lifecycle', async () => {
    const client = createMockClient({ mysqlId: 'm1', name: 'TestDB' });
    await handleToolCall(client, 'mysql-create', { name: 'TestDB', projectId: 'p1' });

    vi.spyOn(client, 'request').mockResolvedValue({});
    await handleToolCall(client, 'mysql-deploy', { mysqlId: 'm1' });
    await handleToolCall(client, 'mysql-start', { mysqlId: 'm1' });
    await handleToolCall(client, 'mysql-stop', { mysqlId: 'm1' });
    await handleToolCall(client, 'mysql-remove', { mysqlId: 'm1' });
    expect(client.request).toHaveBeenCalled();
  });
});

describe('end-to-end resource flow', () => {
  it('should render resources for project with services', async () => {
    const mockProjects = [
      {
        projectId: 'p1',
        name: 'ProductionStack',
        applications: [
          { name: 'api', applicationStatus: 'running', sourceType: 'github' },
          { name: 'web', applicationStatus: 'running', sourceType: 'github' },
        ],
        mysql: [{ name: 'main-db', applicationStatus: 'done' }],
        postgres: [],
        redis: [{ name: 'cache', applicationStatus: 'done' }],
        mariadb: [],
        mongo: [],
        createdAt: '2024-01-15',
      },
    ];

    const client = createMockClient(mockProjects);

    const projects = await handleResourceRead(client, 'dokploy://projects');
    expect(projects).toContain('ProductionStack');
    expect(projects).toContain('p1');
    expect(projects).toContain('2');
    expect(projects).toContain('|');

    const apps = await handleResourceRead(client, 'dokploy://applications');
    expect(apps).toContain('api');
    expect(apps).toContain('web');

    const dbs = await handleResourceRead(client, 'dokploy://databases');
    expect(dbs).toContain('main-db');
    expect(dbs).toContain('MySQL');
    expect(dbs).toContain('cache');
    expect(dbs).toContain('Redis');
  });

  it('should render project detail with multiple service types', async () => {
    const project = {
      projectId: 'p1',
      name: 'FullStack',
      description: 'A complete project',
      applications: [{ name: 'frontend' }],
      mysql: [{ name: 'mysql-db' }],
      postgres: [{ name: 'pg-db' }],
      redis: [{ name: 'redis-cache' }],
      mariadb: [],
      mongo: [{ name: 'mongo-store' }],
    };

    const client = createMockClient(project);
    const result = await handleResourceRead(client, 'dokploy://project/p1');
    expect(result).toContain('# FullStack');
    expect(result).toContain('frontend');
    expect(result).toContain('mysql-db');
    expect(result).toContain('pg-db');
    expect(result).toContain('redis-cache');
    expect(result).toContain('mongo-store');
  });
});

describe('end-to-end prompt flow', () => {
  for (const prompt of PROMPTS) {
    it(`should return valid messages for prompt: ${prompt.name}`, () => {
      const args: Record<string, string> = {};
      for (const arg of prompt.arguments) {
        args[arg.name] = `test-${arg.name}`;
      }
      const messages = handlePromptGet(prompt.name, args);
      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[0].content.type).toBe('text');
    });
  }
});

describe('config and logger', () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    originalEnv.DOKPLOY_API_KEY = process.env.DOKPLOY_API_KEY;
    originalEnv.MCP_TRANSPORT = process.env.MCP_TRANSPORT;
    originalEnv.MCP_HTTP_PORT = process.env.MCP_HTTP_PORT;
    originalEnv.DOKPLOY_BASE_URL = process.env.DOKPLOY_BASE_URL;
    originalEnv.DOKPLOY_URL = process.env.DOKPLOY_URL;
    originalEnv.LOG_LEVEL = process.env.LOG_LEVEL;
  });

  afterEach(() => {
    if (originalEnv.DOKPLOY_API_KEY !== undefined)
      process.env.DOKPLOY_API_KEY = originalEnv.DOKPLOY_API_KEY;
    if (originalEnv.MCP_TRANSPORT !== undefined)
      process.env.MCP_TRANSPORT = originalEnv.MCP_TRANSPORT;
    if (originalEnv.MCP_HTTP_PORT !== undefined)
      process.env.MCP_HTTP_PORT = originalEnv.MCP_HTTP_PORT;
    if (originalEnv.DOKPLOY_BASE_URL !== undefined)
      process.env.DOKPLOY_BASE_URL = originalEnv.DOKPLOY_BASE_URL;
    if (originalEnv.DOKPLOY_URL !== undefined)
      process.env.DOKPLOY_URL = originalEnv.DOKPLOY_URL;
    if (originalEnv.LOG_LEVEL !== undefined)
      process.env.LOG_LEVEL = originalEnv.LOG_LEVEL;
  });

  it('should throw when DOKPLOY_API_KEY is missing', () => {
    process.env.DOKPLOY_API_KEY = 'test-key';
    delete process.env.DOKPLOY_API_KEY;
    expect(() => getConfig()).toThrow('DOKPLOY_API_KEY is required');
  });

  it('should throw when MCP_TRANSPORT is invalid', () => {
    process.env.DOKPLOY_API_KEY = 'test-key';
    process.env.MCP_TRANSPORT = 'invalid';
    expect(() => getConfig()).toThrow('MCP_TRANSPORT must be stdio, http, or both');
  });

  it('should accept MCP_TRANSPORT=http', () => {
    process.env.DOKPLOY_API_KEY = 'test-key';
    process.env.MCP_TRANSPORT = 'http';
    const config = getConfig();
    expect(config.mcpTransport).toBe('http');
  });

  it('should accept MCP_TRANSPORT=both', () => {
    process.env.DOKPLOY_API_KEY = 'test-key';
    process.env.MCP_TRANSPORT = 'both';
    const config = getConfig();
    expect(config.mcpTransport).toBe('both');
  });

  it('should use DOKPLOY_URL fallback when DOKPLOY_BASE_URL not set', () => {
    process.env.DOKPLOY_API_KEY = 'test-key';
    process.env.MCP_TRANSPORT = 'stdio';
    delete process.env.DOKPLOY_BASE_URL;
    process.env.DOKPLOY_URL = 'https://custom.example.com/api';
    const config = getConfig();
    expect(config.dokployBaseUrl).toBe('https://custom.example.com/api');
  });

  it('should create a logger with all methods', () => {
    const logger = createLogger('test');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should log debug when LOG_LEVEL=debug', () => {
    process.env.LOG_LEVEL = 'debug';
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createLogger('test');
    logger.debug('debug message');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('debug message'));
    spy.mockRestore();
  });

  it('should log info when LOG_LEVEL=info', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createLogger('test');
    logger.info('info message');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('info message'));
    spy.mockRestore();
  });

  it('should log warn when LOG_LEVEL=warn', () => {
    process.env.LOG_LEVEL = 'warn';
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createLogger('test');
    logger.warn('warn message');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('warn message'));
    spy.mockRestore();
  });

  it('should log to stderr (error)', () => {
    process.env.LOG_LEVEL = 'error';
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createLogger('test');
    logger.error('test message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should include data in log output when provided', () => {
    process.env.LOG_LEVEL = 'debug';
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createLogger('test');
    logger.info('msg', { key: 'value', count: 42 });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"data"'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"key":"value"'));
    spy.mockRestore();
  });

  it('should not log debug when LOG_LEVEL=info', () => {
    process.env.LOG_LEVEL = 'info';
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const logger = createLogger('test');
    logger.debug('should not appear');
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('should not appear'));
    spy.mockRestore();
  });
});

const WS_TOOLS = ['deployment-read-log', 'deployment-read-latest-log'];

describe('completeness checks', () => {
  it('should have a tool handler for every defined tool', async () => {
    const client = createMockClient({});
    for (const tool of TOOLS) {
      if (WS_TOOLS.includes(tool.name)) continue;
      await expect(handleToolCall(client, tool.name, {})).resolves.toBeDefined();
    }
  });

  it('should have a resource handler for every fixed resource', async () => {
    const client = createMockClient([]);
    for (const res of FIXED_RESOURCES) {
      const result = await handleResourceRead(client, res.uri);
      expect(typeof result).toBe('string');
    }
  });

  it('should cover all resource template patterns', () => {
    expect(RESOURCE_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    const patterns = RESOURCE_TEMPLATES.map((t) => t.uriTemplate);
    expect(patterns).toContain('dokploy://project/{projectId}');
    expect(patterns).toContain('dokploy://application/{applicationId}');
    expect(patterns).toContain('dokploy://domain/{domainId}');
  });

  it('should have a prompt handler for every defined prompt', () => {
    for (const prompt of PROMPTS) {
      const args: Record<string, string> = {};
      for (const arg of prompt.arguments) {
        args[arg.name] = 'test';
      }
      expect(() => handlePromptGet(prompt.name, args)).not.toThrow();
    }
  });
});

import { createServer } from '../src/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { DokployClient } from '../src/dokploy-client/client';
import type { Config } from '../src/utils/config';

const config: Config = {
  dokployApiKey: 'test',
  dokployBaseUrl: 'http://localhost:3000/api',
  mcpTransport: 'stdio',
  mcpHttpPort: 3001,
  mcpHttpAuthToken: undefined,
  logLevel: 'error',
};

async function createConnectedPair() {
  const server = createServer(config);
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);
  return { server, client };
}

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

describe('MCP protocol integration', () => {
  beforeEach(() => {
    vi.spyOn(DokployClient.prototype, 'request').mockResolvedValue([
      { projectId: 'p1', name: 'TestProject', applications: [], mysql: [], postgres: [], redis: [], mariadb: [], mongo: [], compose: [], createdAt: '2024-01-01' },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should list tools via MCP protocol', async () => {
    const { client } = await createConnectedPair();
    const result = await client.listTools();
    expect(result.tools.length).toBeGreaterThanOrEqual(50);
    const names = result.tools.map((t) => t.name);
    expect(names).toContain('project-list-all');
    expect(names).toContain('application-deploy');
    await client.close();
  });

  it('should call a tool via MCP protocol', async () => {
    const { client } = await createConnectedPair();
    const result = await client.callTool({ name: 'project-list-all', arguments: {} });
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    const textContent = result.content as Array<{ type: string; text: string }>;
    expect(textContent[0].type).toBe('text');
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed).toEqual(expect.arrayContaining([expect.objectContaining({ projectId: 'p1' })]));
    await client.close();
  });

  it('should return error content when tool fails', async () => {
    vi.spyOn(DokployClient.prototype, 'request').mockRejectedValue(new Error('API down'));
    const { client } = await createConnectedPair();
    const result = await client.callTool({ name: 'project-list-all', arguments: {} });
    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{ type: string; text: string }>;
    expect(textContent[0].text).toContain('Error: API down');
    await client.close();
  });

  it('should return error content for non-Error throw', async () => {
    vi.spyOn(DokployClient.prototype, 'request').mockRejectedValue('string error');
    const { client } = await createConnectedPair();
    const result = await client.callTool({ name: 'project-list-all', arguments: {} });
    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{ type: string; text: string }>;
    expect(textContent[0].text).toContain('Error: string error');
    await client.close();
  });

  it('should list resources via MCP protocol', async () => {
    const { client } = await createConnectedPair();
    const result = await client.listResources();
    expect(result.resources.length).toBeGreaterThanOrEqual(3);
    const uris = result.resources.map((r) => r.uri);
    expect(uris).toContain('dokploy://projects');
    await client.close();
  });

  it('should read a fixed resource via MCP protocol', async () => {
    const { client } = await createConnectedPair();
    const result = await client.readResource({ uri: 'dokploy://projects' });
    expect(result.contents).toBeDefined();
    expect(result.contents.length).toBe(1);
    expect(result.contents[0].mimeType).toBe('text/markdown');
    const text = result.contents[0].text as string;
    expect(text).toContain('TestProject');
    await client.close();
  });

  it('should read a templated resource via MCP protocol', async () => {
    vi.spyOn(DokployClient.prototype, 'request').mockResolvedValue({
      projectId: 'p1',
      name: 'DetailProject',
      description: 'A test project',
      applications: [],
      mysql: [],
      postgres: [],
      redis: [],
      mariadb: [],
      mongo: [],
    });
    const { client } = await createConnectedPair();
    const result = await client.readResource({ uri: 'dokploy://project/p1' });
    expect(result.contents[0].text).toContain('DetailProject');
    await client.close();
  });

  it('should list prompts via MCP protocol', async () => {
    const { client } = await createConnectedPair();
    const result = await client.listPrompts();
    expect(result.prompts.length).toBe(4);
    const names = result.prompts.map((p) => p.name);
    expect(names).toContain('deploy-application');
    expect(names).toContain('provision-database');
    await client.close();
  });

  it('should get a prompt via MCP protocol', async () => {
    const { client } = await createConnectedPair();
    const result = await client.getPrompt({
      name: 'deploy-application',
      arguments: { projectName: 'TestProj', applicationName: 'TestApp' },
    });
    expect(result.messages.length).toBeGreaterThanOrEqual(2);
    expect(result.messages[0].role).toBe('user');
    const text = result.messages[0].content as { type: string; text: string };
    expect(text.text).toContain('TestApp');
    await client.close();
  });

  it('should get provision-database prompt with args', async () => {
    const { client } = await createConnectedPair();
    const result = await client.getPrompt({
      name: 'provision-database',
      arguments: { projectId: 'p1', dbType: 'mysql', name: 'mydb' },
    });
    expect(result.messages.length).toBeGreaterThanOrEqual(2);
    const assistantText = result.messages[1].content as { type: string; text: string };
    expect(assistantText.text).toContain('mysql-create');
    await client.close();
  });

  it('should list resource templates via MCP protocol', async () => {
    const { client } = await createConnectedPair();
    const result = await client.listResourceTemplates();
    expect(result.resourceTemplates.length).toBeGreaterThanOrEqual(3);
    await client.close();
  });
});

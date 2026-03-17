import { vi } from 'vitest';
import { handleToolCall } from '../src/handlers/tool-handler';
import { TOOLS, findTool } from '../src/capabilities/tools';
import { DokployClient } from '../src/dokploy-client/client';

function createMockClient(response: unknown = {}): DokployClient {
  const client = new DokployClient({
    apiKey: 'test-key',
    baseUrl: 'http://localhost:3000/api',
  });
  vi.spyOn(client, 'request').mockResolvedValue(response);
  return client;
}

describe('TOOLS definitions', () => {
  it('should have at least 50 tools defined', () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(50);
  });

  it('should have unique tool names', () => {
    const names = TOOLS.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('should include all project tools', () => {
    const projectTools = [
      'project-list-all',
      'project-get-one',
      'project-create',
      'project-update',
      'project-delete',
      'project-duplicate',
    ];
    for (const name of projectTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('should include all application tools', () => {
    const applicationTools = TOOLS.filter((t) => t.name.startsWith('application-'));
    expect(applicationTools.length).toBeGreaterThanOrEqual(10);
  });

  it('should include all mysql tools', () => {
    const mysqlTools = [
      'mysql-create',
      'mysql-get-one',
      'mysql-update',
      'mysql-deploy',
      'mysql-start',
      'mysql-stop',
      'mysql-remove',
    ];
    for (const name of mysqlTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('should include all postgres tools', () => {
    const postgresTools = [
      'postgres-create',
      'postgres-get-one',
      'postgres-update',
      'postgres-deploy',
      'postgres-start',
      'postgres-stop',
      'postgres-remove',
    ];
    for (const name of postgresTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('should include all redis tools', () => {
    const redisTools = [
      'redis-create',
      'redis-get-one',
      'redis-deploy',
      'redis-start',
      'redis-stop',
      'redis-remove',
    ];
    for (const name of redisTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('should include all mariadb tools', () => {
    const mariadbTools = [
      'mariadb-create',
      'mariadb-get-one',
      'mariadb-deploy',
      'mariadb-start',
      'mariadb-stop',
      'mariadb-remove',
    ];
    for (const name of mariadbTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('should include all mongo tools', () => {
    const mongoTools = [
      'mongo-create',
      'mongo-get-one',
      'mongo-deploy',
      'mongo-start',
      'mongo-stop',
      'mongo-remove',
    ];
    for (const name of mongoTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('should include all domain tools', () => {
    const domainTools = [
      'domain-create',
      'domain-get-one',
      'domain-update',
      'domain-delete',
      'domain-list-by-app',
      'domain-generate',
    ];
    for (const name of domainTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('should include all ai tools', () => {
    const aiTools = [
      'ai-list-all',
      'ai-get-one',
      'ai-create',
      'ai-update',
      'ai-delete',
    ];
    for (const name of aiTools) {
      expect(TOOLS.some((t) => t.name === name)).toBe(true);
    }
  });

  it('findTool should return tool by name', () => {
    const tool = findTool('project-list-all');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('project-list-all');
    expect(tool?.description).toBeDefined();
    expect(tool?.inputSchema).toBeDefined();
  });

  it('findTool should return undefined for unknown tool', () => {
    expect(findTool('unknown-tool')).toBeUndefined();
  });
});

describe('handleToolCall', () => {
  it('should call project-list-all', async () => {
    const response = [{ projectId: 'p1' }];
    const client = createMockClient(response);
    const result = await handleToolCall(client, 'project-list-all', {});
    expect(result).toEqual(response);
    expect(client.request).toHaveBeenCalledWith('/project.all');
  });

  it('should call project-get-one with projectId', async () => {
    const response = { projectId: 'p1', name: 'Test' };
    const client = createMockClient(response);
    await handleToolCall(client, 'project-get-one', { projectId: 'p1' });
    expect(client.request).toHaveBeenCalledWith('/project.one', {
      query: { projectId: 'p1' },
    });
  });

  it('should call project-create with body', async () => {
    const body = { name: 'New Project', description: 'Test' };
    const response = { projectId: 'p1', ...body };
    const client = createMockClient(response);
    const result = await handleToolCall(client, 'project-create', body);
    expect(result).toEqual(response);
    expect(client.request).toHaveBeenCalledWith('/project.create', {
      method: 'POST',
      body,
    });
  });

  it('should call application-deploy', async () => {
    const client = createMockClient({});
    await handleToolCall(client, 'application-deploy', {
      applicationId: 'app-1',
    });
    expect(client.request).toHaveBeenCalledWith('/application.deploy', {
      method: 'POST',
      body: { applicationId: 'app-1' },
    });
  });

  it('should call mysql-create', async () => {
    const body = { name: 'mysql-1', projectId: 'p1' };
    const client = createMockClient({ mysqlId: 'm1' });
    await handleToolCall(client, 'mysql-create', body);
    expect(client.request).toHaveBeenCalledWith('/mysql.create', {
      method: 'POST',
      body,
    });
  });

  it('should call postgres-deploy', async () => {
    const client = createMockClient({});
    await handleToolCall(client, 'postgres-deploy', { postgresId: 'pg-1' });
    expect(client.request).toHaveBeenCalledWith('/postgres.deploy', {
      method: 'POST',
      body: { postgresId: 'pg-1' },
    });
  });

  it('should call redis-start', async () => {
    const client = createMockClient({});
    await handleToolCall(client, 'redis-start', { redisId: 'r1' });
    expect(client.request).toHaveBeenCalledWith('/redis.start', {
      method: 'POST',
      body: { redisId: 'r1' },
    });
  });

  it('should call domain-create', async () => {
    const body = { host: 'example.com', applicationId: 'app-1' };
    const client = createMockClient({ domainId: 'd1' });
    await handleToolCall(client, 'domain-create', body);
    expect(client.request).toHaveBeenCalledWith('/domain.create', {
      method: 'POST',
      body,
    });
  });

  it('should call ai-list-all', async () => {
    const response = [{ aiId: 'ai-1' }];
    const client = createMockClient(response);
    const result = await handleToolCall(client, 'ai-list-all', {});
    expect(result).toEqual(response);
    expect(client.request).toHaveBeenCalledWith('/ai.getAll');
  });

  it('should throw for unknown tool', async () => {
    const client = createMockClient();
    await expect(
      handleToolCall(client, 'nonexistent', {})
    ).rejects.toThrow('Unknown tool: nonexistent');
    expect(client.request).not.toHaveBeenCalled();
  });
});

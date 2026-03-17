import { vi } from 'vitest';
import { handleResourceRead } from '../src/handlers/resource-handler';
import { FIXED_RESOURCES, RESOURCE_TEMPLATES } from '../src/capabilities/resources';
import { handlePromptGet } from '../src/handlers/prompt-handler';
import { PROMPTS } from '../src/capabilities/prompts';
import { DokployClient } from '../src/dokploy-client/client';

function createMockClient(response: unknown = []): DokployClient {
  const client = new DokployClient({ apiKey: 'test-key', baseUrl: 'http://localhost:3000/api' });
  vi.spyOn(client, 'request').mockResolvedValue(response);
  return client;
}

describe('FIXED_RESOURCES', () => {
  it('should define 3 fixed resources', () => {
    expect(FIXED_RESOURCES).toHaveLength(3);
  });

  it('should all have dokploy:// URIs', () => {
    for (const r of FIXED_RESOURCES) {
      expect(r.uri).toMatch(/^dokploy:\/\//);
    }
  });

  it('should all be text/markdown', () => {
    for (const r of FIXED_RESOURCES) {
      expect(r.mimeType).toBe('text/markdown');
    }
  });
});

describe('RESOURCE_TEMPLATES', () => {
  it('should define 3 resource templates', () => {
    expect(RESOURCE_TEMPLATES).toHaveLength(3);
  });

  it('should have proper URI templates', () => {
    for (const t of RESOURCE_TEMPLATES) {
      expect(t.uriTemplate).toContain('{');
    }
  });
});

describe('handleResourceRead', () => {
  const projectListResponse = [
    {
      projectId: 'p1',
      name: 'TestProject',
      applications: [{ name: 'app1' }],
      mysql: [{ name: 'db1' }],
      postgres: [],
      redis: [],
      mariadb: [],
      mongo: [],
      createdAt: '2024-01-01',
    },
  ];

  it('should list projects as markdown table', async () => {
    const client = createMockClient(projectListResponse);
    const result = await handleResourceRead(client, 'dokploy://projects');
    expect(result).toContain('TestProject');
    expect(result).toContain('p1');
    expect(result).toContain('|');
  });

  it('should list applications from all projects', async () => {
    const client = createMockClient(projectListResponse);
    const result = await handleResourceRead(client, 'dokploy://applications');
    expect(result).toContain('app1');
  });

  it('should list databases from all projects', async () => {
    const client = createMockClient(projectListResponse);
    const result = await handleResourceRead(client, 'dokploy://databases');
    expect(result).toContain('db1');
    expect(result).toContain('MySQL');
  });

  it('should format project detail', async () => {
    const project = {
      projectId: 'p1',
      name: 'TestProject',
      applications: [],
      mysql: [],
      postgres: [],
      redis: [],
      mariadb: [],
      mongo: [],
      createdAt: '2024-01-01',
    };
    const client = createMockClient(project);
    const result = await handleResourceRead(client, 'dokploy://project/p1');
    expect(result).toMatch(/^# TestProject/);
  });

  it('should format application detail', async () => {
    const application = {
      applicationId: 'a1',
      name: 'MyApp',
      applicationStatus: 'running',
      projectId: 'p1',
      createdAt: '2024-01-01',
    };
    const client = createMockClient(application);
    const result = await handleResourceRead(client, 'dokploy://application/a1');
    expect(result).toContain('MyApp');
    expect(result).toContain('a1');
    expect(result).toContain('running');
  });

  it('should format domain detail', async () => {
    const domain = {
      domainId: 'd1',
      host: 'example.com',
      path: '',
      port: 80,
      applicationId: 'a1',
      createdAt: '2024-01-01',
    };
    const client = createMockClient(domain);
    const result = await handleResourceRead(client, 'dokploy://domain/d1');
    expect(result).toContain('example.com');
  });

  it('should throw for unknown URI', async () => {
    const client = createMockClient();
    await expect(handleResourceRead(client, 'dokploy://unknown')).rejects.toThrow('Unknown resource URI');
  });
});

describe('PROMPTS', () => {
  it('should define 4 prompts', () => {
    expect(PROMPTS).toHaveLength(4);
  });

  it('should include deploy-application prompt', () => {
    expect(PROMPTS.find((p) => p.name === 'deploy-application')).toBeDefined();
  });

  it('should include provision-database prompt', () => {
    expect(PROMPTS.find((p) => p.name === 'provision-database')).toBeDefined();
  });
});

describe('handlePromptGet', () => {
  it('should return messages for deploy-application', () => {
    const result = handlePromptGet('deploy-application', {});
    expect(result).toBeInstanceOf(Array);
    expect(result.some((m) => m.role === 'user')).toBe(true);
    expect(result.some((m) => m.role === 'assistant')).toBe(true);
  });

  it('should include project/app names in deploy-application', () => {
    const result = handlePromptGet('deploy-application', {
      projectName: 'MyProject',
      applicationName: 'MyApp',
    });
    const userText = result.find((m) => m.role === 'user')?.content.text ?? '';
    expect(userText).toContain('MyProject');
    expect(userText).toContain('MyApp');
  });

  it('should return messages for provision-database', () => {
    const result = handlePromptGet('provision-database', {
      projectId: 'p1',
      dbType: 'postgres',
      name: 'mydb',
    });
    const userText = result.find((m) => m.role === 'user')?.content.text ?? '';
    expect(userText).toContain('postgres');
    expect(userText).toContain('mydb');
    expect(userText).toContain('p1');
  });

  it('should return messages for list-and-manage-apps', () => {
    const result = handlePromptGet('list-and-manage-apps', {});
    expect(result).toBeInstanceOf(Array);
    expect(result.some((m) => m.role === 'user')).toBe(true);
    expect(result.some((m) => m.role === 'assistant')).toBe(true);
  });

  it('should return messages for scale-application', () => {
    const result = handlePromptGet('scale-application', { applicationId: 'a1' });
    expect(result).toBeInstanceOf(Array);
    expect(result.some((m) => m.role === 'user')).toBe(true);
    expect(result.some((m) => m.role === 'assistant')).toBe(true);
  });

  it('should throw for unknown prompt', () => {
    expect(() => handlePromptGet('unknown-prompt', {})).toThrow(/Unknown prompt/);
  });
});

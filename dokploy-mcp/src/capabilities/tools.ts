import { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
}

export const TOOLS: ToolDefinition[] = [
  {
    name: 'project-list-all',
    description: 'List all Dokploy projects.',
    inputSchema: z.object({}),
  },
  {
    name: 'project-get-one',
    description: 'Get details of a single Dokploy project by ID.',
    inputSchema: z.object({ projectId: z.string() }),
  },
  {
    name: 'project-create',
    description: 'Create a new Dokploy project.',
    inputSchema: z.object({
      name: z.string(),
      description: z.string().optional(),
    }),
  },
  {
    name: 'project-update',
    description: 'Update an existing Dokploy project.',
    inputSchema: z.object({
      projectId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
  },
  {
    name: 'project-delete',
    description: 'Remove a Dokploy project.',
    inputSchema: z.object({ projectId: z.string() }),
  },
  {
    name: 'project-duplicate',
    description: 'Clone an existing Dokploy project.',
    inputSchema: z.object({ projectId: z.string() }),
  },
  {
    name: 'application-create',
    description: 'Create a new application within a Dokploy project.',
    inputSchema: z.object({
      name: z.string(),
      projectId: z.string(),
      description: z.string().optional(),
    }),
  },
  {
    name: 'application-get-one',
    description: 'Get details of a single application.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'application-update',
    description: 'Update application configuration. Accepts applicationId and any additional fields.',
    inputSchema: z.object({ applicationId: z.string() }).passthrough(),
  },
  {
    name: 'application-deploy',
    description: 'Deploy an application to its target environment.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'application-redeploy',
    description: 'Redeploy an application with current configuration.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'application-start',
    description: 'Start a stopped application.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'application-stop',
    description: 'Stop a running application.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'application-delete',
    description: 'Delete an application and its resources.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'application-save-environment',
    description: 'Save environment variables for an application.',
    inputSchema: z.object({
      applicationId: z.string(),
      env: z.string(),
    }),
  },
  {
    name: 'application-restart',
    description: 'Restart a running application.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'mysql-create',
    description: 'Create a new MySQL database instance in Dokploy.',
    inputSchema: z.object({
      name: z.string(),
      projectId: z.string(),
      databaseName: z.string().optional(),
      databaseUser: z.string().optional(),
      databasePassword: z.string().optional(),
      databaseRootPassword: z.string().optional(),
      dockerImage: z.string().optional(),
      description: z.string().optional(),
    }),
  },
  {
    name: 'mysql-get-one',
    description: 'Get details of a MySQL database instance.',
    inputSchema: z.object({ mysqlId: z.string() }),
  },
  {
    name: 'mysql-update',
    description: 'Update MySQL database configuration. Accepts mysqlId and any additional fields.',
    inputSchema: z.object({ mysqlId: z.string() }).passthrough(),
  },
  {
    name: 'mysql-deploy',
    description: 'Deploy a MySQL database instance.',
    inputSchema: z.object({ mysqlId: z.string() }),
  },
  {
    name: 'mysql-start',
    description: 'Start a MySQL database instance.',
    inputSchema: z.object({ mysqlId: z.string() }),
  },
  {
    name: 'mysql-stop',
    description: 'Stop a MySQL database instance.',
    inputSchema: z.object({ mysqlId: z.string() }),
  },
  {
    name: 'mysql-remove',
    description: 'Remove a MySQL database instance.',
    inputSchema: z.object({ mysqlId: z.string() }),
  },
  {
    name: 'postgres-create',
    description: 'Create a new PostgreSQL database instance in Dokploy.',
    inputSchema: z.object({
      name: z.string(),
      projectId: z.string(),
      databaseName: z.string().optional(),
      databaseUser: z.string().optional(),
      databasePassword: z.string().optional(),
      databaseRootPassword: z.string().optional(),
      dockerImage: z.string().optional(),
      description: z.string().optional(),
    }),
  },
  {
    name: 'postgres-get-one',
    description: 'Get details of a PostgreSQL database instance.',
    inputSchema: z.object({ postgresId: z.string() }),
  },
  {
    name: 'postgres-update',
    description: 'Update PostgreSQL database configuration. Accepts postgresId and any additional fields.',
    inputSchema: z.object({ postgresId: z.string() }).passthrough(),
  },
  {
    name: 'postgres-deploy',
    description: 'Deploy a PostgreSQL database instance.',
    inputSchema: z.object({ postgresId: z.string() }),
  },
  {
    name: 'postgres-start',
    description: 'Start a PostgreSQL database instance.',
    inputSchema: z.object({ postgresId: z.string() }),
  },
  {
    name: 'postgres-stop',
    description: 'Stop a PostgreSQL database instance.',
    inputSchema: z.object({ postgresId: z.string() }),
  },
  {
    name: 'postgres-remove',
    description: 'Remove a PostgreSQL database instance.',
    inputSchema: z.object({ postgresId: z.string() }),
  },
  {
    name: 'redis-create',
    description: 'Create a new Redis instance in Dokploy.',
    inputSchema: z.object({
      name: z.string(),
      projectId: z.string(),
      description: z.string().optional(),
      databasePassword: z.string().optional(),
      dockerImage: z.string().optional(),
    }),
  },
  {
    name: 'redis-get-one',
    description: 'Get details of a Redis instance.',
    inputSchema: z.object({ redisId: z.string() }),
  },
  {
    name: 'redis-deploy',
    description: 'Deploy a Redis instance.',
    inputSchema: z.object({ redisId: z.string() }),
  },
  {
    name: 'redis-start',
    description: 'Start a Redis instance.',
    inputSchema: z.object({ redisId: z.string() }),
  },
  {
    name: 'redis-stop',
    description: 'Stop a Redis instance.',
    inputSchema: z.object({ redisId: z.string() }),
  },
  {
    name: 'redis-remove',
    description: 'Remove a Redis instance.',
    inputSchema: z.object({ redisId: z.string() }),
  },
  {
    name: 'mariadb-create',
    description: 'Create a new MariaDB database instance in Dokploy.',
    inputSchema: z.object({
      name: z.string(),
      projectId: z.string(),
      databaseName: z.string().optional(),
      databaseUser: z.string().optional(),
      databasePassword: z.string().optional(),
      databaseRootPassword: z.string().optional(),
      dockerImage: z.string().optional(),
      description: z.string().optional(),
    }),
  },
  {
    name: 'mariadb-get-one',
    description: 'Get details of a MariaDB database instance.',
    inputSchema: z.object({ mariadbId: z.string() }),
  },
  {
    name: 'mariadb-deploy',
    description: 'Deploy a MariaDB database instance.',
    inputSchema: z.object({ mariadbId: z.string() }),
  },
  {
    name: 'mariadb-start',
    description: 'Start a MariaDB database instance.',
    inputSchema: z.object({ mariadbId: z.string() }),
  },
  {
    name: 'mariadb-stop',
    description: 'Stop a MariaDB database instance.',
    inputSchema: z.object({ mariadbId: z.string() }),
  },
  {
    name: 'mariadb-remove',
    description: 'Remove a MariaDB database instance.',
    inputSchema: z.object({ mariadbId: z.string() }),
  },
  {
    name: 'mongo-create',
    description: 'Create a new MongoDB instance in Dokploy.',
    inputSchema: z.object({
      name: z.string(),
      projectId: z.string(),
      description: z.string().optional(),
      databaseUser: z.string().optional(),
      databasePassword: z.string().optional(),
      dockerImage: z.string().optional(),
    }),
  },
  {
    name: 'mongo-get-one',
    description: 'Get details of a MongoDB instance.',
    inputSchema: z.object({ mongoId: z.string() }),
  },
  {
    name: 'mongo-deploy',
    description: 'Deploy a MongoDB instance.',
    inputSchema: z.object({ mongoId: z.string() }),
  },
  {
    name: 'mongo-start',
    description: 'Start a MongoDB instance.',
    inputSchema: z.object({ mongoId: z.string() }),
  },
  {
    name: 'mongo-stop',
    description: 'Stop a MongoDB instance.',
    inputSchema: z.object({ mongoId: z.string() }),
  },
  {
    name: 'mongo-remove',
    description: 'Remove a MongoDB instance.',
    inputSchema: z.object({ mongoId: z.string() }),
  },
  {
    name: 'domain-create',
    description: 'Create a domain mapping for an application.',
    inputSchema: z.object({
      host: z.string(),
      applicationId: z.string(),
      path: z.string().optional(),
      port: z.number().optional(),
      https: z.boolean().optional(),
      certificateType: z.string().optional(),
    }),
  },
  {
    name: 'domain-get-one',
    description: 'Get details of a domain configuration.',
    inputSchema: z.object({ domainId: z.string() }),
  },
  {
    name: 'domain-update',
    description: 'Update domain configuration. Accepts domainId and any additional fields.',
    inputSchema: z.object({ domainId: z.string() }).passthrough(),
  },
  {
    name: 'domain-delete',
    description: 'Delete a domain mapping.',
    inputSchema: z.object({ domainId: z.string() }),
  },
  {
    name: 'domain-list-by-app',
    description: 'List all domains configured for an application.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'domain-generate',
    description: 'Auto-generate a domain configuration for an application.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'ai-list-all',
    description: 'List all AI configuration entries in Dokploy.',
    inputSchema: z.object({}),
  },
  {
    name: 'ai-get-one',
    description: 'Get details of a single AI configuration.',
    inputSchema: z.object({ aiId: z.string() }),
  },
  {
    name: 'ai-create',
    description: 'Create a new AI configuration. Accepts any configuration fields.',
    inputSchema: z.record(z.unknown()),
  },
  {
    name: 'ai-update',
    description: 'Update an AI configuration. Accepts any configuration fields.',
    inputSchema: z.record(z.unknown()),
  },
  {
    name: 'ai-delete',
    description: 'Delete an AI configuration.',
    inputSchema: z.object({ aiId: z.string() }),
  },
];

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}

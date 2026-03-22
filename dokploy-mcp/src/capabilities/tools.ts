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
      environmentId: z.string().optional(),
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
  {
    name: 'deployment-list',
    description: 'List all deployments for an application. Returns deployment IDs, status, timestamps, and log paths.',
    inputSchema: z.object({ applicationId: z.string() }),
  },
  {
    name: 'deployment-list-by-type',
    description: 'List deployments by resource type (application, compose, server, etc.).',
    inputSchema: z.object({
      id: z.string(),
      type: z.enum(['application', 'compose', 'server', 'schedule', 'previewDeployment', 'backup', 'volumeBackup']),
    }),
  },
  {
    name: 'deployment-kill',
    description: 'Kill a running deployment build process.',
    inputSchema: z.object({ deploymentId: z.string() }),
  },
  {
    name: 'deployment-remove',
    description: 'Remove a deployment record.',
    inputSchema: z.object({ deploymentId: z.string() }),
  },
  {
    name: 'docker-get-containers',
    description: 'List all Docker containers on the server with name, image, state, and status.',
    inputSchema: z.object({}),
  },
  {
    name: 'docker-get-containers-by-app',
    description: 'Get Docker containers matching an application name.',
    inputSchema: z.object({ appName: z.string() }),
  },
  {
    name: 'docker-get-service-containers',
    description: 'Get Docker service containers by app name (Docker Swarm).',
    inputSchema: z.object({ appName: z.string() }),
  },
  {
    name: 'docker-restart-container',
    description: 'Restart a Docker container by its ID.',
    inputSchema: z.object({ containerId: z.string() }),
  },
  {
    name: 'docker-get-config',
    description: 'Get Docker daemon configuration.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-health',
    description: 'Check Dokploy server health status.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-get-ip',
    description: 'Get the public IP address of the Dokploy server.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-clean-docker-prune',
    description: 'Run Docker system prune to free disk space.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-clean-unused-images',
    description: 'Remove unused Docker images to free disk space.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-clean-docker-builder',
    description: 'Clean Docker builder cache.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-clean-stopped-containers',
    description: 'Remove stopped Docker containers.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-read-traefik-config',
    description: 'Read the global Traefik configuration.',
    inputSchema: z.object({}),
  },
  {
    name: 'settings-get-web-server',
    description: 'Get Dokploy web server settings.',
    inputSchema: z.object({}),
  },
  {
    name: 'deployment-read-log',
    description: 'Read the build/deployment log for a specific deployment by its logPath. Use deployment-list to get the logPath first.',
    inputSchema: z.object({
      logPath: z.string().describe('Absolute path to the log file on the Dokploy server (from deployment record logPath field)'),
      timeoutMs: z.number().optional().describe('Max time in ms to wait for log data (default 10000)'),
    }),
  },
  {
    name: 'deployment-read-latest-log',
    description: 'Read the build/deployment log for the latest deployment of an application. Returns deploymentId, status, title and full log output.',
    inputSchema: z.object({
      applicationId: z.string(),
      timeoutMs: z.number().optional().describe('Max time in ms to wait for log data (default 10000)'),
    }),
  },
];

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}

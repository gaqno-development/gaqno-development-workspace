export interface PromptDefinition {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

export const PROMPTS: PromptDefinition[] = [
  {
    name: 'deploy-application',
    description: 'Deploy an application to a Dokploy project. Guides through listing projects, selecting an app, verifying settings, and deploying.',
    arguments: [
      { name: 'projectName', description: 'Name or ID of the project', required: false },
      { name: 'applicationName', description: 'Name or ID of the application', required: false },
    ],
  },
  {
    name: 'provision-database',
    description: 'Create and configure a new database (MySQL, PostgreSQL, Redis, MariaDB, or MongoDB) in a Dokploy project.',
    arguments: [
      { name: 'projectId', description: 'Target project ID', required: true },
      { name: 'dbType', description: 'Database type: mysql, postgres, redis, mariadb, or mongo', required: true },
      { name: 'name', description: 'Database instance name', required: true },
    ],
  },
  {
    name: 'list-and-manage-apps',
    description: 'View all applications across projects and perform actions (start, stop, deploy, restart) on a selected one.',
    arguments: [
      { name: 'filter', description: 'Optional filter (project name, status)', required: false },
    ],
  },
  {
    name: 'scale-application',
    description: 'Update resource limits (memory, CPU) for an application and restart it.',
    arguments: [
      { name: 'applicationId', description: 'Application ID to scale', required: true },
      { name: 'memoryLimit', description: 'New memory limit (e.g. 512m, 1g)', required: false },
      { name: 'cpuLimit', description: 'New CPU limit (e.g. 0.5, 1)', required: false },
    ],
  },
];

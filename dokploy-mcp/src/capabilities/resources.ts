export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const FIXED_RESOURCES: ResourceDefinition[] = [
  {
    uri: 'dokploy://projects',
    name: 'All Projects',
    description: 'List all Dokploy projects with service counts',
    mimeType: 'text/markdown',
  },
  {
    uri: 'dokploy://applications',
    name: 'All Applications',
    description: 'All applications across all projects',
    mimeType: 'text/markdown',
  },
  {
    uri: 'dokploy://databases',
    name: 'All Databases',
    description: 'All databases (MySQL, PostgreSQL, Redis, MariaDB, MongoDB)',
    mimeType: 'text/markdown',
  },
];

export const RESOURCE_TEMPLATES = [
  {
    uriTemplate: 'dokploy://project/{projectId}',
    name: 'Project Details',
    description: 'Detailed view of a project with all its services',
    mimeType: 'text/markdown',
  },
  {
    uriTemplate: 'dokploy://application/{applicationId}',
    name: 'Application Details',
    description: 'Application configuration and status',
    mimeType: 'text/markdown',
  },
  {
    uriTemplate: 'dokploy://domain/{domainId}',
    name: 'Domain Details',
    description: 'Domain routing configuration',
    mimeType: 'text/markdown',
  },
];

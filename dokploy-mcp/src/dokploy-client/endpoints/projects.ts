import type { DokployClient } from '../client.js';
import type { DokployProject } from '../types.js';

export async function listProjects(client: DokployClient): Promise<DokployProject[]> {
  return client.request<DokployProject[]>('/project.all');
}

export async function getProject(
  client: DokployClient,
  projectId: string
): Promise<DokployProject> {
  return client.request<DokployProject>('/project.one', {
    query: { projectId },
  });
}

export async function createProject(
  client: DokployClient,
  data: { name: string; description?: string; environmentId?: string }
): Promise<DokployProject> {
  return client.request<DokployProject>('/project.create', {
    method: 'POST',
    body: data,
  });
}

export async function updateProject(
  client: DokployClient,
  data: { projectId: string; name?: string; description?: string }
): Promise<DokployProject> {
  return client.request<DokployProject>('/project.update', {
    method: 'POST',
    body: data,
  });
}

export async function removeProject(
  client: DokployClient,
  projectId: string
): Promise<unknown> {
  return client.request<unknown>('/project.remove', {
    method: 'POST',
    body: { projectId },
  });
}

export async function duplicateProject(
  client: DokployClient,
  projectId: string
): Promise<DokployProject> {
  return client.request<DokployProject>('/project.duplicate', {
    method: 'POST',
    body: { projectId },
  });
}

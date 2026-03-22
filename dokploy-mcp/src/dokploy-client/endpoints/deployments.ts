import type { DokployClient } from '../client.js';

export async function listDeployments(
  client: DokployClient,
  applicationId: string
): Promise<unknown> {
  return client.request<unknown>('/deployment.all', {
    query: { applicationId },
  });
}

export async function listDeploymentsByType(
  client: DokployClient,
  id: string,
  type: string
): Promise<unknown> {
  return client.request<unknown>('/deployment.allByType', {
    query: { id, type },
  });
}

export async function killDeploymentProcess(
  client: DokployClient,
  deploymentId: string
): Promise<unknown> {
  return client.request<unknown>('/deployment.killProcess', {
    method: 'POST',
    body: { deploymentId },
  });
}

export async function removeDeployment(
  client: DokployClient,
  deploymentId: string
): Promise<unknown> {
  return client.request<unknown>('/deployment.removeDeployment', {
    method: 'POST',
    body: { deploymentId },
  });
}

import type { DokployClient } from '../client.js';

export async function getContainers(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/docker.getContainers');
}

export async function getContainersByAppNameMatch(
  client: DokployClient,
  appName: string
): Promise<unknown> {
  return client.request<unknown>('/docker.getContainersByAppNameMatch', {
    query: { appName },
  });
}

export async function getServiceContainersByAppName(
  client: DokployClient,
  appName: string
): Promise<unknown> {
  return client.request<unknown>('/docker.getServiceContainersByAppName', {
    query: { appName },
  });
}

export async function restartContainer(
  client: DokployClient,
  containerId: string
): Promise<unknown> {
  return client.request<unknown>('/docker.restartContainer', {
    method: 'POST',
    body: { containerId },
  });
}

export async function getDockerConfig(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/docker.getConfig');
}

import type { DokployClient } from '../client.js';

export async function getHealth(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.health');
}

export async function getIp(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.getIp');
}

export async function cleanDockerPrune(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.cleanDockerPrune', {
    method: 'POST',
    body: {},
  });
}

export async function cleanUnusedImages(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.cleanUnusedImages', {
    method: 'POST',
    body: {},
  });
}

export async function cleanDockerBuilder(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.cleanDockerBuilder', {
    method: 'POST',
    body: {},
  });
}

export async function cleanStoppedContainers(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.cleanStoppedContainers', {
    method: 'POST',
    body: {},
  });
}

export async function readTraefikConfig(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.readTraefikConfig');
}

export async function getWebServerSettings(
  client: DokployClient
): Promise<unknown> {
  return client.request<unknown>('/settings.getWebServerSettings');
}

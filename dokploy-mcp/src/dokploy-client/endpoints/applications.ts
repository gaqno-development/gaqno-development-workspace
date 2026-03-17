import type { DokployClient } from '../client.js';
import type { DokployApplication } from '../types.js';

export async function createApplication(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployApplication> {
  return client.request<DokployApplication>('/application.create', {
    method: 'POST',
    body: data,
  });
}

export async function getApplication(
  client: DokployClient,
  applicationId: string
): Promise<DokployApplication> {
  return client.request<DokployApplication>('/application.one', {
    query: { applicationId },
  });
}

export async function updateApplication(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployApplication> {
  return client.request<DokployApplication>('/application.update', {
    method: 'POST',
    body: data,
  });
}

export async function deployApplication(
  client: DokployClient,
  applicationId: string
): Promise<unknown> {
  return client.request<unknown>('/application.deploy', {
    method: 'POST',
    body: { applicationId },
  });
}

export async function redeployApplication(
  client: DokployClient,
  applicationId: string
): Promise<unknown> {
  return client.request<unknown>('/application.redeploy', {
    method: 'POST',
    body: { applicationId },
  });
}

export async function startApplication(
  client: DokployClient,
  applicationId: string
): Promise<unknown> {
  return client.request<unknown>('/application.start', {
    method: 'POST',
    body: { applicationId },
  });
}

export async function stopApplication(
  client: DokployClient,
  applicationId: string
): Promise<unknown> {
  return client.request<unknown>('/application.stop', {
    method: 'POST',
    body: { applicationId },
  });
}

export async function deleteApplication(
  client: DokployClient,
  applicationId: string
): Promise<unknown> {
  return client.request<unknown>('/application.delete', {
    method: 'POST',
    body: { applicationId },
  });
}

export async function saveEnvironment(
  client: DokployClient,
  data: { applicationId: string; env: string }
): Promise<unknown> {
  return client.request<unknown>('/application.saveEnvironment', {
    method: 'POST',
    body: data,
  });
}

export async function restartApplication(
  client: DokployClient,
  applicationId: string
): Promise<unknown> {
  return client.request<unknown>('/application.restart', {
    method: 'POST',
    body: { applicationId },
  });
}

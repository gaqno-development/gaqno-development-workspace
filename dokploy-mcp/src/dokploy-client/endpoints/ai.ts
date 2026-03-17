import type { DokployClient } from '../client.js';

export async function listAi(client: DokployClient): Promise<unknown[]> {
  return client.request<unknown[]>('/ai.getAll');
}

export async function getAi(
  client: DokployClient,
  aiId: string
): Promise<unknown> {
  return client.request<unknown>('/ai.one', {
    query: { aiId },
  });
}

export async function createAi(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<unknown> {
  return client.request<unknown>('/ai.create', {
    method: 'POST',
    body: data,
  });
}

export async function updateAi(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<unknown> {
  return client.request<unknown>('/ai.update', {
    method: 'POST',
    body: data,
  });
}

export async function deleteAi(
  client: DokployClient,
  aiId: string
): Promise<unknown> {
  return client.request<unknown>('/ai.delete', {
    method: 'POST',
    body: { aiId },
  });
}

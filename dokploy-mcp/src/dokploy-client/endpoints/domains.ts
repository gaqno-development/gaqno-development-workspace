import type { DokployClient } from '../client.js';
import type { DokployDomain } from '../types.js';

export async function createDomain(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployDomain> {
  return client.request<DokployDomain>('/domain.create', {
    method: 'POST',
    body: data,
  });
}

export async function getDomain(
  client: DokployClient,
  domainId: string
): Promise<DokployDomain> {
  return client.request<DokployDomain>('/domain.one', {
    query: { domainId },
  });
}

export async function updateDomain(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployDomain> {
  return client.request<DokployDomain>('/domain.update', {
    method: 'POST',
    body: data,
  });
}

export async function deleteDomain(
  client: DokployClient,
  domainId: string
): Promise<unknown> {
  return client.request<unknown>('/domain.delete', {
    method: 'POST',
    body: { domainId },
  });
}

export async function getDomainsByApplicationId(
  client: DokployClient,
  applicationId: string
): Promise<DokployDomain[]> {
  return client.request<DokployDomain[]>('/domain.byApplicationId', {
    query: { applicationId },
  });
}

export async function generateDomain(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployDomain> {
  return client.request<DokployDomain>('/domain.generate', {
    method: 'POST',
    body: data,
  });
}

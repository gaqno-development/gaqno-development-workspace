import { MASTRA_AUTH_TOKEN_KEY } from '@mastra/core/request-context';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { PORTAL_SERVICE_KEYS, readPortalServiceBaseUrl, type PortalServiceKey } from '../constants/portal-services';
import { assertPathMatchesServiceAllowlist, assertValidPortalResourcePath } from '../lib/portal-service-url';

function readToken(context: { requestContext?: { get: (k: string) => unknown } }): string {
  const raw = context.requestContext?.get(MASTRA_AUTH_TOKEN_KEY);
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  throw new Error(
    'Missing auth token in request context. Forward Authorization Bearer from a trusted gateway or set mastra__authToken in requestContext.',
  );
}

function buildTargetUrl(service: PortalServiceKey, resourcePath: string): URL {
  const baseRaw = readPortalServiceBaseUrl(service);
  if (!baseRaw) {
    throw new Error('Service base URL is not configured for this environment');
  }
  return new URL(resourcePath, baseRaw);
}

export const portalServiceFetchTool = createTool({
  id: 'portal-service-fetch',
  description:
    'GET a JSON or text resource from an allowlisted portal backend (ERP, CRM, Omnichannel, Shop). Requires bearer token in request context and PORTAL_*_BASE_URL env per service.',
  inputSchema: z.object({
    service: z.enum(PORTAL_SERVICE_KEYS).describe('Logical backend'),
    resourcePath: z
      .string()
      .min(1)
      .describe('Path starting with / and matching the allowlist for that service'),
  }),
  outputSchema: z.object({
    status: z.number().int(),
    contentType: z.string(),
    body: z.string(),
  }),
  execute: async (input, context) => {
    const service = input.service;
    assertValidPortalResourcePath(input.resourcePath);
    assertPathMatchesServiceAllowlist(service, input.resourcePath);
    const target = buildTargetUrl(service, input.resourcePath);
    const token = readToken(context);
    const response = await fetch(target.href, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json, text/plain;q=0.9, */*;q=0.8' },
      signal: context.abortSignal,
    });
    const contentType = response.headers.get('content-type') ?? '';
    const body = await response.text();
    return { status: response.status, contentType, body };
  },
});

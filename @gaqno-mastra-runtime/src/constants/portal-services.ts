export const PORTAL_SERVICE_KEYS = ['erp', 'crm', 'omnichannel', 'shop'] as const;

export type PortalServiceKey = (typeof PORTAL_SERVICE_KEYS)[number];

export const PORTAL_SERVICE_ENV_KEYS: Readonly<Record<PortalServiceKey, string>> = {
  erp: 'PORTAL_ERP_BASE_URL',
  crm: 'PORTAL_CRM_BASE_URL',
  omnichannel: 'PORTAL_OMNICHANNEL_BASE_URL',
  shop: 'PORTAL_SHOP_BASE_URL',
} as const;

export const PORTAL_SERVICE_PATH_PREFIXES: Readonly<Record<PortalServiceKey, readonly string[]>> = {
  erp: ['/api/health', '/api/v1/ping'] as const,
  crm: ['/api/health', '/api/v1/ping'] as const,
  omnichannel: ['/api/health', '/api/v1/ping'] as const,
  shop: ['/api/health', '/api/v1/ping'] as const,
} as const;

export function readPortalServiceBaseUrl(service: PortalServiceKey): string | undefined {
  const key = PORTAL_SERVICE_ENV_KEYS[service];
  const raw = process.env[key]?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

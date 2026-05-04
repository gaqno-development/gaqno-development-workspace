import type { PortalServiceKey } from '../constants/portal-services';
import { PORTAL_SERVICE_PATH_PREFIXES } from '../constants/portal-services';

const SAFE_PATH = /^\/[a-zA-Z0-9/_-]*$/;

export function assertValidPortalResourcePath(resourcePath: string): void {
  const trimmed = resourcePath.trim();
  if (trimmed.length === 0) {
    throw new Error('resourcePath must be non-empty');
  }
  if (!trimmed.startsWith('/')) {
    throw new Error('resourcePath must start with /');
  }
  if (trimmed.includes('..')) {
    throw new Error('resourcePath must not contain parent-directory segments');
  }
  if (!SAFE_PATH.test(trimmed)) {
    throw new Error('resourcePath contains invalid characters');
  }
}

export function assertPathMatchesServiceAllowlist(
  service: PortalServiceKey,
  resourcePath: string,
): void {
  const prefixes = PORTAL_SERVICE_PATH_PREFIXES[service];
  const ok = prefixes.some((prefix) => resourcePath === prefix || resourcePath.startsWith(`${prefix}/`));
  if (!ok) {
    throw new Error('resourcePath is not allowed for this service');
  }
}

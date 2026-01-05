export async function getTenantId(): Promise<string | null> {
  return null
}

export async function getTenantContext(): Promise<{ tenantId: string | null; isAdmin: boolean }> {
  return { tenantId: null, isAdmin: false }
}

export function validateTenantAccess(
  userTenantId: string | null | undefined,
  requestedTenantId: string | null | undefined,
  isAdmin: boolean
): boolean {
  if (isAdmin) {
    return true
  }

  if (!userTenantId || !requestedTenantId) {
    return false
  }

  return userTenantId === requestedTenantId
}

export function requireTenantId(tenantId: string | null | undefined): asserts tenantId is string {
  if (!tenantId) {
    throw new Error('Tenant ID is required but not available')
  }
}


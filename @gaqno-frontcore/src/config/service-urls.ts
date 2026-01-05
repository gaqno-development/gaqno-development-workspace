const isClient = typeof window !== 'undefined'

const getViteEnv = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
};

export const SERVICE_URLS = {
  AUTH: isClient 
    ? getViteEnv('VITE_SSO_SERVICE_URL', 'http://localhost:3001')
    : (process.env.AUTH_SERVICE_URL || 'http://localhost:3001'),
  AI: isClient
    ? getViteEnv('VITE_AI_SERVICE_URL', 'http://localhost:3002')
    : (process.env.AI_SERVICE_URL || 'http://localhost:3002'),
  CRM: isClient
    ? getViteEnv('VITE_CRM_SERVICE_URL', 'http://localhost:3003')
    : (process.env.CRM_SERVICE_URL || 'http://localhost:3003'),
  ERP: isClient
    ? getViteEnv('VITE_ERP_SERVICE_URL', 'http://localhost:3004')
    : (process.env.ERP_SERVICE_URL || 'http://localhost:3004'),
  FINANCE: isClient
    ? getViteEnv('VITE_FINANCE_SERVICE_URL', 'http://localhost:3005')
    : (process.env.FINANCE_SERVICE_URL || 'http://localhost:3005'),
  PDV: isClient
    ? getViteEnv('VITE_PDV_SERVICE_URL', 'http://localhost:3006')
    : (process.env.PDV_SERVICE_URL || 'http://localhost:3006'),
  RPG: isClient
    ? getViteEnv('VITE_RPG_SERVICE_URL', 'http://localhost:4007')
    : (process.env.RPG_SERVICE_URL || 'http://localhost:4007'),
} as const;

export const SERVICE_ROUTE_MAP: Record<string, string> = {
  '/dashboard/finance': SERVICE_URLS.FINANCE,
  '/dashboard/crm': SERVICE_URLS.CRM,
  '/dashboard/erp': SERVICE_URLS.ERP,
  '/dashboard/books': SERVICE_URLS.AI,
  '/pdv': SERVICE_URLS.PDV,
};

export const SERVICE_NAMES: Record<string, string> = {
  '/dashboard/finance': 'Finance',
  '/dashboard/crm': 'CRM',
  '/dashboard/erp': 'ERP',
  '/dashboard/books': 'AI/Books', 
  '/pdv': 'PDV',
};

export function getServiceUrl(pathname: string): string | null {
  for (const [route, url] of Object.entries(SERVICE_ROUTE_MAP)) {
    if (pathname.startsWith(route)) {
      return url;
    }
  }
  return null;
}

export function getServiceName(pathname: string): string {
  for (const [route, name] of Object.entries(SERVICE_NAMES)) {
    if (pathname.startsWith(route)) {
      return name;
    }
  }
  return 'serviço';
}


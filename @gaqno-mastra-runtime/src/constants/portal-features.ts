export interface IPortalFeatureAction {
  readonly label: string;
  readonly route: string;
}

export interface IPortalFeature {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly aliases: readonly string[];
  readonly actions: readonly IPortalFeatureAction[];
}

export const PORTAL_FEATURES: readonly IPortalFeature[] = [
  {
    id: 'ai-studio',
    label: 'AI Studio',
    description: 'Geração de vídeos, imagens, áudio, livros e pipelines com IA generativa.',
    route: '/ai/studio',
    aliases: ['ia', 'studio', 'criar conteúdo', 'video ai', 'imagem ai'],
    actions: [
      { label: 'Criar novo projeto', route: '/ai/studio/new' },
      { label: 'Templates', route: '/ai/studio/templates' },
      { label: 'Pipelines', route: '/ai/studio/pipeline' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Gestão de clientes, leads, vendas, contratos e atendimento comercial.',
    route: '/crm/dashboard/overview',
    aliases: ['crm', 'vendas', 'clientes', 'leads', 'deals'],
    actions: [
      { label: 'Leads', route: '/crm/sales/leads' },
      { label: 'Clientes', route: '/crm/customers/accounts' },
      { label: 'Faturamento', route: '/crm/finance/invoices' },
    ],
  },
  {
    id: 'erp',
    label: 'ERP',
    description: 'Catálogo de produtos, estoque, pedidos, fornecedores e logística.',
    route: '/erp/dashboard',
    aliases: ['erp', 'estoque', 'produtos', 'pedidos', 'compras'],
    actions: [
      { label: 'Catálogo', route: '/erp/catalog' },
      { label: 'Pedidos', route: '/erp/orders' },
      { label: 'Estoque', route: '/erp/inventory' },
      { label: 'Fornecedores', route: '/erp/suppliers' },
    ],
  },
  {
    id: 'finance',
    label: 'Financeiro',
    description: 'Contas a pagar, contas a receber, conciliação e relatórios financeiros.',
    route: '/finance',
    aliases: ['finance', 'financeiro', 'contas', 'caixa'],
    actions: [],
  },
  {
    id: 'pdv',
    label: 'PDV',
    description: 'Ponto de venda para operações de balcão e e-commerce.',
    route: '/pdv',
    aliases: ['pdv', 'caixa', 'ponto de venda', 'pos'],
    actions: [],
  },
  {
    id: 'omnichannel',
    label: 'Omnichannel',
    description: 'Inbox unificado de WhatsApp, e-mail e redes sociais com gestão de tickets.',
    route: '/omnichannel/inbox',
    aliases: ['omnichannel', 'mensagens', 'whatsapp', 'inbox', 'atendimento'],
    actions: [],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    description: 'Acompanhamento de hábitos, metas e bem-estar do time.',
    route: '/wellness/today',
    aliases: ['wellness', 'bem-estar', 'saúde'],
    actions: [],
  },
  {
    id: 'intelligence',
    label: 'Intelligence (BI)',
    description: 'Painéis analíticos, KPIs e relatórios cross-domain.',
    route: '/intelligence/analytics',
    aliases: ['bi', 'business intelligence', 'analytics', 'relatórios'],
    actions: [],
  },
  {
    id: 'consumer',
    label: 'Consumer',
    description: 'Portal de consumo e experiência do cliente final.',
    route: '/consumer/dashboard',
    aliases: ['consumer', 'cliente', 'portal cliente'],
    actions: [],
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Administração da organização: tenants, branches, usuários e configurações.',
    route: '/admin/dashboard',
    aliases: ['admin', 'configurações', 'organização', 'usuários'],
    actions: [
      { label: 'Tenants', route: '/admin/organization/tenants' },
      { label: 'Custos', route: '/admin/costing' },
      { label: 'Configurações', route: '/admin/settings' },
    ],
  },
  {
    id: 'shop-admin',
    label: 'Loja Admin',
    description: 'Administração de loja online (catálogo, pedidos da loja).',
    route: '/shop-admin',
    aliases: ['loja', 'shop admin', 'ecommerce'],
    actions: [],
  },
];

export const PORTAL_FEATURE_ROUTE_PREFIXES: readonly string[] = PORTAL_FEATURES.map((feature) => {
  const segments = feature.route.split('/').filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : feature.route;
});

export function findPortalFeatureForRoute(route: string): IPortalFeature | undefined {
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return PORTAL_FEATURES.find((feature) => {
    if (normalized === feature.route) return true;
    const prefix = `/${feature.route.split('/').filter(Boolean)[0] ?? ''}`;
    return prefix !== '/' && normalized.startsWith(prefix);
  });
}

export function isAllowedPortalRoute(route: string): boolean {
  if (typeof route !== 'string') return false;
  if (!route.startsWith('/')) return false;
  if (route.includes('..')) return false;
  if (route.length > 200) return false;
  return PORTAL_FEATURE_ROUTE_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

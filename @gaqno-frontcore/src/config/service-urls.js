const SERVICE_URLS = {
  AUTH: process.env.SERVICE_SSO_URL || 'http://localhost:3001',
  AI: process.env.SERVICE_AI_URL || 'http://localhost:3002',
  CRM: process.env.SERVICE_CRM_URL || 'http://localhost:3003',
  ERP: process.env.SERVICE_ERP_URL || 'http://localhost:3004',
  FINANCE: process.env.SERVICE_FINANCE_URL || 'http://localhost:3005',
  PDV: process.env.SERVICE_PDV_URL || 'http://localhost:3006',
  RPG: process.env.SERVICE_RPG_URL || 'http://localhost:4007',
};

module.exports = { SERVICE_URLS };


const SERVICE_URLS = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  AI: process.env.AI_SERVICE_URL || 'http://localhost:3003',
  CRM: process.env.CRM_SERVICE_URL || 'http://localhost:3004',
  ERP: process.env.ERP_SERVICE_URL || 'http://localhost:3005',
  FINANCE: process.env.FINANCE_SERVICE_URL || 'http://localhost:3006',
  PDV: process.env.PDV_SERVICE_URL || 'http://localhost:3008',
};

module.exports = { SERVICE_URLS };


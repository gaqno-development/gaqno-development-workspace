#!/usr/bin/env node
/**
 * Gera .env.monitoring com POSTGRES_EXPORTER_* a partir de DATABASE_URL.
 * Uso: node scripts/configure-postgres-exporter-env.mjs [DATABASE_URL]
 *      ou: DATABASE_URL='postgresql://...' node scripts/configure-postgres-exporter-env.mjs
 *
 * DATABASE_URL pode ser obtido no Coolify via MCP (env_vars da aplicação gaqno-sso-service).
 */

import fs from 'fs';
import path from 'path';

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
  console.error('Uso: node scripts/configure-postgres-exporter-env.mjs <DATABASE_URL>');
  console.error('  ou: DATABASE_URL=\'postgresql://user:pass@host:port/db\' node scripts/configure-postgres-exporter-env.mjs');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(url);
} catch (e) {
  console.error('DATABASE_URL inválido:', e.message);
  process.exit(1);
}

const host = parsed.hostname;
const port = parsed.port || '5432';
const database = parsed.pathname.slice(1).replace(/\/.*$/, '') || 'postgres';
const user = parsed.username || 'postgres';
const password = parsed.password || '';

const uri = `${host}:${port}/${database}?sslmode=disable`;

const content = `# Gerado por scripts/configure-postgres-exporter-env.mjs - não commitar
POSTGRES_EXPORTER_URI=${uri}
POSTGRES_EXPORTER_USER=${user}
POSTGRES_EXPORTER_PASS=${password}
`;

const outPath = path.join(process.cwd(), '.env.monitoring');
fs.writeFileSync(outPath, content, 'utf8');
console.log('Escrito em .env.monitoring');
console.log('Subir o stack: docker compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d');

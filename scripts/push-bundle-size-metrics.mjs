#!/usr/bin/env node
/**
 * Collects Vite (and other frontend) bundle sizes from workspace dist/ folders
 * and pushes them to Prometheus Pushgateway for the Front dashboard.
 *
 * Usage: PROMETHEUS_PUSHGATEWAY_URL=https://... node scripts/push-bundle-size-metrics.mjs
 * Run after: npm run build (or turbo run build)
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function dirSize(dirPath) {
  let total = 0;
  try {
    for (const name of readdirSync(dirPath)) {
      const full = join(dirPath, name);
      const st = statSync(full);
      if (st.isDirectory()) total += dirSize(full);
      else total += st.size;
    }
  } catch {
    // ignore missing or unreadable
  }
  return total;
}

function main() {
  const pushgatewayUrl = process.env.PROMETHEUS_PUSHGATEWAY_URL?.replace(/\/$/, '');
  if (!pushgatewayUrl) {
    console.log('PROMETHEUS_PUSHGATEWAY_URL not set, skipping bundle size push');
    process.exit(0);
  }

  const pkg = readJson(join(root, 'package.json'));
  const workspaces = Array.isArray(pkg.workspaces) ? pkg.workspaces : [];
  const metrics = [];

  for (const ws of workspaces) {
    const dir = join(root, ws.replace(/\*$/, ''));
    const dist = join(dir, 'dist');
    try {
      statSync(dist);
    } catch {
      continue;
    }
    const app = ws.split('/').pop() || ws;
    if (!app.endsWith('-ui')) continue;
    const size = dirSize(dist);
    metrics.push({ app, size });
  }

  if (metrics.length === 0) {
    console.log('No *-ui dist/ folders found. Run build first.');
    process.exit(0);
  }

  const body = [
    '# TYPE frontend_bundle_size_bytes gauge',
    ...metrics.map(({ app, size }) => `frontend_bundle_size_bytes{app="${app}",job="frontend-bundle"} ${size}`),
  ].join('\n');

  const url = `${pushgatewayUrl}/metrics/job/frontend-bundle/instance/ci`;
  const res = fetch(url, { method: 'POST', body });
  if (!res.ok) {
    console.error('Pushgateway error:', res.status, await res.text());
    process.exit(1);
  }
  console.log('Pushed bundle size metrics:', metrics.map(({ app, size }) => `${app}=${(size / 1024).toFixed(1)}KB`).join(', '));
}

main();

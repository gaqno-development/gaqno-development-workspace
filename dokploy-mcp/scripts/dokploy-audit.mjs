import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadCreds() {
  const fromEnv = process.env.DOKPLOY_BASE_URL && process.env.DOKPLOY_API_KEY;
  if (fromEnv) {
    return {
      baseUrl: process.env.DOKPLOY_BASE_URL.replace(/\/$/, ''),
      apiKey: process.env.DOKPLOY_API_KEY,
    };
  }
  const arg = process.argv.find((a) => a.startsWith('--mcp-json='));
  const mcpPath = arg
    ? arg.slice('--mcp-json='.length)
    : path.join(__dirname, '../../.cursor/mcp.json');
  const raw = fs.readFileSync(mcpPath, 'utf8');
  const j = JSON.parse(raw);
  const env = j.mcpServers?.['dokploy-mcp']?.env;
  if (!env?.DOKPLOY_BASE_URL || !env?.DOKPLOY_API_KEY) {
    throw new Error('Set DOKPLOY_BASE_URL and DOKPLOY_API_KEY or use --mcp-json= pointing at mcp.json with dokploy-mcp.env');
  }
  return { baseUrl: env.DOKPLOY_BASE_URL.replace(/\/$/, ''), apiKey: env.DOKPLOY_API_KEY };
}

async function req(baseUrl, apiKey, endpoint, opts = {}) {
  const url = new URL(baseUrl + endpoint);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v);
    }
  }
  const r = await fetch(url.toString(), {
    method: opts.method || 'GET',
    headers: {
      'x-api-key': apiKey,
      accept: 'application/json',
      ...(opts.body ? { 'content-type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!r.ok) {
    throw new Error(`${endpoint} HTTP ${r.status}: ${typeof data === 'string' ? data : JSON.stringify(data).slice(0, 800)}`);
  }
  return data;
}

function statusRisk(s) {
  if (!s) return { level: 0, note: '' };
  const t = String(s).toLowerCase();
  if (/running|healthy|done|success|idle|completed/.test(t) && !/unhealthy/.test(t)) {
    return { level: 0, note: '' };
  }
  if (/error|fail|unhealthy|crash|exited|stopped|cancel|canceled|unknown/.test(t)) {
    return { level: 2, note: 'bad-status' };
  }
  if (/deploy|build|pending|progress|starting|restarting|waiting/.test(t)) {
    return { level: 1, note: 'in-progress' };
  }
  return { level: 1, note: 'check' };
}

function deploymentRisk(d) {
  const st = (d.status || '').toLowerCase();
  const title = (d.title || '').toLowerCase();
  if (/error|fail|cancel/.test(st)) return { level: 2, note: `deployment:${d.status}` };
  if (title.includes('error') || title.includes('fail')) return { level: 2, note: `title:${(d.title || '').slice(0, 80)}` };
  return { level: 0, note: '' };
}

function recentFailureLoop(deployments, windowMs) {
  const now = Date.now();
  const recent = deployments.filter((d) => {
    const t = d.createdAt ? new Date(d.createdAt).getTime() : 0;
    return now - t < windowMs;
  });
  const fails = recent.filter((d) => {
    const st = (d.status || '').toLowerCase();
    return /error|fail|cancel/.test(st);
  });
  if (fails.length >= 4) return { loop: true, fails: fails.length, window: '24h' };
  return { loop: false, fails: fails.length, window: '24h' };
}

async function main() {
  const { baseUrl, apiKey } = loadCreds();

  const projects = await req(baseUrl, apiKey, '/project.all');
if (!Array.isArray(projects)) {
  console.error('Unexpected /project.all shape:', typeof projects);
  process.exit(1);
}

const apps = [];
for (const proj of projects) {
  const pname = proj.name || proj.projectId || '?';
  for (const a of proj.applications || []) {
    apps.push({
      kind: 'application',
      project: pname,
      name: a.name || a.appName || '?',
      id: a.applicationId,
      status: a.applicationStatus,
      source: a.sourceType || a.repository || '-',
    });
  }
  for (const c of proj.compose || []) {
    apps.push({
      kind: 'compose',
      project: pname,
      name: `${c.name || c.appName || '?'} (compose)`,
      id: c.composeId,
      status: c.applicationStatus,
      source: c.sourceType || '-',
    });
  }
}

console.log(`Dokploy audit — ${apps.length} app/compose rows across ${projects.length} projects\n`);

const issues = [];

for (const row of apps) {
  const sr = statusRisk(row.status);
  if (sr.level >= 2) {
    issues.push({ row, type: 'resource-status', detail: sr.note });
  }
}

const deploymentSamples = [];
for (const row of apps) {
  if (row.kind !== 'application' || !row.id) continue;
  try {
    const deps = await req(baseUrl, apiKey, '/deployment.all', { query: { applicationId: row.id } });
    if (!Array.isArray(deps) || deps.length === 0) {
      deploymentSamples.push({ row, deps: [], empty: true });
      continue;
    }
    const sorted = [...deps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latest = sorted[0];
    const dr = deploymentRisk(latest);
    const loop = recentFailureLoop(sorted, 24 * 60 * 60 * 1000);
    deploymentSamples.push({ row, deps: sorted, latest, dr, loop });
    if (dr.level >= 2) {
      issues.push({ row, type: 'deployment', detail: dr.note });
    }
    if (loop.loop) {
      issues.push({ row, type: 'possible-loop', detail: `${loop.fails} failed deployments in ${loop.window}` });
    }
  } catch (e) {
    issues.push({ row, type: 'api-error', detail: e.message });
  }
}

console.log('=== Resource status (application / compose) ===\n');
for (const row of apps) {
  const sr = statusRisk(row.status);
  const mark = sr.level >= 2 ? ' [!]' : sr.level === 1 ? ' [?]' : '';
  console.log(`${row.project} / ${row.name}${mark}`);
  console.log(`  status=${row.status ?? 'n/a'}  ${row.kind}  id=${row.id ?? 'n/a'}`);
}

console.log('\n=== Latest deployment per application ===\n');
for (const s of deploymentSamples) {
  if (s.empty) {
    console.log(`${s.row.name}: no deployments`);
    continue;
  }
  const { latest, dr, loop } = s;
  const mark = dr.level >= 2 || loop.loop ? ' [!]' : '';
  console.log(`${s.row.name}: ${latest.status ?? 'n/a'}${mark} (${latest.createdAt || ''})`);
  if (latest.title) console.log(`  title: ${latest.title}`);
  if (loop.loop) console.log(`  note: ${loop.fails} failures in ${loop.window} (possible restart loop)`);
}

const uniqIssues = issues.filter((x, i, arr) => {
  const k = `${x.type}:${x.row?.name}:${x.detail}`;
  return arr.findIndex((y) => `${y.type}:${y.row?.name}:${y.detail}` === k) === i;
});

console.log('\n=== Summary: items needing attention ===\n');
if (uniqIssues.length === 0) {
  console.log('None flagged by status/deployment heuristics.');
} else {
  for (const it of uniqIssues) {
    console.log(`- ${it.row.project} / ${it.row.name}: [${it.type}] ${it.detail}`);
  }
}
}

main().catch((err) => {
  console.error(err.message || err);
  if (String(err?.cause?.code || '').includes('CONNECT') || String(err?.message || '').includes('fetch failed')) {
    console.error('\nHint: ensure this machine can reach DOKPLOY_BASE_URL (VPN/firewall). Run from a network that can open the Dokploy API.');
  }
  process.exit(1);
});

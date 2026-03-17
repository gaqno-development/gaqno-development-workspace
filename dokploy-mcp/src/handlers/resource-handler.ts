import type { DokployClient } from '../dokploy-client/client.js';
import { listProjects, getProject } from '../dokploy-client/endpoints/projects.js';
import { getApplication } from '../dokploy-client/endpoints/applications.js';
import { getDomain } from '../dokploy-client/endpoints/domains.js';
import type {
  DokployProject,
  DokployApplication,
  DokployDomain,
} from '../dokploy-client/types.js';

interface ParsedUri {
  pattern: string;
  params: Record<string, string>;
}

function parseUri(uri: string): ParsedUri {
  if (uri === 'dokploy://projects' || uri === 'dokploy://applications' || uri === 'dokploy://databases') {
    return { pattern: uri, params: {} };
  }
  const projectMatch = uri.match(/^dokploy:\/\/project\/(.+)$/);
  if (projectMatch) {
    return { pattern: 'dokploy://project/{projectId}', params: { projectId: projectMatch[1] } };
  }
  const applicationMatch = uri.match(/^dokploy:\/\/application\/(.+)$/);
  if (applicationMatch) {
    return { pattern: 'dokploy://application/{applicationId}', params: { applicationId: applicationMatch[1] } };
  }
  const domainMatch = uri.match(/^dokploy:\/\/domain\/(.+)$/);
  if (domainMatch) {
    return { pattern: 'dokploy://domain/{domainId}', params: { domainId: domainMatch[1] } };
  }
  throw new Error(`Unknown resource URI: ${uri}`);
}

function formatTable(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  lines.push('| ' + headers.join(' | ') + ' |');
  lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');
  for (const row of rows) {
    lines.push('| ' + row.join(' | ') + ' |');
  }
  return lines.join('\n');
}

function safeStr(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v);
}

export async function handleResourceRead(
  client: DokployClient,
  uri: string
): Promise<string> {
  const { pattern, params } = parseUri(uri);

  if (pattern === 'dokploy://projects') {
    const projects = await listProjects(client);
    const rows = projects.map((p) => [
      safeStr(p.name),
      safeStr(p.projectId),
      String(p.applications?.length ?? 0),
      String(
        (p.mysql?.length ?? 0) +
          (p.postgres?.length ?? 0) +
          (p.redis?.length ?? 0) +
          (p.mariadb?.length ?? 0) +
          (p.mongo?.length ?? 0)
      ),
      safeStr(p.createdAt),
    ]);
    return formatTable(['Name', 'ID', 'Apps', 'DBs', 'Created'], rows);
  }

  if (pattern === 'dokploy://applications') {
    const projects = await listProjects(client);
    const apps: { app: DokployApplication; projectName: string }[] = [];
    for (const p of projects) {
      for (const app of p.applications ?? []) {
        apps.push({ app, projectName: safeStr(p.name) });
      }
    }
    const rows = apps.map(({ app, projectName }) => [
      safeStr(app.name ?? app.appName),
      safeStr(app.applicationStatus),
      projectName,
      safeStr(app.sourceType ?? app.repository ?? '-'),
      safeStr(app.createdAt),
    ]);
    return formatTable(['Name', 'Status', 'Project', 'Source', 'Created'], rows);
  }

  if (pattern === 'dokploy://databases') {
    const projects = await listProjects(client);
    const dbs: { name: string; type: string; status: string; project: string; createdAt: string }[] = [];
    for (const p of projects) {
      const projectName = safeStr(p.name);
      const add = (
        items: Array<{ name?: string; appName?: string; applicationStatus?: string; createdAt?: string }> | undefined,
        type: string
      ) => {
        for (const item of items ?? []) {
          dbs.push({
            name: safeStr(item.name ?? item.appName),
            type,
            status: safeStr(item.applicationStatus),
            project: projectName,
            createdAt: safeStr(item.createdAt),
          });
        }
      };
      add(p.mysql, 'MySQL');
      add(p.postgres, 'PostgreSQL');
      add(p.redis, 'Redis');
      add(p.mariadb, 'MariaDB');
      add(p.mongo, 'MongoDB');
    }
    const rows = dbs.map((db) => [db.name, db.type, db.status, db.project, db.createdAt]);
    return formatTable(['Name', 'Type', 'Status', 'Project', 'Created'], rows);
  }

  if (pattern === 'dokploy://project/{projectId}') {
    const project = await getProject(client, params.projectId);
    return formatProjectDetail(project);
  }

  if (pattern === 'dokploy://application/{applicationId}') {
    const app = await getApplication(client, params.applicationId);
    return formatApplicationDetail(app);
  }

  const domain = await getDomain(client, params.domainId);
  return formatDomainDetail(domain);
}

function formatProjectDetail(p: DokployProject): string {
  const lines: string[] = [];
  lines.push(`# ${safeStr(p.name)}`);
  lines.push('');
  if (p.description) lines.push(safeStr(p.description));
  lines.push('');
  lines.push(`**Project ID:** ${safeStr(p.projectId)}`);
  lines.push(`**Created:** ${safeStr(p.createdAt)}`);
  lines.push('');

  const apps = p.applications ?? [];
  if (apps.length > 0) {
    lines.push('## Applications');
    lines.push('');
    lines.push(
      formatTable(
        ['Name', 'Status', 'Source', 'Created'],
        apps.map((a) => [safeStr(a.name ?? a.appName), safeStr(a.applicationStatus), safeStr(a.sourceType ?? a.repository ?? '-'), safeStr(a.createdAt)])
      )
    );
    lines.push('');
  }

  const mysql = p.mysql ?? [];
  if (mysql.length > 0) {
    lines.push('## MySQL');
    lines.push('');
    lines.push(formatTable(['Name', 'Status', 'Created'], mysql.map((m) => [safeStr(m.name ?? m.appName), safeStr(m.applicationStatus), safeStr(m.createdAt)])));
    lines.push('');
  }

  const postgres = p.postgres ?? [];
  if (postgres.length > 0) {
    lines.push('## PostgreSQL');
    lines.push('');
    lines.push(formatTable(['Name', 'Status', 'Created'], postgres.map((m) => [safeStr(m.name ?? m.appName), safeStr(m.applicationStatus), safeStr(m.createdAt)])));
    lines.push('');
  }

  const redis = p.redis ?? [];
  if (redis.length > 0) {
    lines.push('## Redis');
    lines.push('');
    lines.push(formatTable(['Name', 'Status', 'Created'], redis.map((m) => [safeStr(m.name ?? m.appName), safeStr(m.applicationStatus), safeStr(m.createdAt)])));
    lines.push('');
  }

  const mariadb = p.mariadb ?? [];
  if (mariadb.length > 0) {
    lines.push('## MariaDB');
    lines.push('');
    lines.push(formatTable(['Name', 'Status', 'Created'], mariadb.map((m) => [safeStr(m.name ?? m.appName), safeStr(m.applicationStatus), safeStr(m.createdAt)])));
    lines.push('');
  }

  const mongo = p.mongo ?? [];
  if (mongo.length > 0) {
    lines.push('## MongoDB');
    lines.push('');
    lines.push(formatTable(['Name', 'Status', 'Created'], mongo.map((m) => [safeStr(m.name ?? m.appName), safeStr(m.applicationStatus), safeStr(m.createdAt)])));
    lines.push('');
  }

  return lines.join('\n');
}

function formatApplicationDetail(app: DokployApplication): string {
  const entries: [string, string][] = [
    ['Application ID', safeStr(app.applicationId)],
    ['Name', safeStr(app.name ?? app.appName)],
    ['Description', safeStr(app.description)],
    ['Status', safeStr(app.applicationStatus)],
    ['Project ID', safeStr(app.projectId)],
    ['Docker Image', safeStr(app.dockerImage)],
    ['Source Type', safeStr(app.sourceType)],
    ['Repository', safeStr(app.repository)],
    ['Branch', safeStr(app.branch)],
    ['Build Path', safeStr(app.buildPath)],
    ['Memory Limit', safeStr(app.memoryLimit)],
    ['Memory Reservation', safeStr(app.memoryReservation)],
    ['CPU Limit', safeStr(app.cpuLimit)],
    ['CPU Reservation', safeStr(app.cpuReservation)],
    ['Auto Deploy', safeStr(app.autoDeploy)],
    ['Owner', safeStr(app.owner)],
    ['Created', safeStr(app.createdAt)],
  ];
  const lines: string[] = [`# ${safeStr(app.name ?? app.appName)}`, ''];
  for (const [k, v] of entries) {
    if (v) lines.push(`**${k}:** ${v}`);
  }
  return lines.join('\n');
}

function formatDomainDetail(d: DokployDomain): string {
  const entries: [string, string][] = [
    ['Domain ID', safeStr(d.domainId)],
    ['Host', safeStr(d.host)],
    ['Path', safeStr(d.path)],
    ['Port', safeStr(d.port)],
    ['HTTPS', safeStr(d.https)],
    ['Certificate Type', safeStr(d.certificateType)],
    ['Application ID', safeStr(d.applicationId)],
    ['Created', safeStr(d.createdAt)],
  ];
  const lines: string[] = [`# Domain: ${safeStr(d.host)}${d.path ? safeStr(d.path) : ''}`, ''];
  for (const [k, v] of entries) {
    if (v) lines.push(`**${k}:** ${v}`);
  }
  return lines.join('\n');
}

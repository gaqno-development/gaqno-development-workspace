#!/usr/bin/env node
/**
 * Generate an HTML report with Epic progress (issues per Epic, status breakdown).
 * Output: docs/jira/epics-progress.html (open in browser to visualize).
 *
 * Usage: node scripts/jira-epics-progress.mjs [--project=PROJ]
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira or .env)
 */

import fs from "fs";
import path from "path";

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m)
      process.env[m[1]] = m[2]
        .trim()
        .replace(/^["']|["',]+$/g, "")
        .trim();
  }
}
loadEnvFile(".env.jira");
loadEnvFile(".env");

const JIRA_URL = (process.env.JIRA_URL || "https://gaqno.atlassian.net")
  .trim()
  .replace(/["',]+$/g, "")
  .replace(/\/$/, "");
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const PROJECT_KEY =
  process.argv.find((a) => a.startsWith("--project="))?.split("=")[1] ||
  process.env.JIRA_PROJECT_KEY ||
  "GAQNO";

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString(
  "base64"
);

async function jira(pathname, opts = {}) {
  const res = await fetch(`${JIRA_URL}${pathname}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
      ...opts.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function searchJql(jql, fields = ["key", "status"], maxResults = 100) {
  const list = [];
  let nextPageToken;
  let data;
  do {
    const body = { jql, maxResults, fields };
    if (nextPageToken) body.nextPageToken = nextPageToken;
    data = await jira("/rest/api/3/search/jql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    for (const issue of data.issues || []) {
      const o = { key: issue.key, status: issue.fields?.status?.name || "Unknown" };
      if (issue.fields?.summary != null) o.summary = issue.fields.summary;
      list.push(o);
    }
    nextPageToken = data?.nextPageToken;
  } while (nextPageToken && !data?.isLast);
  return list;
}

function countByStatus(issues) {
  const byStatus = {};
  for (const i of issues) {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  }
  return byStatus;
}

function renderHtml(epicsWithProgress, generatedAt) {
  const doneNames = new Set(["Feito", "Done", "Concluído", "Resolvido", "Closed"]);
  const rows = epicsWithProgress
    .map((e) => {
      const total = e.total;
      const done = e.issues.filter((i) => doneNames.has(i.status)).length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const statusCells = Object.entries(e.byStatus)
        .sort((a, b) => b[1] - a[1])
        .map(([s, n]) => `${s}: ${n}`)
        .join(" · ");
      const link = `${JIRA_URL}/browse/${e.key}`;
      const jqlLink = `${JIRA_URL}/issues/?jql=project%3D${PROJECT_KEY}%20AND%20%22Epic%20Link%22%3D${e.key}`;
      return `
        <tr>
          <td><a href="${link}">${e.key}</a></td>
          <td>${e.summary}</td>
          <td>${e.total}</td>
          <td><progress value="${done}" max="${total}" title="${done}/${total}"></progress> ${pct}%</td>
          <td class="statuses">${statusCells}</td>
          <td><a href="${jqlLink}">Ver issues</a></td>
        </tr>`;
    })
    .join("");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PROJ – Avanço dos Épicos</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1rem 2rem; background: #f5f5f5; }
    h1 { color: #172b4d; }
    .meta { color: #6b778c; font-size: 0.9rem; margin-bottom: 1rem; }
    table { border-collapse: collapse; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08); border-radius: 8px; overflow: hidden; }
    th, td { padding: 0.6rem 1rem; text-align: left; }
    th { background: #172b4d; color: #fff; }
    tr:nth-child(even) { background: #fafafa; }
    a { color: #0052cc; }
    progress { width: 120px; height: 1rem; vertical-align: middle; }
    .statuses { font-size: 0.85rem; color: #6b778c; }
  </style>
</head>
<body>
  <h1>PROJ – Avanço dos Épicos</h1>
  <p class="meta">Gerado em ${generatedAt}. Atualize com: <code>node scripts/jira-epics-progress.mjs</code></p>
  <table>
    <thead><tr><th>Épico</th><th>Resumo</th><th>Total</th><th>Progresso</th><th>Por status</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }
  const epics = await searchJql(
    `project = ${PROJECT_KEY} AND issuetype = Epic ORDER BY key ASC`,
    ["key", "summary", "status"],
    50
  );
  const epicsWithProgress = [];
  for (const epic of epics) {
    const issues = await searchJql(
      `project = ${PROJECT_KEY} AND "Epic Link" = ${epic.key}`,
      ["key", "status"],
      500
    );
    epicsWithProgress.push({
      key: epic.key,
      summary: epic.summary || epic.key,
      total: issues.length,
      issues,
      byStatus: countByStatus(issues),
    });
  }
  const outPath = path.join(
    process.cwd(),
    "docs",
    "jira",
    "epics-progress.html"
  );
  const html = renderHtml(
    epicsWithProgress,
    new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`Written: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Create a Jira filter (Epics PROJ) and a dashboard to visualize Epic progress.
 * User adds "Filter Results" gadget manually and selects the created filter.
 *
 * Usage: node scripts/jira-create-epics-dashboard.mjs [--project=PROJ]
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

async function getProjectId(key) {
  const p = await jira(`/rest/api/3/project/${key}`);
  return p.id;
}

async function createFilter(name, jql, description, projectId) {
  return jira("/rest/api/3/filter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      jql,
      description,
      favourite: true,
      sharePermissions: projectId
        ? [{ type: "project", project: { id: projectId } }]
        : [],
    }),
  });
}

async function createDashboard(name, description, projectId) {
  return jira("/rest/api/3/dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description,
      sharePermissions: projectId
        ? [{ type: "project", project: { id: projectId } }]
        : [],
      editPermissions: [],
    }),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  const filterJql = `project = ${PROJECT_KEY} AND issuetype = Epic ORDER BY status ASC, updated DESC`;
  const filterName = `${PROJECT_KEY} – Épicos (avanço)`;
  const filterDesc = "Lista de épicos do projeto para acompanhamento de avanço.";

  const dashboardName = `Avanço dos Épicos – ${PROJECT_KEY}`;
  const dashboardDesc = `Dashboard para visualizar o avanço dos épicos do projeto ${PROJECT_KEY}. Adicione o gadget "Resultados de filtro" e selecione o filtro "${filterName}".`;

  console.log(`Project: ${PROJECT_KEY}\n`);

  const projectId = await getProjectId(PROJECT_KEY);
  const filter = await createFilter(filterName, filterJql, filterDesc, projectId);
  console.log(`Filter created: ${filter.name}`);
  console.log(`  ID: ${filter.id}`);
  console.log(`  View: ${filter.viewUrl}\n`);

  const dashboard = await createDashboard(
    dashboardName,
    dashboardDesc,
    projectId
  );
  console.log(`Dashboard created: ${dashboard.name}`);
  console.log(`  ID: ${dashboard.id}`);
  const dashboardUrl =
    dashboard.view?.startsWith("http")
      ? dashboard.view
      : `${JIRA_URL}${dashboard.view?.startsWith("/") ? "" : "/"}${dashboard.view || `secure/Dashboard.jspa?selectPageId=${dashboard.id}`}`;
  console.log(`  View: ${dashboardUrl}\n`);

  console.log("Next step (in Jira UI):");
  console.log("  1. Open the dashboard link above.");
  console.log("  2. Click \"Add gadget\" → \"Filter Results\".");
  console.log(`  3. Select the filter \"${filterName}\" (ID ${filter.id}).`);
  console.log("  4. Set columns (e.g. Key, Summary, Status, Assignee) and save.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

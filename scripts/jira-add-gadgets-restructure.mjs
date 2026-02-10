#!/usr/bin/env node
/**
 * Adds Filter Results gadgets to [GAQNO] Dashboard Produto/PO, Engenharia, Tech Lead, Gestão.
 * Uses restructure filters ([PLANEJAMENTO], [EXECUÇÃO], [ACOMPANHAMENTO]) and existing role filters.
 * Run after jira-restructure-navigation-filters.mjs and jira-create-proj-filters-dashboards.mjs. Idempotent.
 *
 * Usage: node scripts/jira-add-gadgets-restructure.mjs [--project=GAQNO]
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

const FILTER_RESULTS_URI =
  "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:filter-results-gadget/gadgets/filter-results-gadget.xml";

const DASHBOARD_FILTER_NAMES = {
  [`[${PROJECT_KEY}] Dashboard Produto / PO`]: [
    `[${PROJECT_KEY}] [PLANEJAMENTO] Epics Ativos`,
    `[${PROJECT_KEY}] [PLANEJAMENTO] Backlog Prioritário`,
    `[${PROJECT_KEY}] Produto – Histórias por status`,
  ],
  [`[${PROJECT_KEY}] Dashboard Engenharia`]: [
    `[${PROJECT_KEY}] Engenharia – Minhas issues`,
    `[${PROJECT_KEY}] [EXECUÇÃO] Sprint Atual`,
    `[${PROJECT_KEY}] [EXECUÇÃO] Historias em Progresso`,
    `[${PROJECT_KEY}] Engenharia – Com PR aberta`,
  ],
  [`[${PROJECT_KEY}] Dashboard Tech Lead`]: [
    `[${PROJECT_KEY}] Tech Lead – Bugs abertos`,
    `[${PROJECT_KEY}] [ACOMPANHAMENTO] Bugs Críticos`,
    `[${PROJECT_KEY}] Tech Lead – Sem atividade 7d`,
  ],
  [`[${PROJECT_KEY}] Dashboard Gestão`]: [
    `[${PROJECT_KEY}] Liderança – Épicos por status`,
    `[${PROJECT_KEY}] [ACOMPANHAMENTO] Incidentes Abertos`,
    `[${PROJECT_KEY}] Liderança – Resumo issues`,
  ],
};

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

async function jiraText(pathname, opts = {}) {
  const res = await fetch(`${JIRA_URL}${pathname}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
      ...opts.headers,
    },
  });
  return res;
}

async function searchFilters() {
  const data = await jira(
    `/rest/api/3/filter/search?filterName=${encodeURIComponent(PROJECT_KEY)}&maxResults=100`
  );
  const list = data.values ?? data.results ?? [];
  const byName = {};
  for (const f of list) {
    if (f.name?.startsWith(`[${PROJECT_KEY}]`)) byName[f.name] = f.id;
  }
  return byName;
}

async function searchDashboards() {
  const data = await jira(
    `/rest/api/3/dashboard/search?dashboardName=${encodeURIComponent(PROJECT_KEY)}&maxResults=50`
  );
  const list = data.values ?? [];
  return list.filter(
    (d) =>
      d.name?.startsWith(`[${PROJECT_KEY}]`) && d.name?.includes("Dashboard ")
  );
}

async function getGadgets(dashboardId) {
  try {
    const data = await jira(`/rest/api/3/dashboard/${dashboardId}/gadget`);
    return data.gadgets ?? [];
  } catch {
    return [];
  }
}

async function addGadget(dashboardId, title, position) {
  return jira(`/rest/api/3/dashboard/${dashboardId}/gadget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uri: FILTER_RESULTS_URI,
      title,
      position: { row: position.row, column: position.column },
    }),
  });
}

async function setGadgetPrefs(dashboardId, gadgetId, filterId) {
  const res = await jiraText(
    `/rest/dashboards/1.0/${dashboardId}/gadget/${gadgetId}/prefs`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        up_isConfigured: true,
        up_num: "20",
        up_filterId: String(filterId),
        up_columnNames: "issuetype|issuekey|summary|status|assignee",
      }),
    }
  );
  return res.status === 204;
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  const filterByName = await searchFilters();
  const dashboards = await searchDashboards();

  for (const dash of dashboards) {
    const filterNames = DASHBOARD_FILTER_NAMES[dash.name];
    if (!filterNames?.length) continue;

    const existing = await getGadgets(dash.id);
    const existingTitles = new Set((existing || []).map((g) => g.title));

    let col = 0;
    let row = 0;
    for (const fullName of filterNames) {
      if (existingTitles.has(fullName)) {
        col++;
        if (col > 1) {
          col = 0;
          row++;
        }
        continue;
      }
      const filterId = filterByName[fullName];
      if (!filterId) {
        console.warn(`Filter not found: ${fullName}`);
        continue;
      }
      const gadget = await addGadget(dash.id, fullName, { row, column: col });
      await setGadgetPrefs(dash.id, gadget.id, filterId);
      console.log(
        `${dash.name}: added gadget "${fullName}" (filter ${filterId})`
      );
      existingTitles.add(fullName);
      col++;
      if (col > 1) {
        col = 0;
        row++;
      }
    }
  }

  console.log(
    "Done. Open the restructure dashboards in Jira to see the filter results."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Creates JQL filters and dashboards for GAQNO restructure: Planejamento, Execução, Acompanhamento.
 * Reusable global filters; dashboards by role (PO, Engenharia, Tech Lead, Gestão).
 * Run after or alongside jira-create-proj-filters-dashboards.mjs. Idempotent.
 *
 * Usage: node scripts/jira-restructure-navigation-filters.mjs [--project=GAQNO] [--dry-run]
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

const args = process.argv.slice(2);
const PROJECT_KEY =
  args.find((a) => a.startsWith("--project="))?.split("=")[1] ||
  process.env.JIRA_PROJECT_KEY ||
  "GAQNO";
const dryRun = args.includes("--dry-run");

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
      description: description || "",
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
      description: description || "",
      sharePermissions: projectId
        ? [{ type: "project", project: { id: projectId } }]
        : [],
      editPermissions: [],
    }),
  });
}

const NAVIGATION_FILTERS = [
  {
    name: `[${PROJECT_KEY}] [PLANEJAMENTO] Epics Ativos`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Epic AND status NOT IN (Done, Cancelled, "Feito", "Cancelado") ORDER BY rank ASC`,
    description: "Planejamento: épicos ativos (excl. concluídos/cancelados).",
    section: "PLANEJAMENTO",
  },
  {
    name: `[${PROJECT_KEY}] [PLANEJAMENTO] Backlog Prioritário`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Story AND sprint IS EMPTY ORDER BY priority DESC`,
    description: "Planejamento: histórias fora da sprint, priorizadas.",
    section: "PLANEJAMENTO",
  },
  {
    name: `[${PROJECT_KEY}] [EXECUÇÃO] Sprint Atual`,
    jql: `project = ${PROJECT_KEY} AND sprint IN openSprints() ORDER BY rank ASC`,
    description: "Execução: itens da sprint ativa.",
    section: "EXECUÇÃO",
  },
  {
    name: `[${PROJECT_KEY}] [EXECUÇÃO] Historias em Progresso`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Story AND status IN ("In Progress", "Fazendo") ORDER BY updated DESC`,
    description: "Execução: histórias em andamento (In Progress ou Fazendo).",
    section: "EXECUÇÃO",
  },
  {
    name: `[${PROJECT_KEY}] [ACOMPANHAMENTO] Bugs Críticos`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Bug AND priority IN (High, Highest) AND status != Done ORDER BY priority DESC`,
    description: "Acompanhamento: bugs críticos abertos.",
    section: "ACOMPANHAMENTO",
  },
  {
    name: `[${PROJECT_KEY}] [ACOMPANHAMENTO] Incidentes Abertos`,
    jql: `project = OPS AND status NOT IN (Done, Resolved) ORDER BY updated DESC`,
    description:
      "Acompanhamento: incidentes abertos (projeto OPS). Se OPS não existir, edite JQL para project = GAQNO e label/issuetype.",
    section: "ACOMPANHAMENTO",
  },
];

const RESTRUCTURE_DASHBOARDS = [
  {
    name: `[${PROJECT_KEY}] Dashboard Produto / PO`,
    description:
      "Planejamento + Execução: Epics Ativos, Backlog Prioritário, Historias por status, Roadmap. Gadgets: Resultados de filtro.",
  },
  {
    name: `[${PROJECT_KEY}] Dashboard Engenharia`,
    description:
      "Execução: Minhas issues, Sprint Atual, Historias em Progresso, PRs vinculados, Subtasks bloqueadas. Gadgets: Resultados de filtro.",
  },
  {
    name: `[${PROJECT_KEY}] Dashboard Tech Lead`,
    description:
      "Acompanhamento: Bugs por módulo, Bugs Críticos, Historias paradas (Sem atividade 7d), Lead time. Gadgets: Resultados de filtro.",
  },
  {
    name: `[${PROJECT_KEY}] Dashboard Gestão`,
    description:
      "Acompanhamento: Throughput por sprint, Epics concluídos vs planejados, Incidentes Abertos. Gadgets: Resultados de filtro.",
  },
];

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  console.log(
    `Project: ${PROJECT_KEY} (restructure: Planejamento / Execução / Acompanhamento)`
  );
  if (dryRun) {
    console.log("DRY RUN – would create:\n");
    NAVIGATION_FILTERS.forEach((f) => console.log(`  Filter: ${f.name}`));
    RESTRUCTURE_DASHBOARDS.forEach((d) =>
      console.log(`  Dashboard: ${d.name}`)
    );
    return;
  }

  const projectId = await getProjectId(PROJECT_KEY);

  for (const f of NAVIGATION_FILTERS) {
    try {
      const filter = await createFilter(
        f.name,
        f.jql,
        f.description,
        projectId
      );
      console.log(`Filter: ${filter.name} (id ${filter.id})`);
    } catch (err) {
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("mesmo nome")
      ) {
        console.log(`Filter: ${f.name} – already exists, skipped`);
      } else throw err;
    }
  }

  for (const d of RESTRUCTURE_DASHBOARDS) {
    try {
      const dashboard = await createDashboard(d.name, d.description, projectId);
      const viewUrl = dashboard.view?.startsWith("http")
        ? dashboard.view
        : `${JIRA_URL}${dashboard.view?.startsWith("/") ? "" : "/"}${dashboard.view || `secure/Dashboard.jspa?selectPageId=${dashboard.id}`}`;
      console.log(
        `Dashboard: ${dashboard.name} (id ${dashboard.id}) – ${viewUrl}`
      );
    } catch (err) {
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("mesmo nome")
      ) {
        console.log(`Dashboard: ${d.name} – already exists, skipped`);
      } else throw err;
    }
  }

  console.log(
    "\nNext: node scripts/jira-add-gadgets-restructure.mjs to add Filter Results gadgets, or add them manually in Jira."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

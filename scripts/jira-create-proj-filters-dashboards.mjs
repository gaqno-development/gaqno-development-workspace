#!/usr/bin/env node
/**
 * Create Jira filters and dashboards for PROJ as per docs/jira/ESTRUTURA-ESPACOS-DASHBOARDS.md.
 * Shares filters and dashboards with the project. User adds "Filter Results" gadgets manually.
 *
 * Usage: node scripts/jira-create-proj-filters-dashboards.mjs [--project=PROJ] [--dry-run]
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

const FILTERS = [
  {
    name: `[${PROJECT_KEY}] Produto – Épicos ativos`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Epic AND status IN ("A fazer", "Fazendo") ORDER BY rank ASC`,
    description: "Roadmap: épicos em A fazer ou Fazendo. Papel: Produto/PO.",
    role: "Produto",
  },
  {
    name: `[${PROJECT_KEY}] Produto – Histórias por status`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Story ORDER BY status ASC, updated DESC`,
    description: "Histórias do projeto. Papel: Produto/PO.",
    role: "Produto",
  },
  {
    name: `[${PROJECT_KEY}] Produto – Tarefas em andamento`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Task AND status = "Fazendo" ORDER BY updated DESC`,
    description: "Tarefas em Fazendo. Papel: Produto/PO.",
    role: "Produto",
  },
  {
    name: `[${PROJECT_KEY}] Engenharia – Minhas issues`,
    jql: `project = ${PROJECT_KEY} AND assignee = currentUser() AND status != Done ORDER BY updated DESC`,
    description: "Issues atribuídas a mim, não concluídas. Papel: Engenharia.",
    role: "Engenharia",
  },
  {
    name: `[${PROJECT_KEY}] Engenharia – Fila Fazendo`,
    jql: `project = ${PROJECT_KEY} AND status = "Fazendo" ORDER BY updated DESC`,
    description: "Fila de code review / Fazendo. Papel: Engenharia.",
    role: "Engenharia",
  },
  {
    name: `[${PROJECT_KEY}] Engenharia – Com PR aberta`,
    jql: `project = ${PROJECT_KEY} AND status = "Fazendo" AND development[pullrequests].open > 0 ORDER BY updated DESC`,
    description:
      "Em Fazendo com PR aberta (requer GitHub for Jira). Papel: Engenharia.",
    role: "Engenharia",
  },
  {
    name: `[${PROJECT_KEY}] Tech Lead – Débito técnico`,
    jql: `project = ${PROJECT_KEY} AND labels = debito-tecnico AND status != Done ORDER BY priority DESC`,
    description: "Issues com label debito-tecnico. Papel: Tech Lead.",
    role: "Tech Lead",
  },
  {
    name: `[${PROJECT_KEY}] Tech Lead – Bugs abertos`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Bug AND status != Done ORDER BY priority DESC`,
    description: "Bugs não concluídos. Papel: Tech Lead.",
    role: "Tech Lead",
  },
  {
    name: `[${PROJECT_KEY}] Tech Lead – Sem atividade 7d`,
    jql: `project = ${PROJECT_KEY} AND updated < -7d AND status != Done ORDER BY updated ASC`,
    description: "Sem atualização há 7+ dias (exclui Done). Papel: Tech Lead.",
    role: "Tech Lead",
  },
  {
    name: `[${PROJECT_KEY}] OPS – Bugs em produção`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Bug AND labels = producao ORDER BY priority DESC`,
    description:
      "Bugs em produção (label producao; ajuste ao fluxo). Papel: Operação/SRE.",
    role: "OPS",
  },
  {
    name: `[${PROJECT_KEY}] Liderança – Épicos por status`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Epic ORDER BY status ASC, updated DESC`,
    description: "Todos os épicos. Papel: Liderança.",
    role: "Liderança",
  },
  {
    name: `[${PROJECT_KEY}] Liderança – Resumo issues`,
    jql: `project = ${PROJECT_KEY} ORDER BY issuetype ASC, status ASC, updated DESC`,
    description: "Todas as issues do projeto. Papel: Liderança.",
    role: "Liderança",
  },
];

const DASHBOARDS = [
  {
    name: `[${PROJECT_KEY}] Painel Produto / PO`,
    description:
      "Filtros sugeridos: [GAQNO] Produto – Épicos ativos; Histórias por status; Tarefas em andamento. Adicione gadget Resultados de filtro e escolha o filtro.",
  },
  {
    name: `[${PROJECT_KEY}] Painel Engenharia`,
    description:
      "Filtros sugeridos: [GAQNO] Engenharia – Minhas issues; Fila Fazendo; Com PR aberta. Adicione gadget Resultados de filtro.",
  },
  {
    name: `[${PROJECT_KEY}] Painel Tech Lead`,
    description:
      "Filtros sugeridos: [GAQNO] Tech Lead – Débito técnico; Bugs abertos; Sem atividade 7d. Adicione gadget Resultados de filtro.",
  },
  {
    name: `[${PROJECT_KEY}] Painel Operação / SRE`,
    description:
      "Filtro sugerido: [GAQNO] OPS – Bugs em produção. Adicione gadget Resultados de filtro.",
  },
  {
    name: `[${PROJECT_KEY}] Painel Liderança`,
    description:
      "Filtros sugeridos: [GAQNO] Liderança – Épicos por status; Resumo issues. Adicione gadget Resultados de filtro.",
  },
];

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  console.log(`Project: ${PROJECT_KEY}`);
  if (dryRun) {
    console.log("DRY RUN – would create:\n");
    FILTERS.forEach((f) => console.log(`  Filter: ${f.name}`));
    DASHBOARDS.forEach((d) => console.log(`  Dashboard: ${d.name}`));
    return;
  }

  const projectId = await getProjectId(PROJECT_KEY);

  for (const f of FILTERS) {
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
        err.message?.includes("mesmo nome") ||
        err.message?.includes("already exists")
      ) {
        console.log(`Filter: ${f.name} – already exists, skipped`);
      } else throw err;
    }
  }

  for (const d of DASHBOARDS) {
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
        err.message?.includes("mesmo nome") ||
        err.message?.includes("already exists")
      ) {
        console.log(`Dashboard: ${d.name} – already exists, skipped`);
      } else throw err;
    }
  }

  console.log(
    "\nNext step (in Jira): open each dashboard → Add gadget → Filter Results → select the filter above."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

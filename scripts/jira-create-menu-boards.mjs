#!/usr/bin/env node
/**
 * Create the missing menu boards for GAQNO: Backlog, Sprint Atual, Bugs & Incidentes.
 * Menu final: Discovery | Epicos | Backlog | Sprint Atual | Historias | Desenvolvimento | Bugs & Incidentes | Dashboards.
 * Idempotent: skips filter/board if name already exists.
 *
 * Usage: node scripts/jira-create-menu-boards.mjs [--project=GAQNO] [--dry-run]
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

async function findFilterByName(name) {
  const data = await jira(
    `/rest/api/3/filter/search?filterName=${encodeURIComponent(name)}&maxResults=50`
  );
  const list = data.values ?? data.results ?? [];
  return list.find((f) => f.name === name);
}

async function createBoard(name, filterId, projectId, type = "kanban") {
  return jira("/rest/agile/1.0/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      type,
      filterId: Number(filterId),
      location: {
        type: "project",
        projectKeyOrId: String(projectId),
      },
    }),
  });
}

async function listBoards(projectId) {
  try {
    const res = await jira(
      `/rest/agile/1.0/board?projectKeyOrId=${projectId}&maxResults=50`
    );
    return res.values ?? [];
  } catch {
    return [];
  }
}

const MENU_BOARDS = [
  {
    boardName: "Backlog",
    filterName: `[${PROJECT_KEY}] Board Backlog`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Story AND sprint IS EMPTY ORDER BY priority DESC, rank ASC`,
    description:
      "Backlog: histórias fora da sprint para refinamento e priorização.",
    type: "kanban",
  },
  {
    boardName: "Sprint Atual",
    filterName: `[${PROJECT_KEY}] Board Sprint Atual`,
    jql: `project = ${PROJECT_KEY} AND sprint IN openSprints() ORDER BY rank ASC`,
    description: "Sprint Atual: daily, prioridades do dia, bloqueios.",
    type: "kanban",
  },
  {
    boardName: "Bugs & Incidentes",
    filterName: `[${PROJECT_KEY}] Board Bugs & Incidentes`,
    jql: `project = ${PROJECT_KEY} AND issuetype = Bug AND status NOT IN (Done, "Feito") ORDER BY priority DESC, updated DESC`,
    description: "Bugs e incidentes abertos: suporte, SRE, hotfix.",
    type: "kanban",
  },
];

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  if (dryRun) {
    console.log("DRY RUN – would create:");
    MENU_BOARDS.forEach((b) => {
      console.log(`  Filter: ${b.filterName}`);
      console.log(`  Board: ${b.boardName} (${b.type})`);
    });
    return;
  }

  const projectId = await getProjectId(PROJECT_KEY);
  const existingBoards = await listBoards(projectId);
  const boardNames = new Set((existingBoards || []).map((b) => b.name));

  for (const item of MENU_BOARDS) {
    let filter = await findFilterByName(item.filterName);
    if (!filter) {
      filter = await createFilter(
        item.filterName,
        item.jql,
        item.description,
        projectId
      );
      console.log(`Filter: ${filter.name} (id ${filter.id})`);
    } else {
      console.log(`Filter: ${item.filterName} – already exists`);
    }

    if (boardNames.has(item.boardName)) {
      console.log(`Board: ${item.boardName} – already exists`);
      continue;
    }

    try {
      const board = await createBoard(
        item.boardName,
        filter.id,
        projectId,
        item.type
      );
      console.log(
        `Board: ${board.name} (id ${board.id}) – ${JIRA_URL}/jira/software/c/projects/${PROJECT_KEY}/boards/${board.id}`
      );
      boardNames.add(board.name);
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes("400") || msg.includes("agile")) {
        console.log(
          `Board "${item.boardName}" could not be created via API. Create manually from filter: ${item.filterName} (id ${filter.id})`
        );
      } else {
        throw err;
      }
    }
  }

  console.log(
    "\nMenu final (reordenar no Jira na ordem desejada): Discovery | Epicos | Backlog | Sprint Atual | Historias | Desenvolvimento | Bugs & Incidentes | Dashboards (link para painéis)."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

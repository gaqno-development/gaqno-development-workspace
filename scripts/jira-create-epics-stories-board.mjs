#!/usr/bin/env node
/**
 * Create a Jira board that shows Epics, Stories (Histórias), and Subtasks (Subtarefas).
 * Creates a filter and a Kanban board linked to it. Share filter and board with project.
 *
 * Usage: node scripts/jira-create-epics-stories-board.mjs [--project=PROJ] [--dry-run]
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
    `/rest/api/3/filter/search?filterName=${encodeURIComponent(name)}&maxResults=20`
  );
  const list = data.values ?? data.results ?? [];
  return list.find((f) => f.name === name);
}

async function createBoard(name, filterId, projectId) {
  return jira("/rest/agile/1.0/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      type: "kanban",
      filterId: Number(filterId),
      location: {
        type: "project",
        projectKeyOrId: String(projectId),
      },
    }),
  });
}

const FILTER_NAME = `[${PROJECT_KEY}] Board Épicos × Histórias × Subtarefas`;
const FILTER_JQL = `project = ${PROJECT_KEY} AND issuetype IN (10000, 10007, 10041) ORDER BY issuetype ASC, rank ASC, updated DESC`;
const FILTER_DESCRIPTION =
  "Filtro do board de visualização: Épicos, Histórias e Subtarefas. Use Agrupar por → Pai para ver História > Subtarefa.";
const BOARD_NAME = `[${PROJECT_KEY}] Épicos × Histórias × Subtarefas`;

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  if (dryRun) {
    console.log("DRY RUN – would create:");
    console.log(`  Filter: ${FILTER_NAME}`);
    console.log(`  JQL: ${FILTER_JQL}`);
    console.log(`  Board: ${BOARD_NAME} (Kanban)`);
    return;
  }

  const projectId = await getProjectId(PROJECT_KEY);
  let filter = await findFilterByName(FILTER_NAME);
  if (!filter) {
    filter = await createFilter(
      FILTER_NAME,
      FILTER_JQL,
      FILTER_DESCRIPTION,
      projectId
    );
    console.log(`Filter created: ${filter.name} (id ${filter.id})`);
  } else {
    console.log(`Filter already exists: ${filter.name} (id ${filter.id})`);
  }

  let existingBoards = [];
  try {
    existingBoards = await jira(
      `/rest/agile/1.0/board?projectKeyOrId=${projectId}&maxResults=50`
    );
  } catch (_) {}
  const boardExists = (existingBoards.values || []).some(
    (b) => b.name === BOARD_NAME
  );
  if (boardExists) {
    console.log(`Board already exists: ${BOARD_NAME}`);
    console.log(`View: ${JIRA_URL}/jira/core/projects/${PROJECT_KEY}/board`);
    return;
  }

  try {
    const board = await createBoard(BOARD_NAME, filter.id, projectId);
    const boardUrl = `${JIRA_URL}/jira/software/projects/${PROJECT_KEY}/boards`;
    console.log(`Board created: ${board.name} (id ${board.id})`);
    console.log(`View: ${boardUrl}`);
    console.log(
      "\nIn the board: View → Group by → Parent to see História > Subtarefa."
    );
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("400") && msg.includes("agile")) {
      console.log(
        "\nBoard could not be created via API (project may be next-gen). Use the filter on the project board:"
      );
      console.log(`  1. Open: ${JIRA_URL}/jira/core/projects/${PROJECT_KEY}/board`);
      console.log(`  2. Set filter to: ${FILTER_NAME}`);
      console.log(`  3. View → Group by → Parent (to see História > Subtarefa).`);
      console.log(`\nFilter id: ${filter.id}`);
    } else {
      throw err;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

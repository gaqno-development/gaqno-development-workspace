#!/usr/bin/env node
/**
 * Create the Discovery board for GAQNO: filter + Kanban board for issues in discovery phase.
 * Issues appear on the board when they have label "discovery". Share filter and board with project.
 *
 * Usage: node scripts/jira-create-discovery-board.mjs [--project=GAQNO] [--dry-run]
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

const FILTER_NAME = `[${PROJECT_KEY}] Board Discovery`;
const FILTER_JQL = `project = ${PROJECT_KEY} AND labels = discovery ORDER BY rank ASC, updated DESC`;
const FILTER_DESCRIPTION =
  "Board Discovery: itens em fase de descoberta (label discovery). Adicione a label 'discovery' às issues para aparecerem aqui.";
const BOARD_NAME = "Discovery";

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
    const res = await jira(
      `/rest/agile/1.0/board?projectKeyOrId=${projectId}&maxResults=50`
    );
    existingBoards = res.values ?? [];
  } catch (_) {}
  const boardExists = existingBoards.some((b) => b.name === BOARD_NAME);
  if (boardExists) {
    const b = existingBoards.find((x) => x.name === BOARD_NAME);
    console.log(`Board already exists: ${BOARD_NAME} (id ${b?.id})`);
    console.log(
      `View: ${JIRA_URL}/jira/software/c/projects/${PROJECT_KEY}/boards/${b?.id || "?"}`
    );
    return;
  }

  try {
    const board = await createBoard(BOARD_NAME, filter.id, projectId);
    const boardUrl = `${JIRA_URL}/jira/software/c/projects/${PROJECT_KEY}/boards/${board.id}`;
    console.log(`Board created: ${board.name} (id ${board.id})`);
    console.log(`View: ${boardUrl}`);
    console.log(
      "\nAdd label 'discovery' to issues to show them on this board."
    );
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("400") || msg.includes("agile")) {
      console.log(
        "\nBoard could not be created via API (e.g. next-gen project). Use the filter on a project board:"
      );
      console.log(
        `  1. Open project boards: ${JIRA_URL}/jira/software/c/projects/${PROJECT_KEY}/boards`
      );
      console.log(`  2. Create board from saved filter: ${FILTER_NAME}`);
      console.log(`  3. Or open filter and "Create board" from results.`);
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

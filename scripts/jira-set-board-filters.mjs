#!/usr/bin/env node
/**
 * Set the correct JQL filter for GAQNO boards so items appear conditionally (71, 111, 73, 75, 76, 77, 78).
 * Board 72 may 404; use 111 for Historias.
 * Reads each board's configuration, then updates the associated filter's JQL per docs/jira/README.md.
 *
 * Usage: node scripts/jira-set-board-filters.mjs [--project=GAQNO] [--dry-run]
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

const BOARD_FILTERS = [
  {
    boardId: 71,
    name: "Epicos",
    jql: `project = ${PROJECT_KEY} AND issuetype = Epic ORDER BY rank ASC, updated DESC`,
    description: "Board 71 – Épicos (roadmap, valor).",
  },
  {
    boardId: 111,
    name: "Historias",
    jql: `project = ${PROJECT_KEY} AND issuetype = Story ORDER BY "Epic Link" ASC, rank ASC, updated DESC`,
    description: "Board 111 – Histórias (agrupadas por épico).",
  },
  {
    boardId: 73,
    name: "Desenvolvimento",
    jql: `project = ${PROJECT_KEY} AND issuetype IN (Story, Task, Sub-task) AND (statusCategory != Done OR sprint IN openSprints()) ORDER BY rank ASC, updated DESC`,
    description:
      "Board 73 – Backlog sem Concluído; sprint mostra todos (incl. Concluído).",
  },
  {
    boardId: 75,
    name: "Discovery",
    jql: `project = ${PROJECT_KEY} AND labels = discovery ORDER BY rank ASC, updated DESC`,
    description: "Board 75 – Discovery (label discovery).",
  },
  {
    boardId: 76,
    name: "Backlog",
    jql: `project = ${PROJECT_KEY} AND issuetype = Story AND sprint IS EMPTY AND statusCategory != Done ORDER BY priority DESC, rank ASC, updated DESC`,
    description: "Board 76 – Stories sem sprint e não concluídas.",
  },
  {
    boardId: 77,
    name: "Sprint Atual",
    jql: `project = ${PROJECT_KEY} AND (sprint IN openSprints() OR (issuetype = Epic AND statusCategory = "In Progress")) ORDER BY rank ASC, updated DESC`,
    description: "Board 77 – Sprint ativa + Épicos em Em andamento.",
  },
  {
    boardId: 78,
    name: "Bugs & Incidentes",
    jql: `project = ${PROJECT_KEY} AND issuetype = Bug ORDER BY priority DESC, updated DESC`,
    description: "Board 78 – Bugs.",
  },
];

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

async function getBoardConfig(boardId) {
  return jira(`/rest/agile/1.0/board/${boardId}/configuration`);
}

async function getFilter(filterId) {
  return jira(`/rest/api/3/filter/${filterId}`);
}

async function updateFilter(filterId, payload) {
  return jira(`/rest/api/3/filter/${filterId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN (or .env.jira)");
    process.exit(1);
  }

  console.log(`Project: ${PROJECT_KEY}${dryRun ? " (dry-run)" : ""}\n`);

  for (const { boardId, name, jql, description } of BOARD_FILTERS) {
    try {
      const config = await getBoardConfig(boardId);
      const filterId = config?.filter?.id ?? config?.filter?.id?.toString?.();
      if (!filterId) {
        console.log(`Board ${boardId} (${name}): no filter in config, skip`);
        continue;
      }
      const fid = typeof filterId === "string" ? filterId : String(filterId);
      const current = await getFilter(fid);
      const currentJql = current.jql || "";
      if (currentJql === jql) {
        console.log(
          `Board ${boardId} (${name}): filter ${fid} already has correct JQL`
        );
        continue;
      }
      if (dryRun) {
        console.log(
          `Board ${boardId} (${name}): would set filter ${fid} JQL to:\n  ${jql}\n`
        );
        continue;
      }
      await updateFilter(fid, {
        name: current.name || `[${PROJECT_KEY}] Board ${name}`,
        description: description || current.description,
        jql,
        favourite: current.favourite,
      });
      console.log(`Board ${boardId} (${name}): updated filter ${fid} JQL`);
    } catch (err) {
      console.error(`Board ${boardId} (${name}): ${err.message}`);
    }
  }

  console.log("\nDone. Refresh the boards in Jira to see the correct issues.");
}

main();

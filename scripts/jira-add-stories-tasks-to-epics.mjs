#!/usr/bin/env node
/**
 * For Epics that have no Story (History) linked: create one Story (Frontend or Backend from Epic summary)
 * and one Subtask under that Story. No Task level (Jira scheme may not allow Task with Story as parent).
 * Idempotent: skips Epic if it already has a Story.
 *
 * Usage:
 *   node scripts/jira-add-stories-tasks-to-epics.mjs [--project=GAQNO] [--dry-run]
 *   node scripts/jira-add-stories-tasks-to-epics.mjs [--project=GAQNO] --epics=GAQNO-107,GAQNO-108,...
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

function parseArgs() {
  const args = process.argv.slice(2);
  const project =
    args.find((a) => a.startsWith("--project="))?.split("=")[1] ??
    process.env.JIRA_PROJECT_KEY ??
    "GAQNO";
  const dryRun = args.includes("--dry-run");
  const epicsArg = args.find((a) => a.startsWith("--epics="))?.split("=")[1];
  const epicKeys = epicsArg
    ? epicsArg
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : null;
  return { project, dryRun, epicKeys };
}

const TYPE_NAME_ALIASES = {
  Epic: ["Épico", "Epic"],
  Story: ["História", "Story"],
  Task: ["Tarefa", "Task"],
  Subtask: ["Sub-tarefa", "Subtask"],
};

function resolveTypeId(wantedName, byName) {
  if (byName[wantedName]) return byName[wantedName];
  const aliases = TYPE_NAME_ALIASES[wantedName];
  if (aliases) {
    for (const name of aliases) {
      if (byName[name]) return byName[name];
    }
  }
  const keys = Object.keys(byName);
  return keys.length ? byName[keys[0]] : null;
}

function layerFromSummary(summary) {
  if (!summary || typeof summary !== "string") return "Backend";
  if (/gaqno-[a-z]+-ui\b/i.test(summary)) return "Frontend";
  if (/gaqno-[a-z]+-service\b/i.test(summary)) return "Backend";
  return "Backend";
}

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString(
  "base64"
);

const RETRY_MAX = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function jira(pathname, opts = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    const res = await fetch(`${JIRA_URL}${pathname}`, {
      ...opts,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
        ...opts.headers,
      },
    });
    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : null;
    lastErr = new Error(`${res.status} ${pathname}: ${text}`);
    if (attempt < RETRY_MAX && (res.status >= 500 || res.status === 429)) {
      console.warn(
        `  Retry ${attempt}/${RETRY_MAX} in ${RETRY_DELAY_MS * attempt}ms (${res.status})...`
      );
      await sleep(RETRY_DELAY_MS * attempt);
    } else break;
  }
  throw lastErr;
}

async function getProjectIssueTypes(projectKey) {
  const project = await jira(
    `/rest/api/3/project/${projectKey}?expand=issueTypes`
  );
  const types = project.issueTypes || [];
  const byName = {};
  let subtaskTypeId = null;
  for (const t of types) {
    byName[t.name] = t.id;
    if (t.subtask === true) subtaskTypeId = t.id;
  }
  return { byName, subtaskTypeId };
}

async function searchJql(
  jql,
  fields = "key,summary,issuetype,parent",
  maxResults = 100
) {
  const data = await jira("/rest/api/3/search/jql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jql,
      fields: fields.split(",").map((f) => f.trim()),
      maxResults,
    }),
  });
  return data.issues || [];
}

async function getEpicsWithoutStories(projectKey, epicKeysFilter, storyTypeId) {
  const jql = epicKeysFilter
    ? `project = ${projectKey} AND issuetype = Epic AND key IN (${epicKeysFilter.join(", ")}) ORDER BY key ASC`
    : `project = ${projectKey} AND issuetype = Epic ORDER BY key ASC`;
  const epics = await searchJql(jql, "key,summary", 200);
  const keys = epics.map((e) => e.key);
  if (keys.length === 0) return [];
  const childrenJql = `project = ${projectKey} AND parent IN (${keys.join(", ")})`;
  const children = await searchJql(childrenJql, "key,parent,issuetype", 500);
  const epicsWithStory = new Set();
  const storyIdStr = String(storyTypeId || "");
  for (const c of children) {
    const typeId = String(c.fields?.issuetype?.id || "");
    const parentKey = c.fields?.parent?.key;
    if (parentKey && typeId === storyIdStr) epicsWithStory.add(parentKey);
  }
  return epics.filter((e) => !epicsWithStory.has(e.key));
}

async function createIssue(projectKey, fields, dryRun) {
  if (dryRun) return { key: `DRY-${projectKey}-?` };
  return jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        ...fields,
      },
    }),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN in .env.jira or .env");
    process.exit(1);
  }

  const { project, dryRun, epicKeys } = parseArgs();

  const { byName, subtaskTypeId } = await getProjectIssueTypes(project);
  const storyId = resolveTypeId("Story", byName);
  const subtaskId = subtaskTypeId ?? resolveTypeId("Subtask", byName);

  if (!storyId) {
    console.error("Project must have Story issue type.");
    process.exit(1);
  }

  const epicsToProcess = await getEpicsWithoutStories(
    project,
    epicKeys,
    storyId
  );

  if (epicsToProcess.length === 0) {
    console.log("No Epics without Stories found.");
    return;
  }

  console.log(
    `Found ${epicsToProcess.length} Epic(s) without Story${dryRun ? " (dry-run)" : ""}:\n`
  );

  for (const epic of epicsToProcess) {
    const summary = epic.fields?.summary || epic.key;
    const layer = layerFromSummary(summary);
    if (dryRun) {
      console.log(
        `  ${epic.key}  → Story "${layer}" → Subtask  (${summary.slice(0, 45)})`
      );
      continue;
    }

    const storyFields = {
      issuetype: { id: String(storyId) },
      parent: { key: epic.key },
      summary: layer,
    };
    const storyCreated = await createIssue(project, storyFields, false);
    console.log(`  ${epic.key}  → ${storyCreated.key} (${layer})`);

    if (subtaskId) {
      const stFields = {
        issuetype: { id: String(subtaskId) },
        parent: { key: storyCreated.key },
        summary: "Trabalho",
      };
      const stCreated = await createIssue(project, stFields, false);
      console.log(`      → ${stCreated.key} (Subtask)`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Delete Tasks whose parent is an Epic, when that work already exists as
 * Subtasks under the linked Story (sync duplicated Epic→Tasks into Story→Subtasks).
 * Epic→Story: 49→54, 50→58, 51→55, 52→56, 53→57. (51→55 = História legada; PROJ-51 Products tem Histórias ex. PROJ-117/119/121/122.)
 *
 * Usage: node scripts/jira-delete-epic-tasks-duplicated-in-story.mjs [--project=GAQNO] [--epic=GAQNO-49] [--dry-run]
 * Without --epic: deletes Tasks under all 5 Epics (49,50,51,52,53).
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
const epicArg = args.find((a) => a.startsWith("--epic="))?.split("=")[1];
const dryRun = args.includes("--dry-run");

const EPIC_TO_STORY = {
  [`${PROJECT_KEY}-49`]: `${PROJECT_KEY}-54`,
  [`${PROJECT_KEY}-50`]: `${PROJECT_KEY}-58`,
  [`${PROJECT_KEY}-51`]: `${PROJECT_KEY}-55`,
  [`${PROJECT_KEY}-52`]: `${PROJECT_KEY}-56`,
  [`${PROJECT_KEY}-53`]: `${PROJECT_KEY}-57`,
};

const EPIC_KEYS = epicArg ? [epicArg] : Object.keys(EPIC_TO_STORY);

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

async function searchJql(jql, fields = "key,summary,parent", maxResults = 200) {
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

async function deleteIssue(key) {
  return jira(`/rest/api/3/issue/${key}`, { method: "DELETE" });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  const parentClause =
    EPIC_KEYS.length === 1
      ? `parent = ${EPIC_KEYS[0]}`
      : `parent in (${EPIC_KEYS.join(", ")})`;
  const jql = `project = ${PROJECT_KEY} AND issuetype = Task AND ${parentClause} ORDER BY key ASC`;
  const tasks = await searchJql(jql);

  if (!tasks.length) {
    console.log("No Tasks under the specified Epic(s) found.");
    return;
  }

  if (dryRun) {
    console.log(
      "DRY RUN – would delete",
      tasks.length,
      "Task(s) (already synced as Subtasks under Story):"
    );
    tasks.forEach((i) =>
      console.log(
        `  ${i.key} – ${i.fields?.summary} (parent: ${i.fields?.parent?.key} → Story ${EPIC_TO_STORY[i.fields?.parent?.key] || "?"})`
      )
    );
    return;
  }

  for (const issue of tasks) {
    await deleteIssue(issue.key);
    console.log(
      `Deleted ${issue.key} – ${issue.fields?.summary} (was under ${issue.fields?.parent?.key})`
    );
  }
  console.log("Done. Work remains as Subtasks under the linked Stories.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

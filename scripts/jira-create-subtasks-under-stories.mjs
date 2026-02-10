#!/usr/bin/env node
/**
 * Create Subtasks under each Story (História) in PROJ so the board can show
 * History > SUBTASK hierarchy. Uses same creds as other Jira scripts.
 *
 * Usage: node scripts/jira-create-subtasks-under-stories.mjs [--project=PROJ] [--dry-run]
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

async function searchJql(jql, fields = "key,summary", maxResults = 50) {
  const data = await jira("/rest/api/3/search/jql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jql, fields: fields.split(","), maxResults }),
  });
  return data.issues || [];
}

async function getStories(projectKey) {
  return searchJql(
    `project = ${projectKey} AND issuetype = Story ORDER BY key ASC`
  );
}

async function getExistingSubtasks(parentKeys) {
  if (!parentKeys.length) return new Map();
  const jql = `project = ${PROJECT_KEY} AND issuetype = 10041 AND parent in (${parentKeys.join(",")})`;
  const issues = await searchJql(jql, "parent", 200);
  const countByParent = new Map();
  for (const issue of issues) {
    const pk = issue.fields?.parent?.key;
    if (pk) countByParent.set(pk, (countByParent.get(pk) || 0) + 1);
  }
  return countByParent;
}

async function createSubtask(projectKey, parentKey, summary) {
  return jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        parent: { key: parentKey },
        issuetype: { id: "10041" },
        summary,
      },
    }),
  });
}

const SUBTASKS_PER_STORY = 2;
const SUBTASK_SUMMARY_PREFIX = "Trabalho";

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  const stories = await getStories(PROJECT_KEY);
  if (!stories.length) {
    console.log("No Stories found in project " + PROJECT_KEY);
    return;
  }

  const parentKeys = stories.map((s) => s.key);
  const existingCount = await getExistingSubtasks(parentKeys);

  if (dryRun) {
    console.log(
      "DRY RUN – would ensure",
      SUBTASKS_PER_STORY,
      "subtask(s) per Story for:"
    );
    stories.forEach((s) =>
      console.log(
        `  ${s.key} (${existingCount.get(s.key) || 0} existing) → ${s.fields?.summary}`
      )
    );
    return;
  }

  for (const story of stories) {
    const key = story.key;
    const current = existingCount.get(key) || 0;
    const toCreate = Math.max(0, SUBTASKS_PER_STORY - current);
    for (let i = 0; i < toCreate; i++) {
      const summary = `${SUBTASK_SUMMARY_PREFIX} ${current + i + 1}`;
      const created = await createSubtask(PROJECT_KEY, key, summary);
      console.log(`${key}: created subtask ${created.key} – ${summary}`);
    }
    if (toCreate === 0)
      console.log(`${key}: already has ${current} subtask(s), skipped`);
  }

  console.log(
    "\nBoard: use Group by → Parent (or show subtasks) so History shows with SUBTASK under it."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Create subtasks under the centralized types story (GAQNO-1311).
 * Usage: node scripts/jira-create-types-story-subtasks.mjs [--parent=GAQNO-1311] [--dry-run]
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
const PARENT_KEY =
  args.find((a) => a.startsWith("--parent="))?.split("=")[1] || "GAQNO-1311";
const dryRun = args.includes("--dry-run");

const SUBTASK_SUMMARIES = [
  "Migrate types from AI module",
  "Migrate types from RPG module",
  "Migrate types from SSO module",
  "Migrate types from PDV module",
  "Migrate types from Finance module",
  "Publish @gaqno-development/types to GitHub Packages and document usage",
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

async function getSubtasksOf(parentKey) {
  const data = await jira("/rest/api/3/search/jql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jql: `parent = ${parentKey}`,
      fields: ["summary"],
      maxResults: 50,
    }),
  });
  return (data.issues || []).map((i) => i.fields?.summary?.trim()).filter(Boolean);
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

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN (e.g. in .env.jira)");
    process.exit(1);
  }

  const projectKey = PARENT_KEY.replace(/-\d+$/, "");

  if (dryRun) {
    console.log(`DRY RUN – would create under ${PARENT_KEY}:`);
    SUBTASK_SUMMARIES.forEach((s) => console.log(`  - ${s}`));
    return;
  }

  const existing = await getSubtasksOf(PARENT_KEY);
  const toCreate = SUBTASK_SUMMARIES.filter(
    (s) => !existing.some((e) => e.toLowerCase() === s.toLowerCase())
  );

  if (!toCreate.length) {
    console.log(`${PARENT_KEY}: all ${SUBTASK_SUMMARIES.length} subtasks already exist.`);
    return;
  }

  for (const summary of toCreate) {
    const created = await createSubtask(projectKey, PARENT_KEY, summary);
    console.log(`${PARENT_KEY}: created ${created.key} – ${summary}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Delete placeholder Subtasks ("Trabalho 1", "Trabalho 2") under project Stories.
 * Targets only the legacy stories (KEY-54..58, one per epic). KEY-51 Products uses KEY-117/119/121/122.
 * Keeps synced Subtasks (description contains "Synced from KEY-xx"). Same creds as other Jira scripts.
 *
 * Usage: node scripts/jira-delete-placeholder-subtasks.mjs [--project=GAQNO] [--dry-run]
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

const PLACEHOLDER_SUMMARY_REGEX = /^Trabalho \d+$/;

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

async function searchJql(jql, fields = "key,summary", maxResults = 100) {
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

function isPlaceholderSubtask(issue) {
  const summary = issue.fields?.summary?.trim() || "";
  return PLACEHOLDER_SUMMARY_REGEX.test(summary);
}

async function deleteIssue(key) {
  return jira(`/rest/api/3/issue/${key}`, { method: "DELETE" });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  const LEGACY_STORY_KEYS = `${PROJECT_KEY}-54, ${PROJECT_KEY}-55, ${PROJECT_KEY}-56, ${PROJECT_KEY}-57, ${PROJECT_KEY}-58`;
  const jql = `project = ${PROJECT_KEY} AND issuetype = 10041 AND parent in (${LEGACY_STORY_KEYS}) ORDER BY parent, key`;
  const subtasks = await searchJql(jql, "key,summary,parent", 200);
  const toDelete = subtasks.filter(isPlaceholderSubtask);

  if (!toDelete.length) {
    console.log("No placeholder subtasks (Trabalho 1, Trabalho 2, ...) found.");
    return;
  }

  if (dryRun) {
    console.log(
      "DRY RUN – would delete",
      toDelete.length,
      "placeholder subtask(s):"
    );
    toDelete.forEach((i) =>
      console.log(
        `  ${i.key} – ${i.fields?.summary} (parent: ${i.fields?.parent?.key})`
      )
    );
    return;
  }

  for (const issue of toDelete) {
    await deleteIssue(issue.key);
    console.log(`Deleted ${issue.key} – ${issue.fields?.summary}`);
  }
  console.log("Done. Synced subtasks (Synced from KEY-xx) were kept.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

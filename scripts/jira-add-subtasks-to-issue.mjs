#!/usr/bin/env node
/**
 * Create Subtasks under a single parent issue (Story or Task).
 * Uses same creds as other Jira scripts (.env.jira / .env).
 *
 * Usage:
 *   node scripts/jira-add-subtasks-to-issue.mjs --parent=GAQNO-1125 -- "Summary 1" "Summary 2" "Summary 3"
 *   node scripts/jira-add-subtasks-to-issue.mjs --parent=GAQNO-1125 --dry-run -- "Summary 1"
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
const parentArg = args.find((a) => a.startsWith("--parent="));
const parentKey = parentArg?.split("=")[1]?.trim();
const dryRun = args.includes("--dry-run");
const dashIdx = args.indexOf("--");
const summaries = dashIdx >= 0 ? args.slice(dashIdx + 1).filter(Boolean) : [];

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

async function getProjectAndSubtaskType(parentKey) {
  const issue = await jira(`/rest/api/3/issue/${parentKey}?fields=project`);
  const projectKey = issue.fields?.project?.key;
  if (!projectKey) throw new Error(`Parent ${parentKey} not found`);
  const project = await jira(
    `/rest/api/3/project/${projectKey}?expand=issueTypes`
  );
  const types = project.issueTypes || [];
  const subtaskType = types.find((t) => t.subtask === true);
  if (!subtaskType)
    throw new Error(`Project ${projectKey} has no Sub-task issue type`);
  return { projectKey, subtaskTypeId: subtaskType.id };
}

async function createSubtask(projectKey, parentKey, subtaskTypeId, summary) {
  return jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        parent: { key: parentKey },
        issuetype: { id: String(subtaskTypeId) },
        summary,
      },
    }),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN in .env.jira or .env");
    process.exit(1);
  }
  if (!parentKey) {
    console.error('Usage: --parent=KEY-123 -- "Summary 1" "Summary 2"');
    process.exit(1);
  }
  if (!summaries.length) {
    console.error("Provide at least one summary after --");
    process.exit(1);
  }

  const { projectKey, subtaskTypeId } =
    await getProjectAndSubtaskType(parentKey);

  if (dryRun) {
    console.log(
      `DRY RUN – would create ${summaries.length} subtask(s) under ${parentKey}:`
    );
    summaries.forEach((s) => console.log(`  - ${s}`));
    return;
  }

  for (const summary of summaries) {
    const created = await createSubtask(
      projectKey,
      parentKey,
      subtaskTypeId,
      summary
    );
    console.log(`${parentKey}: created ${created.key} – ${summary}`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

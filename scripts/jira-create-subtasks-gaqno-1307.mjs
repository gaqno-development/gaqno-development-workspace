#!/usr/bin/env node
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

const PARENT_KEY = "GAQNO-1307";
const SUBTASKS = [
  "gaqno-ai-ui: RetailSection page and routing",
  "gaqno-sso-service: Menu seed Retail children under AI",
  "gaqno-shell-ui: Menu config and route permissions",
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
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN in .env.jira");
    process.exit(1);
  }
  for (const summary of SUBTASKS) {
    const created = await createSubtask("GAQNO", PARENT_KEY, summary);
    console.log(`Created ${created.key}: ${summary}`);
  }
  console.log(
    `\nSubtasks under ${PARENT_KEY}: https://gaqno.atlassian.net/browse/${PARENT_KEY}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

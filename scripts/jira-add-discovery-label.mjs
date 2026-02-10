#!/usr/bin/env node
/**
 * Add label "discovery" to issues so they appear on Discovery board (75).
 * Usage: node scripts/jira-add-discovery-label.mjs --epics
 *        node scripts/jira-add-discovery-label.mjs GAQNO-1112 GAQNO-1113
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
const useEpics = args.includes("--epics");
const DISCOVERY_EPICS = [
  "GAQNO-1112",
  "GAQNO-1113",
  "GAQNO-1114",
  "GAQNO-1115",
  "GAQNO-1116",
];
const keys = useEpics
  ? DISCOVERY_EPICS
  : args.filter((a) => /^[A-Z]+-\d+$/.test(a));

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

async function addDiscoveryLabel(issueKey) {
  const issue = await jira(`/rest/api/3/issue/${issueKey}?fields=labels`);
  const current = issue.fields?.labels || [];
  if (current.includes("discovery")) {
    console.log(`${issueKey}: already has label discovery`);
    return;
  }
  await jira(`/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { labels: [...current, "discovery"] } }),
  });
  console.log(`${issueKey}: added label discovery`);
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }
  if (!keys.length) {
    console.error(
      "Usage: node scripts/jira-add-discovery-label.mjs --epics | GAQNO-XXX ..."
    );
    process.exit(1);
  }
  for (const key of keys) {
    await addDiscoveryLabel(key);
  }
  console.log("\nDone. Issues appear on Discovery board (75).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Delete all Jira filters whose name starts with [PROJ] (or --project=KEY).
 * Usage: node scripts/jira-delete-proj-filters.mjs [--project=PROJ] [--dry-run]
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
  .replace(/["',]+$/g, "")
  .replace(/\/$/, "");
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

const args = process.argv.slice(2);
const PROJECT_KEY =
  args.find((a) => a.startsWith("--project="))?.split("=")[1] ||
  process.env.JIRA_PROJECT_KEY ||
  "PROJ";
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

async function listProjFilters() {
  const prefix = `[${PROJECT_KEY}]`;
  const out = [];
  let startAt = 0;
  const maxResults = 100;
  while (true) {
    const data = await jira(
      `/rest/api/3/filter/search?filterName=${encodeURIComponent(PROJECT_KEY)}&maxResults=${maxResults}&startAt=${startAt}`
    );
    const list = data.values ?? data.results ?? [];
    for (const f of list) {
      if (f.name?.startsWith(prefix)) out.push({ id: f.id, name: f.name });
    }
    if (list.length < maxResults) break;
    startAt += maxResults;
  }
  return out;
}

async function deleteFilter(id) {
  await jira(`/rest/api/3/filter/${id}`, { method: "DELETE" });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN (or .env.jira)");
    process.exit(1);
  }
  console.log(`Project: ${PROJECT_KEY}${dryRun ? " (dry-run)" : ""}\n`);
  const filters = await listProjFilters();
  if (!filters.length) {
    console.log("No filters found.");
    return;
  }
  console.log(`Found ${filters.length} filter(s):`);
  for (const f of filters) console.log(`  ${f.id}  ${f.name}`);
  if (dryRun) {
    console.log("\nDry-run: no filters deleted.");
    return;
  }
  console.log("");
  for (const f of filters) {
    try {
      await deleteFilter(f.id);
      console.log(`Deleted: ${f.name} (${f.id})`);
    } catch (e) {
      console.error(`Failed to delete ${f.id} ${f.name}:`, e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

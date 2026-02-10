#!/usr/bin/env node
/**
 * Set up Epic KEY-51 (Products) with Stories per product and subtasks.
 * Structure: KEY-51 Products (default project GAQNO)
 *   - gaqno-ai-ui → add chat component
 *   - gaqno-ai-service → add chat endpoint
 *   - gaqno-crm-ui
 *   - gaqno-omnichannel-ui
 *
 * Uses same creds as other Jira scripts. Idempotent: skips Story if summary exists under Epic KEY-51.
 *
 * Usage: node scripts/jira-setup-proj51-products.mjs [--dry-run]
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

const PROJECT_KEY = process.env.JIRA_PROJECT_KEY || "GAQNO";
const EPIC_KEY = `${PROJECT_KEY}-51`;
const dryRun = process.argv.includes("--dry-run");

const PRODUCTS = [
  { summary: "gaqno-ai-ui", subtasks: ["add chat component"] },
  { summary: "gaqno-ai-service", subtasks: ["add chat endpoint"] },
  { summary: "gaqno-crm-ui", subtasks: [] },
  { summary: "gaqno-omnichannel-ui", subtasks: [] },
];

const STORY_TYPE_ID = "10007";
const SUBTASK_TYPE_ID = "10041";

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
    body: JSON.stringify({
      jql,
      fields: fields.split(",").map((f) => f.trim()),
      maxResults,
    }),
  });
  return data.issues || [];
}

async function createStory(projectKey, epicKey, summary) {
  return jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        parent: { key: epicKey },
        issuetype: { id: STORY_TYPE_ID },
        summary,
      },
    }),
  });
}

async function createSubtask(projectKey, parentKey, summary) {
  return jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        parent: { key: parentKey },
        issuetype: { id: SUBTASK_TYPE_ID },
        summary,
      },
    }),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  const existingChildren = await searchJql(
    `project = ${PROJECT_KEY} AND parent = ${EPIC_KEY}`,
    "key,summary,issuetype",
    100
  );
  const storySummaries = new Set(
    existingChildren
      .filter((i) => String(i.fields?.issuetype?.id) === STORY_TYPE_ID)
      .map((i) => (i.fields?.summary || "").trim())
  );

  if (dryRun) {
    console.log("DRY RUN – would ensure under", EPIC_KEY, ":");
    for (const p of PRODUCTS) {
      const exists = storySummaries.has(p.summary);
      console.log(`  ${exists ? "[exists]" : "[create]"} ${p.summary}`);
      for (const st of p.subtasks) console.log(`    → ${st}`);
    }
    return;
  }

  for (const product of PRODUCTS) {
    let storyKey = null;
    const existing = existingChildren.find(
      (i) =>
        String(i.fields?.issuetype?.id) === STORY_TYPE_ID &&
        (i.fields?.summary || "").trim() === product.summary
    );
    if (existing) {
      storyKey = existing.key;
      console.log(`${product.summary}: use existing ${storyKey}`);
    } else {
      const created = await createStory(PROJECT_KEY, EPIC_KEY, product.summary);
      storyKey = created.key;
      console.log(`${product.summary}: created ${storyKey}`);
    }

    const existingSubtasks = await searchJql(
      `project = ${PROJECT_KEY} AND issuetype = ${SUBTASK_TYPE_ID} AND parent = ${storyKey}`,
      "summary",
      20
    );
    const existingSubSummaries = new Set(
      existingSubtasks.map((i) => (i.fields?.summary || "").trim())
    );

    for (const subSummary of product.subtasks) {
      if (existingSubSummaries.has(subSummary)) {
        console.log(`  ${storyKey}: subtask "${subSummary}" already exists`);
        continue;
      }
      const sub = await createSubtask(PROJECT_KEY, storyKey, subSummary);
      console.log(`  ${storyKey}: created subtask ${sub.key} – ${subSummary}`);
    }
  }
  console.log(
    "\nDone. PROJ-51 Products:",
    PRODUCTS.map((p) => p.summary).join(", ")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

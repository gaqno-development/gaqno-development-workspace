#!/usr/bin/env node
/**
 * Link Stories without Epic Link to product Epics (Epics = modules: Shell, AI, Finance, RPG, Admin, SaaS, etc.).
 * Uses summary-based mapping so each Story is associated to one product Epic.
 *
 * Usage:
 *   node scripts/jira-link-stories-to-epics.mjs [--project=GAQNO] [--dry-run]
 *
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env).
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

const EPIC_LINK_FIELD = "customfield_10014";

const STORY_SUMMARY_TO_EPIC_KEY = {
  "commit-msg — Validação de mensagens de commit": "GAQNO-107",
  "pre-commit — Lint-staged e lint em pacotes afetados": "GAQNO-107",
  "pre-push — Testes completos antes do push": "GAQNO-107",
  "Setup Husky em novos pacotes (create-project)": "GAQNO-107",
  "Migrate admin pages from shell to gaqno-admin-ui": "GAQNO-116",
  "Refactor monorepo: remove submodules, add CI workflows and documentation":
    "GAQNO-107",
  "Migrate finance-ui to frontcore API client": "GAQNO-109",
  "Break useMasterDashboard into smaller hooks": "GAQNO-110",
  "Document admin/saas service evolution": "GAQNO-116",
  "Add specs for admin-ui hooks": "GAQNO-116",
  "Add specs for saas-ui hooks": "GAQNO-117",
  "Unify types (backcore as source)": "GAQNO-113",
  "DTOs implement shared interfaces": "GAQNO-113",
  "Create shared hooks folder and migrate domain hooks": "GAQNO-110",
  "Migrate Master and Game Dashboard hooks to component folders": "GAQNO-110",
  "Migrate Campaign hooks to CampaignWizardView": "GAQNO-110",
  "Migrate remaining utility hooks to shared": "GAQNO-110",
  "Update Frontend Architecture Guide and add barrel exports": "GAQNO-110",
  "Migrate Session and Page hooks to page folders": "GAQNO-110",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const project =
    args.find((a) => a.startsWith("--project="))?.split("=")[1] ??
    process.env.JIRA_PROJECT_KEY ??
    "GAQNO";
  const dryRun = args.includes("--dry-run");
  return { project, dryRun };
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

async function getStoriesWithoutEpicLink(projectKey) {
  const jql = `project = ${projectKey} AND issuetype = Story AND "Epic Link" is EMPTY ORDER BY key ASC`;
  const data = await jira("/rest/api/3/search/jql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jql,
      fields: ["key", "summary"],
      maxResults: 50,
    }),
  });
  return data.values || data.issues || [];
}

async function setEpicLink(issueKey, epicKey, dryRun) {
  if (dryRun) return;
  await jira(`/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: { [EPIC_LINK_FIELD]: epicKey },
    }),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN in .env.jira or .env");
    process.exit(1);
  }

  const { project, dryRun } = parseArgs();

  const stories = await getStoriesWithoutEpicLink(project);
  if (stories.length === 0) {
    console.log("No Stories without Epic Link found.");
    return;
  }

  console.log(
    `Stories without Epic Link: ${stories.length}${dryRun ? " (dry-run)" : ""}\n`
  );

  let linked = 0;
  let skipped = 0;

  for (const story of stories) {
    const key = story.key;
    const summary =
      story.fields?.summary?.trim() || story.summary?.trim() || "";
    const epicKey = STORY_SUMMARY_TO_EPIC_KEY[summary];

    if (!epicKey) {
      console.log(`  ${key}  (no mapping)  ${summary.slice(0, 50)}`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  ${key}  → ${epicKey}  ${summary.slice(0, 45)}`);
      linked++;
      continue;
    }

    try {
      await setEpicLink(key, epicKey, false);
      console.log(`  ${key}  → ${epicKey}  ${summary.slice(0, 45)}`);
      linked++;
    } catch (e) {
      console.error(`  ${key}  failed:`, e.message);
    }
  }

  console.log(`\nDone. Linked: ${linked}, skipped (no mapping): ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

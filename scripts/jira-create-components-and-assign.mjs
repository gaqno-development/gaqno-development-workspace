#!/usr/bin/env node
/**
 * Create Jira project components (if missing) and assign components to issues
 * by matching issue summary/description to component names.
 *
 * Usage: node scripts/jira-create-components-and-assign.mjs [--project=PROJ] [--dry-run]
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

const PROJECT_KEY =
  process.argv.find((a) => a.startsWith("--project="))?.split("=")[1] ||
  process.env.JIRA_PROJECT_KEY ||
  "GAQNO";
const DRY_RUN = process.argv.includes("--dry-run");

const COMPONENTS = [
  { name: "gaqno-admin-ui", description: "Frontend – Admin UI" },
  { name: "gaqno-ai-ui", description: "Frontend – AI UI" },
  { name: "gaqno-crm-ui", description: "Frontend – CRM UI" },
  { name: "gaqno-erp-ui", description: "Frontend – ERP UI" },
  { name: "gaqno-finance-ui", description: "Frontend – Finance UI" },
  { name: "gaqno-landing-ui", description: "Frontend – Landing UI" },
  { name: "gaqno-lenin-ui", description: "Frontend – Lenin UI" },
  { name: "gaqno-omnichannel-ui", description: "Frontend – Omnichannel UI" },
  { name: "gaqno-pdv-ui", description: "Frontend – PDV UI" },
  { name: "gaqno-rpg-ui", description: "Frontend – RPG UI" },
  { name: "gaqno-saas-ui", description: "Frontend – SaaS UI" },
  { name: "gaqno-shell-ui", description: "Frontend – Shell UI" },
  { name: "gaqno-sso-ui", description: "Frontend – SSO UI" },
  { name: "gaqno-admin-service", description: "Backend – Admin Service" },
  { name: "gaqno-ai-service", description: "Backend – AI Service" },
  { name: "gaqno-finance-service", description: "Backend – Finance Service" },
  {
    name: "gaqno-omnichannel-service",
    description: "Backend – Omnichannel Service",
  },
  { name: "gaqno-pdv-service", description: "Backend – PDV Service" },
  { name: "gaqno-rpg-service", description: "Backend – RPG Service" },
  { name: "gaqno-saas-service", description: "Backend – SaaS Service" },
  { name: "gaqno-sso-service", description: "Backend – SSO Service" },
  { name: "@gaqno-backcore", description: "Package – Backend shared core" },
  { name: "@gaqno-frontcore", description: "Package – Frontend shared core" },
  {
    name: "gaqno-development-workspace",
    description: "Workspace – Monorepo root",
  },
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

async function getProjectComponents() {
  return jira(`/rest/api/3/project/${PROJECT_KEY}/components`);
}

async function createComponent(component) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/component`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      name: component.name,
      description: component.description,
      project: PROJECT_KEY,
    }),
  });
  if (res.status === 201) return (await res.json()).id;
  if (res.status === 400 && (await res.text()).includes("already exists"))
    return null;
  throw new Error(`${res.status}: ${await res.text()}`);
}

async function ensureComponents() {
  const existing = await getProjectComponents();
  const byName = new Map(existing.map((c) => [c.name, c.id]));
  let created = 0;
  for (const comp of COMPONENTS) {
    if (byName.has(comp.name)) continue;
    const id = await createComponent(comp);
    if (id) {
      byName.set(comp.name, id);
      created++;
      console.log(`Created component: ${comp.name}`);
    }
  }
  console.log(`Components: ${created} created, ${byName.size} total\n`);
  return byName;
}

async function searchAllIssues() {
  const list = [];
  let nextPageToken;
  let data;
  do {
    const body = {
      jql: `project = ${PROJECT_KEY} ORDER BY key ASC`,
      maxResults: 100,
      fields: ["summary", "description", "issuetype"],
    };
    if (nextPageToken) body.nextPageToken = nextPageToken;
    data = await jira("/rest/api/3/search/jql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    for (const issue of data.issues || []) {
      const desc = issue.fields?.description;
      const descText =
        typeof desc === "string"
          ? desc
          : desc?.content?.[0]?.content?.map((c) => c.text).join(" ") || "";
      list.push({
        key: issue.key,
        summary: issue.fields?.summary || "",
        description: descText,
        issuetype: issue.fields?.issuetype?.name || "",
      });
    }
    nextPageToken = data.nextPageToken;
  } while (nextPageToken && !data?.isLast);
  return list;
}

function inferComponents(issue, componentIdsByName) {
  const text = `${issue.summary} ${issue.description}`.toLowerCase();
  const matched = new Set();
  const names = [...componentIdsByName.keys()].sort(
    (a, b) => b.length - a.length
  );
  for (const name of names) {
    const search = name.toLowerCase();
    if (text.includes(search)) matched.add(name);
  }
  if (
    matched.size === 0 &&
    /monorepo|ci|workflow|husky|commitlint|lint-staged|pre-commit|pre-push|commit-msg|push-all|workspace|documentation|docs\b|architecture|refactor\s+monorepo/i.test(
      text
    )
  )
    matched.add("gaqno-development-workspace");
  if (
    matched.size === 0 &&
    /backcore|@gaqno-backcore|dto|shared\s+interface|contract/i.test(text)
  )
    matched.add("@gaqno-backcore");
  if (
    matched.size === 0 &&
    /frontcore|@gaqno-frontcore|api\s+client|createAxiosClient/i.test(text)
  )
    matched.add("@gaqno-frontcore");
  if (issue.issuetype === "Epic") matched.add("gaqno-development-workspace");
  return [...matched]
    .map((name) => componentIdsByName.get(name))
    .filter(Boolean);
}

async function assignComponentsToIssue(issueKey, componentIds) {
  if (componentIds.length === 0) return;
  await jira(`/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        components: componentIds.map((id) => ({ id })),
      },
    }),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }
  console.log(`Project: ${PROJECT_KEY}${DRY_RUN ? " (dry-run)" : ""}\n`);
  const componentIdsByName = await ensureComponents();
  const issues = await searchAllIssues();
  console.log(`Issues: ${issues.length}\n`);
  let assigned = 0;
  let skipped = 0;
  for (const issue of issues) {
    const ids = inferComponents(issue, componentIdsByName);
    if (ids.length === 0) {
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`${issue.key}: ${ids.length} component(s)`);
      assigned++;
      continue;
    }
    try {
      await assignComponentsToIssue(issue.key, ids);
      assigned++;
    } catch (e) {
      console.error(`${issue.key}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${assigned} issues with components, ${skipped} skipped`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Move para "Feito" todas as issues do GAQNO que ainda não estão concluídas
 * (Épicos, Histórias, Tasks, Subtasks). Uso: aplicações já em produção.
 *
 * Usage:
 *   node scripts/jira-move-to-done.mjs [--project=GAQNO] [--dry-run]
 *   node scripts/jira-move-to-done.mjs --execute
 *
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env)
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
const dryRun = !args.includes("--execute");

const TRANSITION_FEITO = "61";

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString(
  "base64"
);

async function jira(pathname, opts = {}) {
  const res = await fetch(`${JIRA_URL}${pathname}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...opts.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function fetchAllNotDone() {
  const jql = `project = ${PROJECT_KEY} AND (issuetype = Epic OR issuetype = Story OR issuetype IN (Task, Sub-task)) AND statusCategory != Done ORDER BY key ASC`;
  const issues = [];
  let nextPageToken;
  const pageSize = 100;
  do {
    const body = {
      jql,
      maxResults: pageSize,
      fields: ["key", "issuetype", "status", "parent"],
    };
    if (nextPageToken) body.nextPageToken = nextPageToken;
    const data = await jira("/rest/api/3/search/jql", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const page = data.issues || [];
    issues.push(...page);
    nextPageToken = data.isLast ? null : data.nextPageToken;
  } while (nextPageToken);
  return issues;
}

function sortForTransition(issues) {
  const byKey = new Map(issues.map((i) => [i.key, i]));
  const level = (k) => {
    const parentKey = byKey.get(k)?.fields?.parent?.key;
    return parentKey ? level(parentKey) + 1 : 0;
  };
  return [...issues].sort((a, b) => level(b.key) - level(a.key));
}

async function transitionIssue(issueKey) {
  return jira(`/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: TRANSITION_FEITO } }),
  });
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN (e.g. .env.jira)");
    process.exit(1);
  }

  console.log(`Project: ${PROJECT_KEY}  ${dryRun ? "(dry-run)" : "EXECUTE"}\n`);

  const issues = await fetchAllNotDone();
  const sorted = sortForTransition(issues);

  console.log(`Issues não concluídas: ${sorted.length}`);

  if (dryRun) {
    sorted.slice(0, 30).forEach((i) => {
      const type = i.fields?.issuetype?.name ?? "?";
      const status = i.fields?.status?.name ?? "?";
      console.log(`  ${i.key}  [${type}]  ${status}  → Feito`);
    });
    if (sorted.length > 30)
      console.log(
        `  ... e mais ${sorted.length - 30} issues. Rode com --execute para aplicar.`
      );
    return;
  }

  let ok = 0;
  let err = 0;
  for (const issue of sorted) {
    try {
      await transitionIssue(issue.key);
      ok++;
      const type = issue.fields?.issuetype?.name ?? "?";
      console.log(`  ${issue.key}  [${type}]  → Feito`);
    } catch (e) {
      err++;
      console.error(`  ${issue.key}  ERRO: ${e.message}`);
    }
  }
  console.log(`\nConcluído: ${ok}  Erros: ${err}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Move para "Feito" todos os Épicos cujo resumo contém "Módulo" e seus filhos
 * (Histórias e Subtarefas), pois já estão em produção.
 *
 * Usage:
 *   node scripts/jira-move-module-epics-to-done.mjs [--project=GAQNO] [--dry-run]
 *   node scripts/jira-move-module-epics-to-done.mjs --execute
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

async function searchJql(jql, fields = ["key", "issuetype", "status"]) {
  const issues = [];
  let nextPageToken;
  const pageSize = 100;
  do {
    const body = { jql, maxResults: pageSize, fields };
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

const TRANSITION_CHAIN = ["6", "4", "7", "5"];

async function getTransitions(issueKey) {
  const data = await jira(`/rest/api/3/issue/${issueKey}/transitions`);
  return data.transitions || [];
}

async function getIssueStatusCategory(issueKey) {
  const data = await jira(`/rest/api/3/issue/${issueKey}?fields=status`);
  return data.fields?.status?.statusCategory?.key ?? "unknown";
}

async function transitionIssue(issueKey, transitionId) {
  return jira(`/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
}

async function transitionIssueToDone(issueKey) {
  let steps = 0;
  const maxSteps = 10;
  while (steps < maxSteps) {
    const category = await getIssueStatusCategory(issueKey);
    if (category === "done") return true;
    const available = await getTransitions(issueKey);
    const byId = new Map((available || []).map((t) => [String(t.id), t]));
    let applied = false;
    for (const tid of TRANSITION_CHAIN) {
      if (byId.has(tid)) {
        await transitionIssue(issueKey, tid);
        applied = true;
        steps++;
        break;
      }
    }
    if (!applied) return false;
  }
  return (await getIssueStatusCategory(issueKey)) === "done";
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN (e.g. .env.jira)");
    process.exit(1);
  }

  console.log(`Project: ${PROJECT_KEY}  ${dryRun ? "(dry-run)" : "EXECUTE"}\n`);

  const epicJql = `project = ${PROJECT_KEY} AND issuetype = Epic AND summary ~ "Módulo" ORDER BY key ASC`;
  const epics = await searchJql(epicJql, ["key", "summary", "status"]);
  const epicKeys = epics.map((e) => e.key).filter(Boolean);
  if (!epicKeys.length) {
    console.log("Nenhum épico 'Módulo' encontrado.");
    return;
  }
  const epicKeysList = epicKeys.join(", ");

  const storiesJql = `project = ${PROJECT_KEY} AND "Epic Link" IN (${epicKeysList}) AND statusCategory != Done ORDER BY key ASC`;
  const stories = await searchJql(storiesJql);
  const storyKeys = stories.map((s) => s.key).filter(Boolean);
  if (!storyKeys.length) {
    console.log("Nenhuma história sob esses épicos não concluída.");
  }
  const storyKeysList = storyKeys.join(", ");

  let subtasks = [];
  if (storyKeys.length > 0) {
    const subtasksJql = `project = ${PROJECT_KEY} AND issuetype IN (Task, Sub-task) AND parent IN (${storyKeysList}) AND statusCategory != Done ORDER BY key ASC`;
    subtasks = await searchJql(subtasksJql);
  }

  const epicsNotDoneJql = `project = ${PROJECT_KEY} AND key IN (${epicKeysList}) AND statusCategory != Done ORDER BY key ASC`;
  const epicsToClose = await searchJql(epicsNotDoneJql, [
    "key",
    "summary",
    "issuetype",
    "status",
  ]);

  const toTransition = [...subtasks, ...stories, ...epicsToClose];
  console.log(
    `Épicos Módulo: ${epicKeys.length}  |  Histórias não concluídas: ${stories.length}  |  Subtarefas não concluídas: ${subtasks.length}  |  Épicos a fechar: ${epicsToClose.length}`
  );
  console.log(`Total a mover para Feito: ${toTransition.length}\n`);

  if (dryRun) {
    toTransition.slice(0, 25).forEach((i) => {
      const type = i.fields?.issuetype?.name ?? "?";
      const status = i.fields?.status?.name ?? "?";
      console.log(`  ${i.key}  [${type}]  ${status}  → Feito`);
    });
    if (toTransition.length > 25)
      console.log(
        `  ... e mais ${toTransition.length - 25} issues. Rode com --execute para aplicar.`
      );
    return;
  }

  let ok = 0;
  let err = 0;
  for (const issue of toTransition) {
    try {
      const done = await transitionIssueToDone(issue.key);
      if (done) {
        ok++;
        const type = issue.fields?.issuetype?.name ?? "?";
        console.log(`  ${issue.key}  [${type}]  → Concluído`);
      } else {
        err++;
        console.error(
          `  ${issue.key}  não foi possível concluir (fluxo sem transição disponível)`
        );
      }
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

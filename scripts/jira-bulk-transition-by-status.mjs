#!/usr/bin/env node
/**
 * Migra issues em lote de status antigos para os 3 alvo: Backlog, Em andamento, Concluído.
 * Uso: esvaziar status antes de simplificar o workflow no Jira.
 *
 * Usage:
 *   node scripts/jira-bulk-transition-by-status.mjs --dry-run
 *   node scripts/jira-bulk-transition-by-status.mjs
 *   node scripts/jira-bulk-transition-by-status.mjs --status="Code Review"
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
const dryRun = args.includes("--dry-run");
const statusFilter = args
  .find((a) => a.startsWith("--status="))
  ?.split("=")
  .slice(1)
  .join("=")
  ?.replace(/^["']|["']$/g, "");

const STATUS_MAPPING = [
  { from: "Pending Production", to: "Concluído" },
  { from: "Pronto", to: "Concluído" },
  { from: "Ready", to: "Concluído" },
  { from: "Concluída", to: "Concluído" },
  { from: "Resolvido", to: "Concluído" },
  { from: "Fechada", to: "Concluído" },
  { from: "Code Review", to: "Em andamento" },
  { from: "Develop Validated", to: "Em andamento" },
  { from: "Pronto", to: "Backlog" },
  { from: "Ready", to: "Backlog" },
];

const normalized = (s) => (s || "").trim().toLowerCase();

function findTransitionTo(transitions, targetStatusName) {
  const want = normalized(targetStatusName);
  return (transitions || []).find(
    (t) => t.to && normalized(t.to.name) === want
  );
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN (or .env.jira / .env)");
    process.exit(1);
  }

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

  const mapping = statusFilter
    ? STATUS_MAPPING.filter(
        (m) => normalized(m.from) === normalized(statusFilter)
      )
    : STATUS_MAPPING;

  if (mapping.length === 0) {
    console.error("No mapping for --status=", statusFilter);
    process.exit(1);
  }

  console.log(`Project: ${PROJECT_KEY}${dryRun ? " (dry-run)" : ""}\n`);

  const stats = { found: 0, transitioned: 0, noTransition: 0, error: 0 };

  for (const { from: fromStatus, to: toStatus } of mapping) {
    let nextPageToken;
    const maxResults = 50;
    let totalInStatus = 0;
    let doneInStatus = 0;
    let skippedInStatus = 0;
    let errInStatus = 0;

    while (true) {
      const jql = `project = ${PROJECT_KEY} AND status = "${fromStatus}"`;
      const body = {
        jql,
        maxResults,
        fields: ["key", "status"],
      };
      if (nextPageToken) body.nextPageToken = nextPageToken;
      const data = await jira("/rest/api/3/search/jql", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const issues = data.issues || [];
      totalInStatus += issues.length;
      if (issues.length === 0) break;

      for (const issue of issues) {
        const key = issue.key;
        stats.found++;
        try {
          const trRes = await jira(`/rest/api/3/issue/${key}/transitions`);
          const t = findTransitionTo(trRes.transitions, toStatus);
          if (!t) {
            console.log(`  ${key}: no transition to "${toStatus}" (skip)`);
            stats.noTransition++;
            skippedInStatus++;
            continue;
          }
          if (!dryRun) {
            await jira(`/rest/api/3/issue/${key}/transitions`, {
              method: "POST",
              body: JSON.stringify({ transition: { id: t.id } }),
            });
          }
          console.log(
            `  ${key}: ${fromStatus} → ${toStatus}${dryRun ? " (dry-run)" : ""}`
          );
          stats.transitioned++;
          doneInStatus++;
        } catch (e) {
          console.error(`  ${key}: ${e.message || e}`);
          stats.error++;
          errInStatus++;
        }
      }

      nextPageToken = data.nextPageToken;
      if (data.isLast || !nextPageToken) break;
    }

    if (totalInStatus > 0) {
      console.log(
        `${fromStatus} → ${toStatus}: ${totalInStatus} found, ${doneInStatus} transitioned, ${skippedInStatus} no transition, ${errInStatus} errors\n`
      );
    }
  }

  console.log(
    `Done. Total: ${stats.found} found, ${stats.transitioned} transitioned, ${stats.noTransition} no transition, ${stats.error} errors.`
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

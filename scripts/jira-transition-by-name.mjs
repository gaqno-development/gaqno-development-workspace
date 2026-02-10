#!/usr/bin/env node
/**
 * Transiciona um issue para um status pelo nome (ex.: "Em andamento", "Concluído").
 * Uso: automações GitHub + uso manual.
 *
 * Usage:
 *   node scripts/jira-transition-by-name.mjs --issue=GAQNO-123 --to="Em andamento"
 *   node scripts/jira-transition-by-name.mjs --issue=GAQNO-123 --to=done
 *
 * Aliases --to: in-progress|in_progress|em andamento|fazendo → Em andamento;
 *             done|feito|concluído → Concluído (GAQNO usa Backlog | Em andamento | Concluído)
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
const issueKey = args.find((a) => a.startsWith("--issue="))?.split("=")[1];
const toRaw = args
  .find((a) => a.startsWith("--to="))
  ?.split("=")
  .slice(1)
  .join("=")
  ?.replace(/^["']|["']$/g, "");

const ALIAS_TO_TARGET = {
  "in-progress": "Em andamento",
  in_progress: "Em andamento",
  "em andamento": "Em andamento",
  fazendo: "Em andamento",
  done: "Concluído",
  feito: "Concluído",
  concluído: "Concluído",
  "in review": "Em revisão",
  "em revisão": "Em revisão",
};
const TARGET_PATTERNS = {
  "Em andamento": /em\s*andamento|fazendo|in\s*progress/i,
  Concluído: /concluído|feito|done|resolvido/i,
  "Em revisão": /em\s*revisão|in\s*review|code\s*review/i,
};

function resolveTarget(name) {
  const lower = (name || "").trim().toLowerCase();
  if (ALIAS_TO_TARGET[lower]) return ALIAS_TO_TARGET[lower];
  for (const [target] of Object.entries(TARGET_PATTERNS)) {
    if (target.toLowerCase() === lower) return target;
  }
  return name?.trim() || null;
}

async function main() {
  if (!issueKey || !toRaw) {
    console.error(
      "Usage: node jira-transition-by-name.mjs --issue=KEY --to=STATUS"
    );
    process.exit(1);
  }
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN (or .env.jira / .env)");
    process.exit(1);
  }

  const targetName = resolveTarget(toRaw);
  if (!targetName) {
    console.error("Unknown --to value:", toRaw);
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

  const transitionsRes = await jira(
    `/rest/api/3/issue/${issueKey}/transitions`
  );
  const transitions = transitionsRes.transitions || [];
  const pattern =
    TARGET_PATTERNS[targetName] ||
    new RegExp(targetName.replace(/\s+/g, "\\s+"), "i");
  const t = transitions.find((x) => pattern.test(x.name || ""));
  if (!t) {
    const names =
      transitions.map((x) => x.name).join(", ") || "(nenhuma disponível)";
    console.error(
      `Issue ${issueKey}: no transition matching "${targetName}". Available: ${names}`
    );
    process.exit(1);
  }

  await jira(`/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: t.id } }),
  });
  console.log(`${issueKey} → ${t.name} (${t.id})`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

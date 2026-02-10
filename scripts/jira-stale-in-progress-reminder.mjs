#!/usr/bin/env node
/**
 * Comenta em issues que estão "Em andamento" / "Fazendo" há mais de N dias
 * (lembrete para atualizar status ou concluir).
 *
 * Usage:
 *   node scripts/jira-stale-in-progress-reminder.mjs [--days=5] [--dry-run] [--project=GAQNO]
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
const days = Number(
  args.find((a) => a.startsWith("--days="))?.split("=")[1] || 5
);
const dryRun = args.includes("--dry-run");
const project =
  args.find((a) => a.startsWith("--project="))?.split("=")[1] ||
  process.env.JIRA_PROJECT_KEY ||
  "GAQNO";

const REMINDER_MARKER = "[Lembrete automático: em andamento há mais de";
const REMINDER_BODY = (d) =>
  `${REMINDER_MARKER} ${d} dias]\n\nEste item está em andamento há mais de ${d} dias. Atualize o status ou mova para Concluído.`;

function parseAdfToText(node) {
  if (!node) return "";
  if (node.type === "text" && node.text) return node.text;
  if (node.content) return node.content.map(parseAdfToText).join("");
  return "";
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

  const jql = `project = ${project} AND status = "Em andamento" AND updated < -${days}d ORDER BY updated ASC`;
  const searchRes = await jira("/rest/api/3/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql,
      maxResults: 100,
      fields: ["summary", "updated", "status"],
    }),
  });
  const issues = searchRes.issues || [];
  console.log(`Issues em andamento há mais de ${days} dias:`, issues.length);
  if (issues.length === 0) return;

  let commented = 0;
  for (const issue of issues) {
    const commentsRes = await jira(
      `/rest/api/3/issue/${issue.key}/comment?orderBy=-created&maxResults=5`
    );
    const comments = commentsRes.comments || [];
    const alreadyReminded = comments.some((c) => {
      const body = c.body?.content
        ? parseAdfToText(c.body)
        : String(c.body || "");
      return body.includes(REMINDER_MARKER);
    });
    if (alreadyReminded) continue;

    const bodyAdf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: REMINDER_BODY(days) }],
        },
      ],
    };
    if (dryRun) {
      console.log(
        "  [dry-run] would comment on",
        issue.key,
        issue.fields?.summary?.slice(0, 50)
      );
      commented++;
      continue;
    }
    try {
      await jira(`/rest/api/3/issue/${issue.key}/comment`, {
        method: "POST",
        body: JSON.stringify({ body: bodyAdf }),
      });
      console.log("  commented:", issue.key);
      commented++;
    } catch (e) {
      console.warn("  skip", issue.key, e.message);
    }
  }
  console.log("Commented:", commented);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

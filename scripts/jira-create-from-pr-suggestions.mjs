#!/usr/bin/env node

import fs from "fs";
import path from "path";

const MAX_SUMMARY_LENGTH = 255;
const PROJECT_KEY = "GAQNO";
const DEFAULT_JIRA_URL = "https://gaqno.atlassian.net";

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

function loadJiraEnv() {
  loadEnvFile(".env.jira");
  loadEnvFile(".env");
  const baseUrl = (process.env.JIRA_URL || DEFAULT_JIRA_URL)
    .trim()
    .replace(/\/$/, "");
  const username = process.env.JIRA_USERNAME;
  const apiToken = process.env.JIRA_API_TOKEN;
  if (!username || !apiToken) {
    throw new Error(
      "Set JIRA_USERNAME and JIRA_API_TOKEN (or .env.jira / .env)"
    );
  }
  const auth = Buffer.from(`${username}:${apiToken}`).toString("base64");
  return { baseUrl, auth };
}

async function jira(env, pathname, opts = {}) {
  const res = await fetch(`${env.baseUrl}${pathname}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${env.auth}`,
      ...opts.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getIssueLinkTypes(env) {
  const data = await jira(env, "/rest/api/3/issueLinkType");
  return data.issueLinkTypes ?? [];
}

async function createIssueLink(env, inwardKey, outwardKey, linkTypeName) {
  const types = await getIssueLinkTypes(env);
  const name = (linkTypeName || "").trim().toLowerCase();
  const linkType = types.find(
    (t) =>
      t.name?.toLowerCase() === name ||
      t.inward?.toLowerCase() === name ||
      t.outward?.toLowerCase() === name
  );
  if (!linkType)
    throw new Error(
      `Link type "${linkTypeName}" not found. Available: ${types.map((t) => t.name).join(", ")}`
    );
  return jira(env, "/rest/api/3/issueLink", {
    method: "POST",
    body: JSON.stringify({
      type: { name: linkType.name },
      inwardIssue: { key: inwardKey },
      outwardIssue: { key: outwardKey },
    }),
  });
}

function readCommentBody() {
  const filePath = process.env.PR_AGENT_COMMENT_FILE;
  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf8");
  }
  return process.env.PR_AGENT_COMMENT_BODY || "";
}

function getEnv() {
  if (
    process.env.JIRA_URL &&
    process.env.JIRA_USERNAME &&
    process.env.JIRA_API_TOKEN
  ) {
    const baseUrl = process.env.JIRA_URL.trim().replace(/\/$/, "");
    const auth = Buffer.from(
      `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64");
    return { baseUrl, auth };
  }
  return loadJiraEnv();
}

function parseTable(commentBody) {
  const markers = [
    "PR Code Suggestions",
    "Explore these optional code suggestions",
  ];
  const hasMarker = markers.some((m) => (commentBody || "").includes(m));
  if (!hasMarker || !commentBody) return [];

  const lines = commentBody.split(/\r?\n/);
  const rows = [];
  let inTable = false;
  let headerSeen = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
      if (inTable) break;
      continue;
    }
    const cells = trimmed
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());
    if (cells.some((c) => /^[-:\s]+$/.test(c))) {
      headerSeen = true;
      continue;
    }
    const lower = cells.join(" ").toLowerCase();
    if (
      lower.includes("category") &&
      lower.includes("suggestion") &&
      lower.includes("impact")
    ) {
      inTable = true;
      headerSeen = true;
      continue;
    }
    if (!headerSeen) continue;
    inTable = true;
    if (cells.length >= 2) {
      const category = cells[0] ?? "";
      const suggestion = cells.length >= 3 ? cells[1] : cells[0];
      const impact = cells.length >= 3 ? cells[2] : (cells[1] ?? "");
      if (suggestion) rows.push({ category, suggestion, impact });
    }
  }
  return rows;
}

function buildDescription(category, impact, prUrl) {
  const parts = [];
  if (category) parts.push(`Category: ${category}`);
  if (impact) parts.push(`Impact: ${impact}`);
  if (prUrl) parts.push(`PR: ${prUrl}`);
  const text = parts.join("\n");
  if (!text) return undefined;
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

async function createTask(env, summary, description, prUrl) {
  const body = {
    fields: {
      project: { key: PROJECT_KEY },
      issuetype: { name: "Task" },
      summary:
        summary.length > MAX_SUMMARY_LENGTH
          ? summary.slice(0, MAX_SUMMARY_LENGTH - 3) + "..."
          : summary,
      ...(description && {
        description: buildDescription(
          description.category,
          description.impact,
          prUrl
        ),
      }),
    },
  };
  return jira(env, "/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function main() {
  const commentBody = readCommentBody();
  const prUrl = process.env.PR_URL || "";
  const parentKey = process.env.PARENT_ISSUE_KEY || "";

  if (!commentBody) {
    console.error(
      "Set PR_AGENT_COMMENT_BODY or PR_AGENT_COMMENT_FILE with the PR Agent suggestions comment."
    );
    process.exit(1);
  }

  const suggestions = parseTable(commentBody);
  if (suggestions.length === 0) {
    console.error("No suggestions to create.");
    process.exit(1);
  }

  const env = getEnv();
  const created = [];

  for (const { category, suggestion, impact } of suggestions) {
    const desc = { category, impact };
    const res = await createTask(env, suggestion, desc, prUrl);
    created.push(res.key);
    if (parentKey && parentKey !== res.key) {
      try {
        await createIssueLink(env, res.key, parentKey, "Relates");
      } catch (_) {}
    }
  }

  for (const key of created) {
    console.log(key);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

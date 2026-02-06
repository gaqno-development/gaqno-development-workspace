#!/usr/bin/env node

import fs from "fs";
import { loadJiraEnv, jira, createIssueLink } from "./jira-rest-utils.mjs";

const MAX_SUMMARY_LENGTH = 255;
const PROJECT_KEY = "GAQNO";

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

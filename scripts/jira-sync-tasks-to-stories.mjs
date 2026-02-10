#!/usr/bin/env node
/**
 * Sync all Tasks (parent = Epic) to Subtasks under the corresponding Story.
 * Epic → Story: 49→54, 50→58, 51→55, 52→56, 53→57. (51→55 é a História legada; GAQNO-51 Products tem Histórias próprias, ex. GAQNO-117/119/121/122.)
 * Copies summary and description; adds "Synced from KEY-xx" in description for traceability.
 * Idempotent: skips if a Subtask under that Story already has the same summary (or synced from same key).
 *
 * Usage: node scripts/jira-sync-tasks-to-stories.mjs [--project=GAQNO] [--dry-run]
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

const EPIC_TO_STORY = {
  [`${PROJECT_KEY}-49`]: `${PROJECT_KEY}-54`,
  [`${PROJECT_KEY}-50`]: `${PROJECT_KEY}-58`,
  [`${PROJECT_KEY}-51`]: `${PROJECT_KEY}-55`,
  [`${PROJECT_KEY}-52`]: `${PROJECT_KEY}-56`,
  [`${PROJECT_KEY}-53`]: `${PROJECT_KEY}-57`,
};

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

async function searchJql(jql, fields = "key,summary", maxResults = 100) {
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

async function getAllTasksWithEpicParent(projectKey) {
  const epicKeys = Object.keys(EPIC_TO_STORY).join(", ");
  const jql = `project = ${projectKey} AND issuetype = Task AND parent in (${epicKeys}) ORDER BY key ASC`;
  const issues = await searchJql(jql, "key,summary,description,parent", 200);
  return issues;
}

function buildSubtaskDescription(taskKey, existingDescription) {
  const syncedLine = `Synced from ${taskKey}.`;
  if (!existingDescription || typeof existingDescription !== "string") {
    return syncedLine;
  }
  const body =
    typeof existingDescription === "string"
      ? existingDescription
      : existingDescription?.content
        ? (existingDescription.content || [])
            .filter((b) => b.type === "paragraph")
            .map((p) =>
              (p.content || [])
                .filter((c) => c.type === "text")
                .map((t) => t.text || "")
                .join("")
            )
            .join("\n\n")
        : "";
  return `${body}\n\n---\n${syncedLine}`;
}

function stringToAdf(plainText) {
  if (!plainText || !plainText.trim()) return undefined;
  const paragraphs = plainText
    .trim()
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paragraphs.length) return undefined;
  return {
    type: "doc",
    version: 1,
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

async function createSubtask(projectKey, parentStoryKey, summary, description) {
  const body = {
    fields: {
      project: { key: projectKey },
      parent: { key: parentStoryKey },
      issuetype: { id: "10041" },
      summary,
    },
  };
  const adf = stringToAdf(description);
  if (adf) body.fields.description = adf;
  return jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getExistingSubtaskSummariesUnderStory(storyKey) {
  const jql = `project = ${PROJECT_KEY} AND issuetype = 10041 AND parent = ${storyKey}`;
  const issues = await searchJql(jql, "summary,description", 500);
  const bySummary = new Set(
    issues.map((i) => (i.fields?.summary || "").trim())
  );
  const bySyncedFrom = new Set();
  for (const i of issues) {
    const desc = i.fields?.description;
    const raw =
      typeof desc === "string"
        ? desc
        : desc?.content
          ? (desc.content || [])
              .flatMap((b) => b.content || [])
              .filter((c) => c.type === "text")
              .map((c) => c.text)
              .join(" ")
          : "";
    const m = raw.match(/Synced from ([A-Z]+-\d+)/);
    if (m) bySyncedFrom.add(m[1]);
  }
  return { bySummary, bySyncedFrom };
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN");
    process.exit(1);
  }

  const tasks = await getAllTasksWithEpicParent(PROJECT_KEY);
  if (!tasks.length) {
    console.log("No Tasks with parent Epic found in " + PROJECT_KEY);
    return;
  }

  const storyKeys = [...new Set(Object.values(EPIC_TO_STORY))];
  const existingByStory = new Map();
  for (const sk of storyKeys) {
    existingByStory.set(sk, await getExistingSubtaskSummariesUnderStory(sk));
  }

  let created = 0;
  let skipped = 0;

  for (const task of tasks) {
    const taskKey = task.key;
    const parentKey = task.fields?.parent?.key;
    const storyKey = EPIC_TO_STORY[parentKey];
    if (!storyKey) {
      console.warn(`${taskKey}: unknown parent ${parentKey}, skip`);
      skipped++;
      continue;
    }

    const summary = (task.fields?.summary || "").trim() || taskKey;
    const existing = existingByStory.get(storyKey);
    if (existing.bySyncedFrom.has(taskKey)) {
      skipped++;
      continue;
    }
    if (existing.bySummary.has(summary)) {
      skipped++;
      continue;
    }

    const rawDesc = task.fields?.description;
    const plainDesc =
      typeof rawDesc === "string"
        ? rawDesc
        : rawDesc?.content
          ? (rawDesc.content || [])
              .flatMap((b) => b.content || [])
              .filter((c) => c.type === "text")
              .map((c) => c.text || "")
              .join("\n")
          : "";
    const description = buildSubtaskDescription(taskKey, plainDesc);

    if (dryRun) {
      console.log(`[dry-run] ${taskKey} → ${storyKey}: ${summary}`);
      created++;
      continue;
    }

    const createdIssue = await createSubtask(
      PROJECT_KEY,
      storyKey,
      summary,
      description
    );
    existing.bySummary.add(summary);
    existing.bySyncedFrom.add(taskKey);
    console.log(
      `${taskKey} → ${createdIssue.key} under ${storyKey}: ${summary}`
    );
    created++;
  }

  console.log(
    `\nDone. Created: ${created}, skipped (already synced): ${skipped}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

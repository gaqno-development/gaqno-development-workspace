#!/usr/bin/env node
/**
 * Bulk move Jira issues from one project to another via REST API.
 * Uses same credentials as MCP (JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN).
 *
 * Usage:
 *   node scripts/jira-bulk-move-to-project.mjs [--source=KAN] [--target=PROJ] [--dry-run]
 *   node scripts/jira-bulk-move-to-project.mjs [--source=KAN] [--target=PROJ] --preserve-hierarchy
 *
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (or .env.jira). Optional: JIRA_SOURCE_PROJECT, JIRA_TARGET_PROJECT.
 * --preserve-hierarchy: move Epics first, then Stories/Tasks (linked to Epic), then Subtasks (linked to Story); keeps parent links. Recommended for cross-project move; default run uses the same hierarchy order so subtasks get the correct new parent.
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

function parseArgs() {
  const args = process.argv.slice(2);
  const source =
    args.find((a) => a.startsWith("--source="))?.split("=")[1] ??
    process.env.JIRA_SOURCE_PROJECT ??
    "KAN";
  const target =
    args.find((a) => a.startsWith("--target="))?.split("=")[1] ??
    process.env.JIRA_TARGET_PROJECT ??
    "GAQNO";
  const dryRun = args.includes("--dry-run");
  const preserveHierarchy = args.includes("--preserve-hierarchy");
  return { source, target, dryRun, preserveHierarchy };
}

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

async function searchIssues(projectKey, nextPageToken, maxResults = 100) {
  const body = {
    jql: `project = ${projectKey} ORDER BY key ASC`,
    maxResults,
    fields: ["issuetype", "parent"],
  };
  if (nextPageToken) body.nextPageToken = nextPageToken;
  return jira("/rest/api/3/search/jql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getAllIssuesWithParent(projectKey) {
  const list = [];
  let nextPageToken;
  let data;
  do {
    data = await searchIssues(projectKey, nextPageToken);
    for (const issue of data.issues || []) {
      const typeName = issue.fields?.issuetype?.name || "Unknown";
      const parentKey = issue.fields?.parent?.key || null;
      list.push({ key: issue.key, typeName, parentKey });
    }
    nextPageToken = data.nextPageToken;
  } while (nextPageToken && !data.isLast);
  return list;
}

function groupByType(issues) {
  const byType = new Map();
  for (const issue of issues) {
    const name = issue.typeName;
    if (!byType.has(name)) byType.set(name, []);
    byType.get(name).push(issue.key);
  }
  return byType;
}

const TYPE_NAME_ALIASES = {
  Epic: ["Épico", "Epic"],
  Story: ["História", "Story"],
  Task: ["Tarefa", "Task"],
  Subtask: ["Sub-tarefa", "Subtask"],
  Bug: ["Bug"],
};

function resolveTargetTypeId(sourceTypeName, targetTypes) {
  if (targetTypes[sourceTypeName]) return targetTypes[sourceTypeName];
  const aliases = TYPE_NAME_ALIASES[sourceTypeName];
  if (aliases) {
    for (const name of aliases) {
      if (targetTypes[name]) return targetTypes[name];
    }
  }
  const names = Object.keys(targetTypes);
  return names.length ? targetTypes[names[0]] : null;
}

async function getProjectIssueTypes(projectKey) {
  const project = await jira(
    `/rest/api/3/project/${projectKey}?expand=issueTypes`
  );
  const types = project.issueTypes || [];
  return Object.fromEntries(types.map((t) => [t.name, t.id]));
}

function buildMoveKey(targetProject, targetTypeId, parentKey) {
  return parentKey
    ? `${targetProject},${targetTypeId},${parentKey}`
    : `${targetProject},${targetTypeId}`;
}

async function bulkMove(
  targetProject,
  targetTypeId,
  issueKeys,
  dryRun,
  parentKey = null
) {
  if (issueKeys.length === 0) return null;
  const key = buildMoveKey(targetProject, targetTypeId, parentKey);
  const body = {
    sendBulkNotification: false,
    targetToSourcesMapping: {
      [key]: {
        issueIdsOrKeys: issueKeys,
        inferFieldDefaults: true,
        inferStatusDefaults: true,
        inferClassificationDefaults: true,
        inferSubtaskTypeDefault: true,
      },
    },
  };
  if (dryRun) {
    console.log(`[dry-run] Would move ${issueKeys.length} issues to ${key}`);
    return { taskId: "dry-run" };
  }
  const res = await fetch(`${JIRA_URL}/rest/api/3/bulk/issues/move`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Bulk move ${res.status}: ${text}`);
  return JSON.parse(text || "{}");
}

async function moveBatchAndBuildKeyMap(
  targetProject,
  targetTypeId,
  oldKeys,
  keyMap,
  dryRun,
  parentKey
) {
  if (oldKeys.length === 0) return keyMap;
  const { taskId } = await bulkMove(
    targetProject,
    targetTypeId,
    oldKeys,
    dryRun,
    parentKey
  );
  if (dryRun || taskId === "dry-run") return keyMap;
  const result = await pollBulkTask(taskId);
  const newIds = result.processedAccessibleIssues || [];
  for (let i = 0; i < oldKeys.length && i < newIds.length; i++) {
    const issue = await jira(`/rest/api/3/issue/${newIds[i]}?fields=key`);
    keyMap[oldKeys[i]] = issue.key;
  }
  return keyMap;
}

async function pollBulkTask(taskId, maxWaitMs = 120000) {
  const step = 2000;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await jira(`/rest/api/3/bulk/queue/${taskId}`);
    if (status.status === "COMPLETE") return status;
    if (status.status === "FAILED" || status.status === "CANCELLED")
      throw new Error(`Bulk task ${status.status}: ${JSON.stringify(status)}`);
    await new Promise((r) => setTimeout(r, step));
  }
  throw new Error("Bulk move timeout");
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function runPreserveHierarchy(source, target, targetTypes, dryRun) {
  const issues = await getAllIssuesWithParent(source);
  if (issues.length === 0) {
    console.log("No issues found in source project.");
    return;
  }
  const epicTypeId = resolveTargetTypeId("Epic", targetTypes);
  const storyTypeId =
    resolveTargetTypeId("Story", targetTypes) ||
    resolveTargetTypeId("Task", targetTypes);
  const subtaskTypeId = resolveTargetTypeId("Subtask", targetTypes);
  const EPIC_NAMES = new Set(["Epic", "Épico"]);
  const STORY_TASK_NAMES = new Set(["Story", "História", "Task", "Tarefa"]);
  const SUBTASK_NAMES = new Set(["Subtask", "Sub-tarefa"]);
  const isEpic = (i) => EPIC_NAMES.has(i.typeName);
  const isStoryOrTask = (i) => STORY_TASK_NAMES.has(i.typeName);
  const isSubtask = (i) => SUBTASK_NAMES.has(i.typeName);
  const epics = issues.filter(isEpic).map((i) => i.key);
  const stories = issues.filter(isStoryOrTask);
  const subtasks = issues.filter(isSubtask);
  const keyMap = {};
  const BATCH = 1000;
  if (epicTypeId && epics.length > 0) {
    console.log(`Phase 1: Moving ${epics.length} Epic(s)...`);
    for (const batch of chunk(epics, BATCH)) {
      await moveBatchAndBuildKeyMap(
        target,
        epicTypeId,
        batch,
        keyMap,
        dryRun,
        null
      );
      if (!dryRun)
        console.log(
          `  Moved ${batch.length} epic(s), keyMap size: ${Object.keys(keyMap).length}`
        );
    }
  }
  const storiesByParent = new Map();
  for (const s of stories) {
    const p = s.parentKey ?? "__none__";
    if (!storiesByParent.has(p)) storiesByParent.set(p, []);
    storiesByParent.get(p).push(s.key);
  }
  if (storyTypeId && stories.length > 0) {
    console.log(
      `Phase 2: Moving ${stories.length} Story/Task(s) (with Epic parent link)...`
    );
    for (const [parentKey, keys] of storiesByParent) {
      const targetParent = parentKey === "__none__" ? null : keyMap[parentKey];
      if (parentKey !== "__none__" && targetParent == null) continue;
      for (const batch of chunk(keys, BATCH)) {
        await moveBatchAndBuildKeyMap(
          target,
          storyTypeId,
          batch,
          keyMap,
          dryRun,
          targetParent
        );
      }
    }
    if (!dryRun) console.log(`  KeyMap size: ${Object.keys(keyMap).length}`);
  }
  const subtasksByParent = new Map();
  for (const s of subtasks) {
    const p = s.parentKey ?? "__none__";
    if (!subtasksByParent.has(p)) subtasksByParent.set(p, []);
    subtasksByParent.get(p).push(s.key);
  }
  if (subtaskTypeId && subtasks.length > 0) {
    console.log(
      `Phase 3: Moving ${subtasks.length} Subtask(s) (with Story/Task parent link)...`
    );
    for (const [parentKey, keys] of subtasksByParent) {
      const targetParent = keyMap[parentKey];
      if (targetParent == null) continue;
      for (const batch of chunk(keys, BATCH)) {
        await moveBatchAndBuildKeyMap(
          target,
          subtaskTypeId,
          batch,
          keyMap,
          dryRun,
          targetParent
        );
      }
    }
  }
  console.log(
    "\nBulk move (hierarchy preserved) finished. Check project",
    target,
    "in Jira."
  );
}

async function main() {
  const { source, target, dryRun, preserveHierarchy } = parseArgs();
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error(
      "Missing JIRA_USERNAME or JIRA_API_TOKEN. Set them in one of:\n" +
        "  • .env.jira or .env in the workspace root (JIRA_USERNAME=..., JIRA_API_TOKEN=...)\n" +
        "  • Shell: export JIRA_USERNAME=... JIRA_API_TOKEN=..."
    );
    process.exit(1);
  }

  console.log(
    `Source project: ${source}, target: ${target}${dryRun ? " (dry-run)" : ""}${preserveHierarchy ? " (preserve Epic→Story→Subtask)" : ""}\n`
  );

  const targetTypes = await getProjectIssueTypes(target);
  const targetTypeNames = Object.keys(targetTypes);
  console.log(
    `Target ${target} issue types: ${targetTypeNames.join(", ") || "(none)"}\n`
  );

  await runPreserveHierarchy(source, target, targetTypes, dryRun);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

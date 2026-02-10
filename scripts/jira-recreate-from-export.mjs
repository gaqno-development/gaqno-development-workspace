#!/usr/bin/env node
/**
 * Recreate hierarchy in GAQNO from jira-export.json.
 *
 * Default: Epic (from export) → Story → optional Subtask per Story.
 *
 * With --structure=product: Epic = product (e.g. "Módulo de AI"), Story = Frontend | Backend,
 * Task under Story (from export components), Subtask under each Task.
 *
 * Usage:
 *   node scripts/jira-recreate-from-export.mjs [--project=GAQNO] [--dry-run]
 *   node scripts/jira-recreate-from-export.mjs [--project=GAQNO] --with-subtasks
 *   node scripts/jira-recreate-from-export.mjs [--project=GAQNO] --structure=product [--dry-run]
 *
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (or .env.jira / .env).
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

function parseArgs() {
  const args = process.argv.slice(2);
  const project =
    args.find((a) => a.startsWith("--project="))?.split("=")[1] ??
    process.env.JIRA_PROJECT_KEY ??
    "GAQNO";
  const dryRun = args.includes("--dry-run");
  const withSubtasks = args.includes("--with-subtasks");
  const structureProduct =
    args.find((a) => a.startsWith("--structure="))?.split("=")[1] === "product";
  const exportPath =
    args.find((a) => a.startsWith("--export="))?.split("=")[1] ??
    path.join(process.cwd(), "scripts", "jira-export.json");
  const continueOnError = args.includes("--continue-on-error");
  return {
    project,
    dryRun,
    withSubtasks,
    structureProduct,
    exportPath,
    continueOnError,
  };
}

const PRODUCT_LABEL = {
  ai: "AI",
  finance: "Finance",
  rpg: "RPG",
  sso: "SSO",
  pdv: "PDV",
  admin: "Admin",
  saas: "SaaS",
  omnichannel: "Omnichannel",
  shell: "Shell",
  plataforma: "Plataforma",
};

function productDisplayName(productKey) {
  return (
    PRODUCT_LABEL[productKey] ??
    productKey.charAt(0).toUpperCase() + productKey.slice(1)
  );
}

function classifyIssue(issue) {
  const summary = (issue.summary || "").trim();
  const m = summary.match(/gaqno-([a-z]+)-(ui|service)/i);
  if (m) {
    const productKey = m[1].toLowerCase();
    const layer = m[2].toLowerCase() === "ui" ? "Frontend" : "Backend";
    return { productKey, layer, summary, description: issue.description };
  }
  return {
    productKey: "plataforma",
    layer: "Backend",
    summary,
    description: issue.description,
  };
}

function buildProductStructure(issues) {
  const products = new Map();
  for (const issue of issues) {
    const { productKey, layer, summary, description } = classifyIssue(issue);
    if (!products.has(productKey))
      products.set(productKey, {
        name: productDisplayName(productKey),
        frontend: [],
        backend: [],
      });
    const product = products.get(productKey);
    const item = { key: issue.key, summary, description };
    if (layer === "Frontend") product.frontend.push(item);
    else product.backend.push(item);
  }
  return products;
}

const TYPE_NAME_ALIASES = {
  Epic: ["Épico", "Epic"],
  Story: ["História", "Story"],
  Task: ["Tarefa", "Task"],
  Subtask: ["Sub-tarefa", "Subtask"],
  Bug: ["Bug"],
};

function resolveTypeId(wantedName, typeMap) {
  if (typeMap[wantedName]) return typeMap[wantedName];
  const aliases = TYPE_NAME_ALIASES[wantedName];
  if (aliases) {
    for (const name of aliases) {
      if (typeMap[name]) return typeMap[name];
    }
  }
  const keys = Object.keys(typeMap);
  return keys.length ? typeMap[keys[0]] : null;
}

function stringToAdf(plainText) {
  if (!plainText || !String(plainText).trim()) return undefined;
  const paragraphs = String(plainText)
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

function toDescription(desc) {
  if (desc == null) return undefined;
  if (
    typeof desc === "object" &&
    desc.type === "doc" &&
    Array.isArray(desc.content)
  )
    return desc;
  return stringToAdf(typeof desc === "string" ? desc : String(desc));
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

async function getProjectIssueTypes(projectKey) {
  const project = await jira(
    `/rest/api/3/project/${projectKey}?expand=issueTypes`
  );
  const types = project.issueTypes || [];
  const byName = {};
  let subtaskTypeId = null;
  for (const t of types) {
    byName[t.name] = t.id;
    if (t.subtask === true) subtaskTypeId = t.id;
  }
  return { byName, subtaskTypeId };
}

function resolveTypeIds(byName, subtaskTypeId) {
  const epicId = resolveTypeId("Epic", byName);
  const storyId = resolveTypeId("Story", byName);
  const taskId = resolveTypeId("Task", byName);
  const subtaskId = subtaskTypeId ?? resolveTypeId("Subtask", byName);
  return { epicId, storyId, taskId: taskId ?? storyId, subtaskId };
}

async function createIssue(projectKey, fields, dryRun) {
  if (dryRun) return { key: `DRY-${projectKey}-?` };
  const created = await jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        ...fields,
      },
    }),
  });
  return created;
}

async function runProductStructure({
  project,
  issues,
  dryRun,
  continueOnError,
  epicId,
  storyId,
  taskId,
  subtaskId,
  createIssue,
  toDescription,
}) {
  const products = buildProductStructure(issues);
  const productKeys = [...products.keys()].sort();

  console.log(
    `Structure: product (Epic) → Frontend / Backend (Story) → Tasks → Subtasks\n`
  );
  console.log(`Products: ${productKeys.join(", ")}\n`);

  if (dryRun) {
    for (const key of productKeys) {
      const p = products.get(key);
      const total = p.frontend.length + p.backend.length;
      console.log(
        `  Módulo de ${p.name}: ${p.frontend.length} Frontend, ${p.backend.length} Backend (${total} Tasks + ${total} Subtasks)`
      );
    }
    return;
  }

  const epicKeyByProduct = {};
  const storyKeyByProductLayer = {};

  console.log("Phase 1: Creating Epics (products)...");
  for (const key of productKeys) {
    const p = products.get(key);
    const summary = `Módulo de ${p.name}`;
    const fields = {
      issuetype: { id: String(epicId) },
      summary,
    };
    const created = await createIssue(project, fields, false);
    epicKeyByProduct[key] = created.key;
    console.log(`  ${created.key}  ${summary}`);
  }

  console.log("\nPhase 2: Creating Stories (Frontend, Backend)...");
  for (const key of productKeys) {
    const epicKey = epicKeyByProduct[key];
    storyKeyByProductLayer[key] = {};
    for (const layer of ["Frontend", "Backend"]) {
      const fields = {
        issuetype: { id: String(storyId) },
        parent: { key: epicKey },
        summary: layer,
      };
      const created = await createIssue(project, fields, false);
      storyKeyByProductLayer[key][layer] = created.key;
      console.log(`  ${created.key}  ${epicKey} → ${layer}`);
    }
  }

  console.log(
    "\nPhase 3: Creating Tasks (under Story) + one Subtask per Task..."
  );
  for (const key of productKeys) {
    const p = products.get(key);
    const stories = storyKeyByProductLayer[key];
    for (const item of p.frontend) {
      const parentStoryKey = stories.Frontend;
      const taskFields = {
        issuetype: { id: String(taskId) },
        parent: { key: parentStoryKey },
        summary: item.summary,
      };
      const desc = toDescription(item.description);
      if (desc) taskFields.description = desc;
      const taskCreated = await createIssue(project, taskFields, false);
      if (subtaskId) {
        const stFields = {
          issuetype: { id: String(subtaskId) },
          parent: { key: taskCreated.key },
          summary: "Trabalho",
        };
        await createIssue(project, stFields, false);
      }
      console.log(
        `  ${parentStoryKey} → ${taskCreated.key}  ${item.summary.slice(0, 45)}`
      );
    }
    for (const item of p.backend) {
      const parentStoryKey = stories.Backend;
      const taskFields = {
        issuetype: { id: String(taskId) },
        parent: { key: parentStoryKey },
        summary: item.summary,
      };
      const desc = toDescription(item.description);
      if (desc) taskFields.description = desc;
      const taskCreated = await createIssue(project, taskFields, false);
      if (subtaskId) {
        const stFields = {
          issuetype: { id: String(subtaskId) },
          parent: { key: taskCreated.key },
          summary: "Trabalho",
        };
        await createIssue(project, stFields, false);
      }
      console.log(
        `  ${parentStoryKey} → ${taskCreated.key}  ${item.summary.slice(0, 45)}`
      );
    }
  }

  console.log("\nDone (product structure).");
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN in .env.jira or .env");
    process.exit(1);
  }

  const {
    project,
    dryRun,
    withSubtasks,
    structureProduct,
    exportPath,
    continueOnError,
  } = parseArgs();

  if (!fs.existsSync(exportPath)) {
    console.error("Export file not found:", exportPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  const issues = data.issues || [];
  const epics = issues.filter((i) => !i.parent);
  const stories = issues
    .filter((i) => i.parent)
    .sort((a, b) => {
      const pa = a.parent?.key ?? "";
      const pb = b.parent?.key ?? "";
      return pa.localeCompare(pb) || (a.key || "").localeCompare(b.key || "");
    });

  console.log(
    `Target: ${project}${dryRun ? " (dry-run)" : ""}${withSubtasks ? " + subtasks" : ""}${structureProduct ? " [structure=product]" : ""}\n`
  );
  console.log(
    `Export: ${issues.length} issues → ${epics.length} Epics, ${stories.length} Stories\n`
  );

  const { byName, subtaskTypeId } = await getProjectIssueTypes(project);
  const { epicId, storyId, taskId, subtaskId } = resolveTypeIds(
    byName,
    subtaskTypeId
  );

  if (!epicId) {
    console.error("Project has no Epic issue type.");
    process.exit(1);
  }
  if (!storyId) {
    console.error("Project has no Story issue type.");
    process.exit(1);
  }

  if (structureProduct) {
    await runProductStructure({
      project,
      issues,
      dryRun,
      continueOnError,
      epicId,
      storyId,
      taskId,
      subtaskId,
      createIssue,
      toDescription,
    });
    return;
  }

  if (dryRun) {
    console.log("Would create:");
    console.log(
      `  ${epics.length} Epics (e.g. ${epics
        .slice(0, 3)
        .map((e) => e.summary?.slice(0, 40))
        .join("; ")})`
    );
    console.log(`  ${stories.length} Stories under mapped Epics`);
    if (withSubtasks && subtaskId)
      console.log(`  ${stories.length} Subtasks (1 per Story)`);
    else if (withSubtasks && !subtaskId)
      console.log("  (Subtask type not found, skipping subtasks)");
    return;
  }

  const keyMap = {};

  console.log("Phase 1: Creating Epics...");
  for (const epic of epics) {
    try {
      const summary = epic.summary || epic.key || "Epic";
      const description = toDescription(epic.description);
      const fields = {
        issuetype: { id: String(epicId) },
        summary,
      };
      if (description) fields.description = description;
      const created = await createIssue(project, fields, false);
      keyMap[epic.key] = created.key;
      console.log(`  ${epic.key} → ${created.key}  ${summary.slice(0, 50)}`);
    } catch (e) {
      console.error(`  ${epic.key} failed:`, e.message);
      if (!continueOnError) throw e;
    }
  }

  console.log("\nPhase 2: Creating Stories...");
  for (const story of stories) {
    const parentKey = story.parent?.key;
    const newParentKey = parentKey ? keyMap[parentKey] : null;
    if (parentKey && !newParentKey) {
      console.error(`  ${story.key}: parent ${parentKey} not in keyMap, skip`);
      if (!continueOnError) throw new Error(`Missing parent ${parentKey}`);
      continue;
    }
    try {
      const summary = story.summary || story.key || "Story";
      const description = toDescription(story.description);
      const fields = {
        issuetype: { id: String(storyId) },
        summary,
      };
      if (description) fields.description = description;
      if (newParentKey) fields.parent = { key: newParentKey };
      const created = await createIssue(project, fields, false);
      keyMap[story.key] = created.key;
      console.log(
        `  ${story.key} → ${created.key}  (parent ${newParentKey})  ${summary.slice(0, 45)}`
      );
    } catch (e) {
      console.error(`  ${story.key} failed:`, e.message);
      if (!continueOnError) throw e;
    }
  }

  if (withSubtasks && subtaskId) {
    console.log("\nPhase 3: Creating one Subtask per Story...");
    for (const story of stories) {
      const newStoryKey = keyMap[story.key];
      if (!newStoryKey) continue;
      try {
        const fields = {
          issuetype: { id: String(subtaskId) },
          parent: { key: newStoryKey },
          summary: "Trabalho",
        };
        const created = await createIssue(project, fields, false);
        console.log(`  ${newStoryKey} → subtask ${created.key}`);
      } catch (e) {
        console.error(`  ${newStoryKey} subtask failed:`, e.message);
        if (!continueOnError) throw e;
      }
    }
  }

  console.log("\nDone. Key map size:", Object.keys(keyMap).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

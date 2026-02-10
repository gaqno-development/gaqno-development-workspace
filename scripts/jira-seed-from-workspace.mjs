#!/usr/bin/env node
/**
 * Seed Jira GAQNO: Epic → 4 Histórias ([FE], [BE], [DevOps], [QA]) → Subtarefas em cada História.
 * Cada [XX] é uma História (não Tarefa); as subtarefas de trabalho ficam dentro da História correspondente.
 *
 * Usage:
 *   node scripts/jira-seed-from-workspace.mjs [--project=GAQNO] [--dry-run]
 *   node scripts/jira-seed-from-workspace.mjs --include-all
 *   node scripts/jira-seed-from-workspace.mjs --use-subtasks-only   # skip Task, 3 levels only
 *   node scripts/jira-seed-from-workspace.mjs --from-export [--export=scripts/jira-export.json]
 *
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env).
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
const EPIC_LINK_FIELD = "customfield_10014";

const PRODUCTS_MAIN = [
  {
    productKey: "shell",
    epicName: "Shell",
    backendRepo: null,
    frontendRepo: "gaqno-shell-ui",
  },
  {
    productKey: "ai",
    epicName: "Inteligência Artificial",
    backendRepo: "gaqno-ai-service",
    frontendRepo: "gaqno-ai-ui",
  },
  {
    productKey: "finance",
    epicName: "Finance",
    backendRepo: "gaqno-finance-service",
    frontendRepo: "gaqno-finance-ui",
  },
  {
    productKey: "rpg",
    epicName: "RPG",
    backendRepo: "gaqno-rpg-service",
    frontendRepo: "gaqno-rpg-ui",
  },
  {
    productKey: "sso",
    epicName: "SSO",
    backendRepo: "gaqno-sso-service",
    frontendRepo: "gaqno-sso-ui",
  },
  {
    productKey: "pdv",
    epicName: "PDV",
    backendRepo: "gaqno-pdv-service",
    frontendRepo: "gaqno-pdv-ui",
  },
  {
    productKey: "admin",
    epicName: "Admin",
    backendRepo: "gaqno-admin-service",
    frontendRepo: "gaqno-admin-ui",
  },
  {
    productKey: "saas",
    epicName: "SaaS",
    backendRepo: "gaqno-saas-service",
    frontendRepo: "gaqno-saas-ui",
  },
  {
    productKey: "omnichannel",
    epicName: "Omnichannel",
    backendRepo: "gaqno-omnichannel-service",
    frontendRepo: "gaqno-omnichannel-ui",
  },
  {
    productKey: "crm",
    epicName: "CRM",
    backendRepo: null,
    frontendRepo: "gaqno-crm-ui",
  },
];

const PRODUCTS_EXTRA = [
  {
    productKey: "erp",
    epicName: "ERP",
    backendRepo: null,
    frontendRepo: "gaqno-erp-ui",
  },
  {
    productKey: "landing",
    epicName: "Landing",
    backendRepo: null,
    frontendRepo: "gaqno-landing-ui",
  },
  {
    productKey: "lenin",
    epicName: "Lenin",
    backendRepo: null,
    frontendRepo: "gaqno-lenin-ui",
  },
];

const TASK_LAYERS = ["Frontend", "Backend", "DevOps", "QA"];
const TASK_LAYER_TAGS = {
  Frontend: "[FE]",
  Backend: "[BE]",
  DevOps: "[DevOps]",
  QA: "[QA]",
};
function taskSummary(layer, p) {
  if (layer === "DevOps") return "[DevOps] Desenvolvimento DevOps";
  if (layer === "QA") return "[QA] Desenvolvimento QA";
  return `${TASK_LAYER_TAGS[layer]} Desenvolvimento do módulo ${p.epicName}`;
}

const SUBTASKS_BY_LAYER = {
  Backend: [
    "Rodar script de criação de backend",
    "Criação de módulos e serviços",
    "Criação de endpoints e DTOs",
    "Integração com banco de dados",
  ],
  Frontend: [
    "Rodar script de criação de frontend",
    "Criação de componentes",
    "Integração com API e endpoints",
    "Rotas e navegação no shell",
  ],
  DevOps: ["Configurar pipeline CI no repo", "Configurar deploy e ambientes"],
  QA: ["Testes unitários", "Testes de integração e e2e"],
};
const SUBTASKS_BACKEND_NA = ["Backend (não aplicável)"];

function parseArgs() {
  const args = process.argv.slice(2);
  const project =
    args.find((a) => a.startsWith("--project="))?.split("=")[1] ??
    process.env.JIRA_PROJECT_KEY ??
    "GAQNO";
  const dryRun = args.includes("--dry-run");
  const includeAll = args.includes("--include-all");
  const useSubtasksOnly = args.includes("--use-subtasks-only");
  const fromExport = args.includes("--from-export");
  const exportPath =
    args.find((a) => a.startsWith("--export="))?.split("=")[1] ??
    path.join(process.cwd(), "scripts", "jira-export.json");
  const products = includeAll
    ? [...PRODUCTS_MAIN, ...PRODUCTS_EXTRA]
    : PRODUCTS_MAIN;
  return {
    project,
    dryRun,
    includeAll,
    useSubtasksOnly,
    fromExport,
    exportPath,
    products,
  };
}

function inferProductKeyFromSummary(summary) {
  const m = summary.match(/gaqno-(\w+)-(?:ui|service)/i);
  if (m) {
    const name = m[1].toLowerCase();
    const all = [...PRODUCTS_MAIN, ...PRODUCTS_EXTRA];
    const p = all.find(
      (x) => x.frontendRepo?.includes(name) || x.backendRepo?.includes(name)
    );
    if (p) return p.productKey;
    const known = [
      "shell",
      "ai",
      "finance",
      "rpg",
      "sso",
      "pdv",
      "admin",
      "saas",
      "omnichannel",
      "crm",
      "erp",
      "landing",
      "lenin",
    ];
    if (known.includes(name)) return name;
  }
  if (
    /husky|commitlint|commit-msg|pre-commit|pre-push|lint-staged|shell/i.test(
      summary
    )
  )
    return "shell";
  if (/unify|types|dto|backcore|frontcore/i.test(summary)) return "shell";
  return "shell";
}

function loadExport(exportPath) {
  const p = path.isAbsolute(exportPath)
    ? exportPath
    : path.join(process.cwd(), exportPath);
  if (!fs.existsSync(p)) return null;
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  return Array.isArray(data.issues) ? data.issues : null;
}

const TYPE_NAME_ALIASES = {
  Epic: ["Épico", "Epic"],
  Story: ["História", "Story"],
  Task: ["Tarefa", "Task"],
  Subtask: ["Sub-tarefa", "Subtask"],
};

function resolveTypeId(wantedName, byName) {
  if (byName[wantedName]) return byName[wantedName];
  const aliases = TYPE_NAME_ALIASES[wantedName];
  if (aliases) {
    for (const name of aliases) {
      if (byName[name]) return byName[name];
    }
  }
  const keys = Object.keys(byName);
  return keys.length ? byName[keys[0]] : null;
}

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString(
  "base64"
);
const RETRY_MAX = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function jira(pathname, opts = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    const res = await fetch(`${JIRA_URL}${pathname}`, {
      ...opts,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
        ...opts.headers,
      },
    });
    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : null;
    lastErr = new Error(`${res.status} ${pathname}: ${text}`);
    if (attempt < RETRY_MAX && (res.status >= 500 || res.status === 429)) {
      console.warn(
        `  Retry ${attempt}/${RETRY_MAX} in ${RETRY_DELAY_MS * attempt}ms (${res.status})...`
      );
      await sleep(RETRY_DELAY_MS * attempt);
    } else break;
  }
  throw lastErr;
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

async function createIssue(projectKey, fields, dryRun) {
  if (dryRun)
    return {
      key: `DRY-${projectKey}-${Math.random().toString(36).slice(2, 8)}`,
    };
  return jira("/rest/api/3/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        ...fields,
      },
    }),
  });
}

function epicSummary(p) {
  if (
    p.epicName === "Shell" ||
    p.epicName === "Landing" ||
    p.epicName === "Lenin"
  )
    return p.epicName === "Shell" ? "Módulo Shell" : p.epicName;
  return `Módulo de ${p.epicName}`;
}

async function runFromExport(ctx) {
  const { project, dryRun, products, exportPath } = ctx;
  const issues = loadExport(exportPath);
  if (!issues || issues.length === 0) {
    console.warn(
      "No issues in export or file not found. Run without --from-export for workspace-based seed."
    );
    return runWorkspaceSeed(ctx);
  }
  const byProduct = {};
  for (const issue of issues) {
    const summary = issue.summary || issue.key;
    if (!summary) continue;
    const productKey = inferProductKeyFromSummary(summary);
    if (!byProduct[productKey]) byProduct[productKey] = [];
    byProduct[productKey].push({
      summary,
      description: issue.description || "",
    });
  }
  const productKeys = [...new Set(Object.keys(byProduct))];
  const productMap = {};
  for (const p of products) productMap[p.productKey] = p;
  const epicKeys = {};
  console.log("Phase 1: Creating Epics (from export mapping)...");
  for (const key of productKeys) {
    const p = productMap[key];
    const summary = p ? epicSummary(p) : `Módulo ${key}`;
    const created = await createIssue(
      project,
      {
        issuetype: { id: String(ctx.epicId) },
        summary,
      },
      dryRun
    );
    epicKeys[key] = created.key;
    console.log(`  ${created.key}  ${summary}`);
  }
  console.log("\nPhase 2: Creating Stories (one per export issue)...");
  const storyKeys = [];
  for (const key of productKeys) {
    const epicKey = epicKeys[key];
    if (!epicKey) continue;
    const items = byProduct[key];
    for (const item of items) {
      const fields = {
        issuetype: { id: String(ctx.storyId) },
        summary: item.summary.slice(0, 255),
        [EPIC_LINK_FIELD]: epicKey,
      };
      if (item.description)
        fields.description = item.description.slice(0, 32767);
      const created = await createIssue(project, fields, dryRun);
      storyKeys.push({ key: created.key, epicKey, productKey: key });
      console.log(
        `  ${created.key}  ${epicKey} → ${item.summary.slice(0, 50)}`
      );
    }
  }
  await runPhase3And4(ctx, storyKeys, null);
}

async function runPhase3And4(ctx, storyEntries, summariesByLayerFn) {
  const {
    project,
    dryRun,
    products,
    useSubtasksOnly,
    taskId,
    subtaskId,
    byName,
  } = ctx;
  const productMap = {};
  for (const p of products) productMap[p.productKey] = p;
  let usedFallback = false;
  const taskKeysByStory = {};
  console.log(
    "\nPhase 3: Creating Tasks ([FE], [BE], [DevOps], [QA]) under each Story..."
  );
  outer: for (const { key: storyKey, productKey } of storyEntries) {
    const p = productMap[productKey] || products[0];
    const summariesByLayer = summariesByLayerFn
      ? summariesByLayerFn(p)
      : {
          Backend: p.backendRepo
            ? SUBTASKS_BY_LAYER.Backend
            : SUBTASKS_BACKEND_NA,
          Frontend: SUBTASKS_BY_LAYER.Frontend,
          DevOps: SUBTASKS_BY_LAYER.DevOps,
          QA: SUBTASKS_BY_LAYER.QA,
        };
    taskKeysByStory[storyKey] = { byLayer: {}, summariesByLayer };
    if (useSubtasksOnly) {
      usedFallback = true;
      continue;
    }
    for (const layer of TASK_LAYERS) {
      const taskTitle = taskSummary(layer, p);
      try {
        const created = await createIssue(
          project,
          {
            issuetype: { id: String(taskId) },
            parent: { key: storyKey },
            summary: taskTitle,
          },
          dryRun
        );
        taskKeysByStory[storyKey].byLayer[layer] = created.key;
        console.log(`  ${storyKey} → ${created.key}  ${taskTitle}`);
      } catch (err) {
        const is400 =
          err.message &&
          (err.message.includes("400") ||
            err.message.includes("parent") ||
            err.message.includes("hierarquia"));
        if (is400) {
          usedFallback = true;
          console.warn(
            `  Task cannot have Story as parent. Falling back to Subtasks only under Story.`
          );
          break outer;
        }
        throw err;
      }
    }
  }
  if (usedFallback) {
    console.log(
      "\nPhase 3 (fallback): Creating Subtasks under each Story (layers + work items)..."
    );
    for (const { key: storyKey, productKey } of storyEntries) {
      const p = productMap[productKey] || products[0];
      const summariesByLayer = p.backendRepo
        ? {
            Backend: SUBTASKS_BY_LAYER.Backend,
            Frontend: SUBTASKS_BY_LAYER.Frontend,
            DevOps: SUBTASKS_BY_LAYER.DevOps,
            QA: SUBTASKS_BY_LAYER.QA,
          }
        : {
            Backend: SUBTASKS_BACKEND_NA,
            Frontend: SUBTASKS_BY_LAYER.Frontend,
            DevOps: SUBTASKS_BY_LAYER.DevOps,
            QA: SUBTASKS_BY_LAYER.QA,
          };
      const layerTitles = TASK_LAYERS.map((l) => taskSummary(l, p));
      const flat = [].concat(
        layerTitles,
        ...TASK_LAYERS.map((l) => summariesByLayer[l])
      );
      for (const summary of flat) {
        const created = await createIssue(
          project,
          {
            issuetype: { id: String(subtaskId) },
            parent: { key: storyKey },
            summary: summary.slice(0, 255),
          },
          dryRun
        );
        console.log(`  ${storyKey} → ${created.key}  ${summary.slice(0, 45)}`);
      }
    }
    return;
  }
  console.log("\nPhase 4: Creating Subtasks under each Task...");
  for (const { key: storyKey } of storyEntries) {
    const { byLayer, summariesByLayer } = taskKeysByStory[storyKey] || {};
    if (!byLayer || Object.keys(byLayer).length === 0) continue;
    for (const layer of TASK_LAYERS) {
      const taskKey = byLayer[layer];
      if (!taskKey) continue;
      const list = summariesByLayer[layer] || [];
      for (const summary of list) {
        const created = await createIssue(
          project,
          {
            issuetype: { id: String(subtaskId) },
            parent: { key: taskKey },
            summary: summary.slice(0, 255),
          },
          dryRun
        );
        console.log(`  ${taskKey} → ${created.key}  ${summary.slice(0, 45)}`);
      }
    }
  }
}

function taskSummariesByLayer(p) {
  return {
    Backend: p.backendRepo ? SUBTASKS_BY_LAYER.Backend : SUBTASKS_BACKEND_NA,
    Frontend: SUBTASKS_BY_LAYER.Frontend,
    DevOps: SUBTASKS_BY_LAYER.DevOps,
    QA: SUBTASKS_BY_LAYER.QA,
  };
}

async function runWorkspaceSeed(ctx) {
  const {
    project,
    dryRun,
    products,
    useSubtasksOnly,
    epicId,
    storyId,
    taskId,
    subtaskId,
  } = ctx;
  const epicKeys = {};
  console.log("Phase 1: Creating Epics...");
  for (const p of products) {
    const summary = epicSummary(p);
    const created = await createIssue(
      project,
      {
        issuetype: { id: String(epicId) },
        summary,
      },
      dryRun
    );
    epicKeys[p.productKey] = created.key;
    console.log(`  ${created.key}  ${summary}`);
  }
  console.log(
    "\nPhase 2: Creating 4 Histórias per Epic ([FE], [BE], [DevOps], [QA])..."
  );
  const storyEntries = [];
  for (const p of products) {
    const epicKey = epicKeys[p.productKey];
    for (const layer of TASK_LAYERS) {
      const summary = taskSummary(layer, p);
      const fields = {
        issuetype: { id: String(storyId) },
        summary,
        [EPIC_LINK_FIELD]: epicKey,
      };
      const created = await createIssue(project, fields, dryRun);
      storyEntries.push({
        key: created.key,
        epicKey,
        productKey: p.productKey,
        layer,
      });
      console.log(`  ${created.key}  ${epicKey} → ${summary}`);
    }
  }
  console.log("\nPhase 3: Creating Subtasks under each História...");
  const productMap = {};
  for (const p of products) productMap[p.productKey] = p;
  for (const { key: storyKey, productKey, layer } of storyEntries) {
    const p = productMap[productKey] || products[0];
    const summariesByLayer = taskSummariesByLayer(p);
    const list = summariesByLayer[layer] || [];
    for (const summary of list) {
      const created = await createIssue(
        project,
        {
          issuetype: { id: String(ctx.subtaskId) },
          parent: { key: storyKey },
          summary: summary.slice(0, 255),
        },
        dryRun
      );
      console.log(`  ${storyKey} → ${created.key}  ${summary.slice(0, 45)}`);
    }
  }
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN in .env.jira or .env");
    process.exit(1);
  }
  const {
    project,
    dryRun,
    includeAll,
    useSubtasksOnly,
    fromExport,
    exportPath,
    products,
  } = parseArgs();
  const { byName, subtaskTypeId } = await getProjectIssueTypes(project);
  const epicId = resolveTypeId("Epic", byName);
  const storyId = resolveTypeId("Story", byName);
  const taskId = resolveTypeId("Task", byName);
  const subtaskId = subtaskTypeId ?? resolveTypeId("Subtask", byName);
  if (!epicId || !storyId) {
    console.error("Project must have Epic and Story issue types.");
    process.exit(1);
  }
  if (!subtaskId) {
    console.error("Project must have Subtask type for fallback.");
    process.exit(1);
  }
  const ctx = {
    project,
    dryRun,
    products,
    useSubtasksOnly,
    fromExport,
    exportPath,
    epicId,
    storyId,
    taskId,
    subtaskId,
    byName,
  };
  console.log(
    `Seed: ${fromExport ? "from export" : products.length + " Epics"} → ${fromExport ? "Stories + Tasks/Subtasks" : "4 Histórias per Epic → Subtarefas"}${dryRun ? " (dry-run)" : ""}\n`
  );
  if (useSubtasksOnly && fromExport)
    console.log("Using Subtasks only under each Story (--from-export).\n");
  if (fromExport) {
    await runFromExport(ctx);
  } else {
    await runWorkspaceSeed(ctx);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

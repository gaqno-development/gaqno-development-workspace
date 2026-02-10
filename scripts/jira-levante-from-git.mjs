#!/usr/bin/env node
/**
 * Levante Git: coleta commits por app (raiz e submódulos), mapeia para productKey + layer,
 * gera JSON para alimentar o Jira (Subtarefas em Feito).
 *
 * Usage:
 *   node scripts/jira-levante-from-git.mjs [--output=scripts/jira-levante-git.json]
 *   node scripts/jira-levante-from-git.mjs --max-commits-per-repo=30 --since=2024-01-01
 *   node scripts/jira-levante-from-git.mjs --dry-run
 *   node scripts/jira-levante-from-git.mjs --feed   # alimentar Jira (criar Subtarefas em Feito)
 *
 * Env (for --feed): JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env).
 */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const GIT_FORMAT = "%H|%s|%ad|%an";
const DEFAULT_MAX_COMMITS = 50;

const PATH_TO_PRODUCT = {
  "gaqno-shell-ui": "shell",
  "gaqno-ai-ui": "ai",
  "gaqno-ai-service": "ai",
  "gaqno-finance-ui": "finance",
  "gaqno-finance-service": "finance",
  "gaqno-rpg-ui": "rpg",
  "gaqno-rpg-service": "rpg",
  "gaqno-sso-ui": "sso",
  "gaqno-sso-service": "sso",
  "gaqno-pdv-ui": "pdv",
  "gaqno-pdv-service": "pdv",
  "gaqno-admin-ui": "admin",
  "gaqno-admin-service": "admin",
  "gaqno-saas-ui": "saas",
  "gaqno-saas-service": "saas",
  "gaqno-omnichannel-ui": "omnichannel",
  "gaqno-omnichannel-service": "omnichannel",
  "gaqno-crm-ui": "crm",
  "gaqno-erp-ui": "erp",
  "gaqno-landing-ui": "landing",
  "gaqno-lenin-ui": "lenin",
  "@gaqno-frontcore": "shell",
  "@gaqno-backcore": "shell",
};

function pathToLayer(dirName) {
  if (dirName.endsWith("-ui")) return "Frontend";
  if (dirName.endsWith("-service")) return "Backend";
  if (dirName.startsWith("@gaqno-")) return "Frontend";
  return "Frontend";
}

const SUBJECT_TO_GROUP = [
  [/husky/i, "Adicionar Husky"],
  [
    /commit-?msg|commitlint|commit\s*message|conventional\s*commit/i,
    "Configurar commit message",
  ],
  [/eslint|lint-staged|lint\s*config/i, "Configurar ESLint"],
  [/prettier/i, "Configurar Prettier"],
  [/docker|Dockerfile/i, "Configurar Docker"],
  [/\.github|workflow|ci\/cd|github\s*action|ci\.yml/i, "Configurar CI/CD"],
  [/jest|test|spec|coverage|vitest/i, "Configurar testes"],
  [/readme|\.md\b|documentação|docs?\s*:/i, "Documentação"],
  [
    /dependency|dependência|npm\s*install|package\.json|atualizar\s*dep|bump/i,
    "Atualizar dependências",
  ],
  [/fix|bug|correção|corrige/i, "Correções"],
  [/refactor|refatoração|refatora/i, "Refatoração"],
  [/chore\s*:/i, "Manutenção"],
  [/feat\s*:|feature|nova\s*func/i, "Nova funcionalidade"],
  [
    /init|setup\s*project|configuração\s*inicial|scaffold/i,
    "Configuração inicial",
  ],
  [/router|rota|navegação/i, "Rotas e navegação"],
  [/auth|login|sso|autenticação/i, "Autenticação"],
  [/api\s*:|endpoint|rest\s*client/i, "API / integração"],
  [/ui\s*:|component|tela|página/i, "Interface / componentes"],
];

function subjectToCanonical(subject) {
  const s = (subject || "").trim();
  for (const [pattern, title] of SUBJECT_TO_GROUP) {
    if (pattern.test(s)) return title;
  }
  const words = s.replace(/#\d+/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Outras alterações";
  const short = words.slice(0, 4).join(" ").slice(0, 60);
  return short || "Outras alterações";
}

function buildGroups(items) {
  const byKey = new Map();
  for (const it of items) {
    const canonical = subjectToCanonical(it.summary);
    const key = `${it.productKey}:${it.layer}:${canonical}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        productKey: it.productKey,
        layer: it.layer,
        summary: canonical,
        commits: [],
        repoPath: it.repoPath,
      });
    }
    byKey.get(key).commits.push({
      hash: it.commitHash,
      subject: it.summary,
      date: it.date,
      author: it.author,
    });
  }
  return [...byKey.values()];
}

function getSubmodulePaths() {
  const p = path.join(ROOT, ".gitmodules");
  if (!fs.existsSync(p)) return [];
  const content = fs.readFileSync(p, "utf8");
  const paths = [];
  let inPath = false;
  for (const line of content.split("\n")) {
    const pathMatch = line.match(/^\s*path\s*=\s*(.+)$/);
    if (pathMatch) paths.push(pathMatch[1].trim());
  }
  return paths;
}

function getWorkspacePaths() {
  const p = path.join(ROOT, "package.json");
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const workspaces = data.workspaces || [];
  return workspaces.filter(
    (w) =>
      (w.startsWith("gaqno-") &&
        (w.endsWith("-ui") || w.endsWith("-service"))) ||
      w.startsWith("@gaqno-")
  );
}

function parseArgs() {
  const args = process.argv.slice(2);
  const output =
    args.find((a) => a.startsWith("--output="))?.split("=")[1] ??
    path.join(ROOT, "scripts", "jira-levante-git.json");
  const maxCommits =
    parseInt(
      args.find((a) => a.startsWith("--max-commits-per-repo="))?.split("=")[1],
      10
    ) || DEFAULT_MAX_COMMITS;
  const since =
    args.find((a) => a.startsWith("--since="))?.split("=")[1] ?? null;
  const dryRun = args.includes("--dry-run");
  const feed = args.includes("--feed");
  return { output, maxCommits, since, dryRun, feed };
}

function gitLog(repoPath, isSubmodule, since, max) {
  const dir = isSubmodule ? path.join(ROOT, repoPath) : ROOT;
  if (isSubmodule && !fs.existsSync(path.join(dir, ".git"))) return [];
  const args = [
    "-C",
    dir,
    "log",
    "--format=" + GIT_FORMAT,
    "--date=short",
    "-n",
    String(max),
  ];
  if (since) args.push("--since=" + since);
  if (!isSubmodule) args.push("--", repoPath + "/");
  const result = spawnSync("git", args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0 || !result.stdout) return [];
  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, subject, dateStr, author] = line.split("|");
      return {
        hash: (hash || "").trim(),
        subject: (subject || "").trim(),
        date: (dateStr || "").trim(),
        author: (author || "").trim(),
      };
    });
}

function runLevante(opts) {
  const { maxCommits, since, output, dryRun } = opts;
  const submodulePaths = getSubmodulePaths();
  const workspacePaths = getWorkspacePaths();
  const rootOnlyPaths = workspacePaths.filter(
    (w) => !submodulePaths.includes(w)
  );
  const repos = [];
  const items = [];

  for (const repoPath of submodulePaths) {
    const dirName = path.basename(repoPath);
    const productKey = PATH_TO_PRODUCT[dirName] ?? "shell";
    const layer = pathToLayer(dirName);
    const commits = gitLog(repoPath, true, since, maxCommits);
    repos.push({ path: repoPath, productKey, layer, commits });
    for (const c of commits) {
      items.push({
        productKey,
        layer,
        summary: c.subject.slice(0, 255),
        description: `${c.hash}\n\n${c.subject}\n\nAuthor: ${c.author} Date: ${c.date}`,
        commitHash: c.hash,
        date: c.date,
        author: c.author,
        repoPath,
      });
    }
  }

  for (const repoPath of rootOnlyPaths) {
    const dirName = path.basename(repoPath);
    const productKey = PATH_TO_PRODUCT[dirName] ?? "shell";
    const layer = pathToLayer(dirName);
    const commits = gitLog(repoPath, false, since, maxCommits);
    repos.push({ path: repoPath, productKey, layer, commits });
    for (const c of commits) {
      items.push({
        productKey,
        layer,
        summary: c.subject.slice(0, 255),
        description: `${c.hash}\n\n${c.subject}\n\nAuthor: ${c.author} Date: ${c.date}`,
        commitHash: c.hash,
        date: c.date,
        author: c.author,
        repoPath,
      });
    }
  }

  const rootWorkspacePaths = ["docs", "scripts", ".github"];
  for (const repoPath of rootWorkspacePaths) {
    const fullPath = path.join(ROOT, repoPath);
    if (!fs.existsSync(fullPath)) continue;
    const productKey = "shell";
    const layer = "DevOps";
    const commits = gitLog(repoPath, false, since, maxCommits);
    if (commits.length === 0) continue;
    repos.push({ path: repoPath, productKey, layer, commits });
    for (const c of commits) {
      items.push({
        productKey,
        layer,
        summary: c.subject.slice(0, 255),
        description: `${c.hash}\n\n${c.subject}\n\nAuthor: ${c.author} Date: ${c.date}`,
        commitHash: c.hash,
        date: c.date,
        author: c.author,
        repoPath,
      });
    }
  }

  const groups = buildGroups(items);
  const payload = {
    generatedAt: new Date().toISOString(),
    repos,
    items,
    groups,
  };

  if (dryRun) {
    console.log(
      "Dry-run: would write",
      items.length,
      "items →",
      groups.length,
      "groups from",
      repos.length,
      "repos"
    );
    repos.forEach((r) =>
      console.log(
        `  ${r.path} (${r.productKey}/${r.layer}): ${r.commits.length} commits`
      )
    );
    return payload;
  }

  fs.writeFileSync(output, JSON.stringify(payload, null, 2), "utf8");
  console.log(
    "Wrote",
    output,
    "—",
    items.length,
    "items →",
    groups.length,
    "groups from",
    repos.length,
    "repos."
  );
  return payload;
}

function loadEnvFile(filename) {
  const envPath = path.join(ROOT, filename);
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

async function runFeed(opts) {
  loadEnvFile(".env.jira");
  loadEnvFile(".env");
  const JIRA_URL = (process.env.JIRA_URL || "https://gaqno.atlassian.net")
    .trim()
    .replace(/\/$/, "");
  const JIRA_USERNAME = process.env.JIRA_USERNAME;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error("Set JIRA_USERNAME and JIRA_API_TOKEN for --feed.");
    process.exit(1);
  }

  console.log("Feed: loading levante...");
  const inputPath =
    opts.output || path.join(ROOT, "scripts", "jira-levante-git.json");
  if (!fs.existsSync(inputPath)) {
    console.error("Run levante first (no --feed) to generate", inputPath);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const groups = data.groups || [];
  const items = data.items || [];
  const useGroups = groups.length > 0;
  const feedList = useGroups ? groups : items;
  console.log(
    "  Mode:",
    useGroups ? "groups" : "items",
    "| count:",
    feedList.length
  );
  if (feedList.length === 0) {
    console.log("No groups or items to feed.");
    return;
  }

  const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString(
    "base64"
  );
  const project = process.env.JIRA_PROJECT_KEY || "GAQNO";

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

  const projectData = await jira(
    `/rest/api/3/project/${project}?expand=issueTypes`
  );
  const byName = {};
  let subtaskTypeId = null;
  for (const t of projectData.issueTypes || []) {
    byName[t.name] = t.id;
    if (t.subtask) subtaskTypeId = t.id;
  }
  const subtaskId =
    subtaskTypeId ||
    byName["Sub-task"] ||
    byName["Subtarefa"] ||
    Object.values(byName).find((id) => id);
  if (!subtaskId) {
    console.error("Project has no Subtask type.");
    process.exit(1);
  }
  console.log("  Project:", project, "| Subtask type OK");

  console.log("  Resolving stories and epics...");
  const jqlStories = `project = ${project} AND issuetype = Story ORDER BY created DESC`;
  const searchRes = await jira(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jqlStories)}&fields=summary,parent,customfield_10014&maxResults=200`
  );
  const stories = searchRes.issues || [];
  const epicKeyByStory = {};
  for (const s of stories) {
    const raw = s.fields?.customfield_10014 || s.fields?.parent?.key;
    const epicKey = typeof raw === "string" ? raw : raw?.key || raw?.id;
    if (epicKey) epicKeyByStory[s.key] = epicKey;
  }

  const layerToStoryKey = {};
  const epicNameByKey = {};
  const epicSearch = await jira(
    `/rest/api/3/search/jql?jql=project=${project}+AND+issuetype=Epic&fields=summary&maxResults=100`
  );
  for (const e of epicSearch.issues || []) {
    epicNameByKey[e.key] = (e.fields?.summary || "").toLowerCase();
  }
  const productToEpicKey = {};
  for (const [key, name] of Object.entries(epicNameByKey)) {
    if (name.includes("shell")) productToEpicKey["shell"] = key;
    if (name.includes("inteligência") || name.includes("ai"))
      productToEpicKey["ai"] = key;
    if (name.includes("finance")) productToEpicKey["finance"] = key;
    if (name.includes("rpg")) productToEpicKey["rpg"] = key;
    if (name.includes("sso")) productToEpicKey["sso"] = key;
    if (name.includes("pdv")) productToEpicKey["pdv"] = key;
    if (name.includes("admin")) productToEpicKey["admin"] = key;
    if (name.includes("saas")) productToEpicKey["saas"] = key;
    if (name.includes("omnichannel")) productToEpicKey["omnichannel"] = key;
    if (name.includes("crm")) productToEpicKey["crm"] = key;
    if (name.includes("erp")) productToEpicKey["erp"] = key;
    if (name.includes("landing")) productToEpicKey["landing"] = key;
    if (name.includes("lenin")) productToEpicKey["lenin"] = key;
  }

  for (const s of stories) {
    const summary = (s.fields?.summary || "").toLowerCase();
    const epicKey = s.fields?.customfield_10014 || epicKeyByStory[s.key];
    if (!epicKey) continue;
    const epicName = epicNameByKey[epicKey] || "";
    let productKey = null;
    for (const [pk, ek] of Object.entries(productToEpicKey)) {
      if (ek === epicKey) productKey = pk;
    }
    if (!productKey) continue;
    if (summary.includes("[fe]") || summary.includes("frontend"))
      layerToStoryKey[`${productKey}:Frontend`] = s.key;
    if (summary.includes("[be]") || summary.includes("backend"))
      layerToStoryKey[`${productKey}:Backend`] = s.key;
    if (summary.includes("[devOps]") || summary.includes("devops"))
      layerToStoryKey[`${productKey}:DevOps`] = s.key;
    if (summary.includes("[qa]") || summary.includes("desenvolvimento qa"))
      layerToStoryKey[`${productKey}:QA`] = s.key;
  }
  console.log("  Product:layer → story:", Object.keys(layerToStoryKey).length);

  console.log("  Loading existing subtasks (avoid duplicates)...");
  const existingHashesByStory = {};
  const existingSummariesByStory = {};
  const fieldsParam = useGroups ? "summary,description" : "description";
  for (const storyKey of [...new Set(Object.values(layerToStoryKey))]) {
    try {
      const res = await jira(
        `/rest/api/3/search/jql?jql=${encodeURIComponent("parent = " + storyKey)}&fields=${fieldsParam}&maxResults=200`
      );
      const hashes = new Set();
      const summaries = new Set();
      for (const issue of res.issues || []) {
        const rawSummary = issue.fields?.summary;
        if (rawSummary) summaries.add(String(rawSummary).trim());
        const desc = issue.fields?.description;
        if (!desc) continue;
        const text =
          typeof desc === "string"
            ? desc
            : (desc.content || [])
                .map((c) => (c.content || []).map((x) => x.text).join(""))
                .join("\n");
        const firstLine = text.split("\n")[0] || "";
        if (/^[a-f0-9]{40}$/i.test(firstLine.trim()))
          hashes.add(firstLine.trim());
      }
      existingHashesByStory[storyKey] = hashes;
      existingSummariesByStory[storyKey] = summaries;
    } catch {
      existingHashesByStory[storyKey] = new Set();
      existingSummariesByStory[storyKey] = new Set();
    }
  }
  const totalExisting = useGroups
    ? Object.values(existingSummariesByStory).reduce(
        (s, set) => s + set.size,
        0
      )
    : Object.values(existingHashesByStory).reduce((s, set) => s + set.size, 0);
  console.log(
    "  Existing in stories:",
    totalExisting,
    useGroups ? "(summaries)" : "(hashes)"
  );

  console.log(
    "  Processing",
    feedList.length,
    useGroups ? "groups..." : "items..."
  );
  let created = 0;
  let skipped = 0;
  const progressEvery = useGroups ? 10 : 25;
  for (let idx = 0; idx < feedList.length; idx++) {
    const item = feedList[idx];
    if ((idx + 1) % progressEvery === 0 || idx === feedList.length - 1) {
      console.log(
        "  ...",
        idx + 1,
        "/",
        feedList.length,
        "| created:",
        created,
        "skipped:",
        skipped
      );
    }
    const storyKey = layerToStoryKey[`${item.productKey}:${item.layer}`];
    if (!storyKey) {
      skipped++;
      continue;
    }
    if (useGroups) {
      if (existingSummariesByStory[storyKey]?.has(item.summary)) {
        skipped++;
        continue;
      }
    } else {
      if (existingHashesByStory[storyKey]?.has(item.commitHash)) {
        skipped++;
        continue;
      }
    }

    let descText;
    let summaryText;
    if (useGroups) {
      summaryText = (item.summary || "Outras alterações").slice(0, 255);
      const lines = (item.commits || []).map(
        (c) => `${c.hash} ${(c.subject || "").slice(0, 80)} (${c.date})`
      );
      descText = lines.join("\n").slice(0, 32767);
      if (!descText) descText = "Synced from levante (group).";
    } else {
      summaryText = item.summary.slice(0, 255);
      descText = (item.description || "").slice(0, 32767);
    }
    const descWithMarker =
      descText +
      (descText.endsWith(".") ? "" : "\n\n") +
      "Synced from levante.";
    const descriptionAdf = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: descWithMarker }],
        },
      ],
    };
    try {
      const createRes = await jira("/rest/api/3/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            project: { key: project },
            issuetype: { id: String(subtaskId) },
            parent: { key: storyKey },
            summary: summaryText,
            description: descriptionAdf,
          },
        }),
      });
      const issueKey = createRes.key;
      created++;
      if (useGroups) existingSummariesByStory[storyKey].add(item.summary);
      else existingHashesByStory[storyKey].add(item.commitHash);
      try {
        const transitionsRes = await jira(
          `/rest/api/3/issue/${issueKey}/transitions`
        );
        const toDone = (transitionsRes.transitions || []).find((t) =>
          /feito|done|resolvido|concluído/i.test(t.name || "")
        );
        if (toDone) {
          await jira(`/rest/api/3/issue/${issueKey}/transitions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transition: { id: toDone.id } }),
          });
        }
      } catch {
        // leave in current status if transition fails
      }
    } catch (e) {
      if (
        e.message &&
        (e.message.includes("400") || e.message.includes("already exists"))
      )
        skipped++;
      else console.warn("Skip:", summaryText?.slice(0, 50), e.message);
    }
  }

  console.log(
    "\nFeed done: created",
    created,
    "| skipped",
    skipped,
    "(no duplicates)."
  );
}

async function main() {
  const opts = parseArgs();
  if (opts.feed) {
    await runFeed(opts);
    return;
  }
  runLevante(opts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

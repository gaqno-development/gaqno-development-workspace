#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const configPath = path.join(__dirname, "check-page-root-contract.json");

const PASCAL = /^[A-Z][a-zA-Z0-9]*$/;
const STRUCT_ROOT = new Set(["__tests__", "fixtures", "mocks"]);
const PAGES_LOOSE = /\.(tsx?|mts|cts)$/;
const PAGES_LOOSE_IGNORE = /\.(test|spec)\.(tsx?|mts|cts)$/;
const LOG = "[check:page-root-contract]";

let enforcedBasenames;
let pascalAllow = {};
let skipLooseFor = new Set();

try {
  const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!Array.isArray(raw.enforcedAppBasenames)) {
    throw new Error("enforcedAppBasenames must be an array");
  }
  enforcedBasenames = new Set(raw.enforcedAppBasenames);
  if (raw.pascalCaseNameAllowlist && typeof raw.pascalCaseNameAllowlist === "object") {
    pascalAllow = raw.pascalCaseNameAllowlist;
  }
  if (Array.isArray(raw.skipLooseFilesAtPagesRootForApps)) {
    skipLooseFor = new Set(raw.skipLooseFilesAtPagesRootForApps);
  }
} catch (e) {
  console.error(`${LOG} Invalid config ${configPath}: ${(e).message ?? e}`);
  process.exit(1);
}

const fromArgv = process.argv.slice(2).length > 0;
let roots = process.argv.slice(2).map((r) => path.resolve(r));
if (roots.length > 0 && enforcedBasenames.size > 0) {
  roots = roots.filter((r) => enforcedBasenames.has(path.basename(r)));
}
if (roots.length === 0 && !fromArgv) {
  for (const name of fs.readdirSync(workspaceRoot, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name.startsWith(".") || name.name === "node_modules")
      continue;
    const appRoot = path.join(workspaceRoot, name.name);
    if (
      fs.existsSync(path.join(appRoot, "package.json")) &&
      fs.existsSync(path.join(appRoot, "src", "pages"))
    ) {
      if (enforcedBasenames.size === 0 || enforcedBasenames.has(name.name)) {
        roots.push(appRoot);
      }
    }
  }
  roots.sort();
}

if (roots.length === 0) {
  if (fromArgv) {
    if (!process.env.PAGE_CHECK_SUITE) {
      console.log(`${LOG} OK — skipped (cwd path not in enforcedAppBasenames).`);
    }
  } else if (enforcedBasenames.size > 0) {
    if (!process.env.PAGE_CHECK_SUITE) {
      console.log(`${LOG} OK — no matching app directories on disk for enforcedAppBasenames.`);
    }
  } else {
    console.error(`${LOG} No projects with src/pages found.`);
    process.exit(1);
  }
  process.exit(0);
}

function pascalOrAllowed(basename, appName) {
  if (STRUCT_ROOT.has(basename)) return { ok: true, structural: true };
  if (PASCAL.test(basename)) return { ok: true, structural: false };
  const list = pascalAllow[appName] ?? [];
  if (list.includes(basename)) return { ok: true, structural: false, legacy: true };
  return { ok: false, structural: false };
}

function hasDir(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function checkApp(appRoot) {
  const appName = path.basename(appRoot);
  const pagesDir = path.join(appRoot, "src", "pages");
  const out = { looseFiles: [], pascal: [], contract: [] };

  for (const ent of fs.readdirSync(pagesDir, { withFileTypes: true })) {
    const full = path.join(pagesDir, ent.name);
    if (ent.isFile() && PAGES_LOOSE.test(ent.name)) {
      if (PAGES_LOOSE_IGNORE.test(ent.name)) continue;
      if (skipLooseFor.has(appName)) continue;
      out.looseFiles.push(full);
      continue;
    }
    if (!ent.isDirectory()) continue;
    const pr = pascalOrAllowed(ent.name, appName);
    if (!pr.ok) {
      out.pascal.push(full);
      continue;
    }
    if (pr.structural) continue;
    const needs = [];
    if (!hasDir(path.join(full, "features"))) needs.push("features/");
    if (!hasDir(path.join(full, "shared", "hooks"))) needs.push("shared/hooks/");
    if (!hasDir(path.join(full, "shared", "components")))
      needs.push("shared/components/");
    for (const need of needs) {
      out.contract.push({ full, need });
    }
  }
  return out;
}

let ok = true;
for (const appRoot of roots) {
  const b = checkApp(path.resolve(appRoot));
  const label = path.basename(appRoot);
  if (b.looseFiles.length) {
    ok = false;
    console.error(
      `${LOG} FAIL ${label} — loose *.ts/*.tsx in src/pages/ (move to pages/<Domain>/<Domain>.tsx + index.ts):`,
    );
    for (const f of b.looseFiles) console.error(`${LOG}   ${f}`);
  }
  if (b.pascal.length) {
    ok = false;
    console.error(
      `${LOG} FAIL ${label} — first-level folders under src/pages/ must be PascalCase (or ${[...STRUCT_ROOT].join(", ")}, or pascalCaseNameAllowlist):`,
    );
    for (const f of b.pascal) console.error(`${LOG}   ${f}`);
  }
  if (b.contract.length) {
    ok = false;
    const by = new Map();
    for (const { full, need } of b.contract) {
      if (!by.has(full)) by.set(full, new Set());
      by.get(full).add(need);
    }
    const pagesDir = path.join(appRoot, "src", "pages");
    for (const [full, needs] of by) {
      console.error(
        `${LOG} FAIL ${label} — missing ${[...needs].join(", ")} under ${path.relative(pagesDir, full) || "."}`,
      );
    }
  }
}

if (!ok) {
  process.exit(1);
}

if (skipLooseFor.size > 0) {
  const listed = [...skipLooseFor].sort().join(", ");
  console.log(
    `${LOG} WARNING — loose-file rule waived for legacy apps (delete from skipLooseFilesAtPagesRootForApps after migration): ${listed}`,
  );
}

if (!process.env.PAGE_CHECK_SUITE) {
  if (enforcedBasenames.size === 0) {
    console.log(
      `${LOG} OK — full scan: Pascal domains, no loose routes at pages/, each domain has features/ + shared/hooks/ + shared/components/.`,
    );
  } else {
    const names = [...enforcedBasenames].sort().join(", ");
    console.log(
      `${LOG} OK — ${[...enforcedBasenames].length} app(s): ${names}. Rules: Pascal domains (+ allowlist), domain tree includes features/ + shared/hooks/ + shared/components/. Config: scripts/check-page-root-contract.json.`,
    );
  }
}

#!/usr/bin/env node
// Gates PascalCase (or structural) folder names under **/pages/**/components/**, including inner **/features/** (good-practices §3, frontend-page-structure).
// Run: npm run check:page-component-names
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const STRUCTURAL = new Set([
  "hooks",
  "components",
  "features",
  "__tests__",
  "nodes",
  "utils",
  "constants",
  "shared",
  "fixtures",
  "mocks",
]);

let roots = process.argv.slice(2).map((r) => path.resolve(r));
if (roots.length === 0) {
  for (const name of fs.readdirSync(workspaceRoot, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    if (name.name === "node_modules" || name.name.startsWith(".")) continue;
    const appRoot = path.join(workspaceRoot, name.name);
    if (
      fs.existsSync(path.join(appRoot, "package.json")) &&
      fs.existsSync(path.join(appRoot, "src", "pages"))
    ) {
      roots.push(appRoot);
    }
  }
  roots.sort();
}

if (roots.length === 0) {
  console.error("No projects with src/pages found.");
  process.exit(1);
}

function segmentsAfterComponents(fullPath, pagesDir) {
  const rel = path.relative(pagesDir, fullPath);
  const marker = `${path.sep}components${path.sep}`;
  const idx = rel.indexOf(marker);
  if (idx === -1) return null;
  const tail = rel.slice(idx + marker.length);
  if (!tail) return [];
  return tail.split(path.sep).filter(Boolean);
}

function isValidComponentSegment(name) {
  if (STRUCTURAL.has(name)) return true;
  return PASCAL_CASE.test(name);
}

function scanAppPages(appRoot) {
  const pagesDir = path.join(path.resolve(appRoot), "src", "pages");
  if (!fs.existsSync(pagesDir)) return [];

  const violations = [];

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const tail = segmentsAfterComponents(full, pagesDir);
        if (tail !== null) {
          const leaf = ent.name;
          if (!isValidComponentSegment(leaf)) {
            violations.push(full);
          }
        }
        walk(full);
      }
    }
  }

  walk(pagesDir);
  return violations;
}

let ok = true;
for (const root of roots) {
  const bad = scanAppPages(root);
  if (bad.length) {
    ok = false;
    console.error(
      `${path.resolve(root)} — component folders under src/pages/**/components/ must use PascalCase (allowed exceptions: ${[...STRUCTURAL].sort().join(", ")}):`,
    );
    for (const f of bad) console.error(`  ${f}`);
  }
}

if (!ok) process.exit(1);
if (!process.env.PAGE_CHECK_SUITE) {
  console.log(
    "OK: every folder under src/pages/**/components/** uses PascalCase or a structural name.",
  );
}

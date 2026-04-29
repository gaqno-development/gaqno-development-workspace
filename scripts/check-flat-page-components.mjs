#!/usr/bin/env node
// Gates loose *.tsx under src/pages/**/components/ — fold-per-component (good-practices §3, frontend-page-structure).
// Run: npm run check:page-components  (from repo root)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

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

function scan(appRoot) {
  const pagesDir = path.join(path.resolve(appRoot), "src", "pages");
  if (!fs.existsSync(pagesDir)) return [];
  const bad = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, name.name);
      if (name.isDirectory()) walk(full);
      else if (
        name.name.endsWith(".tsx") &&
        path.basename(dir) === "components"
      ) {
        bad.push(full);
      }
    }
  }
  walk(pagesDir);
  return bad;
}

let ok = true;
for (const root of roots) {
  const bad = scan(root);
  if (bad.length) {
    ok = false;
    console.error(`${path.resolve(root)} — flat components under pages (move to Component/Component.tsx + index.ts):`);
    for (const f of bad) console.error(`  ${f}`);
  }
}

if (!ok) process.exit(1);
console.log("OK: no loose *.tsx under src/pages/**/components/ (direct children).");

#!/usr/bin/env node
// Forbidden: a folder literally named `features` nested under .../features/<SubDomain>/ — use `components/` for the inner bucket (good-practices §3).
// Run: npm run check:page-subdomain-features-bucket
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

function walkFeaturesDirs(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const full = path.join(dir, ent.name);
    if (ent.name === "features") out.push(full);
    walkFeaturesDirs(full, out);
  }
  return out;
}

function nestedFeaturesCount(relFromPages) {
  return relFromPages.split(path.sep).filter((s) => s === "features").length;
}

let ok = true;
for (const appRoot of roots) {
  const pagesDir = path.join(appRoot, "src", "pages");
  if (!fs.existsSync(pagesDir)) continue;
  const violations = [];
  for (const full of walkFeaturesDirs(pagesDir)) {
    const rel = path.relative(pagesDir, full);
    if (nestedFeaturesCount(rel) >= 2) violations.push(full);
  }
  if (violations.length) {
    ok = false;
    console.error(
      `${path.resolve(appRoot)} — nested src/pages/**/features/*/features/ must be components/ (second bucket under a first-class feature):`,
    );
    for (const v of violations) console.error(`  ${v}`);
  }
}

if (!ok) process.exit(1);
console.log(
  "OK: no nested `features` bucket under pages/**/features/<SubDomain>/ (use components/).",
);

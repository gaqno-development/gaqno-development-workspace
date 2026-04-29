#!/usr/bin/env node
// Gates **/features/ segments: PascalCase feature buckets + structural children of features/<Name>/ (good-practices §3, frontend-page-structure).
// Run: npm run check:page-feature-names
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const STRUCTURAL = new Set(["__tests__", "fixtures", "mocks", "nodes"]);

// Direct children of each first-class feature folder (…/features/<Name>/) must be structural or PascalCase.
const STRUCTURAL_UNDER_FEATURE = new Set([
  "__tests__",
  "fixtures",
  "mocks",
  "hooks",
  "components",
  "shared",
  "utils",
  "constants",
  "nodes",
  "features",
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

function isValidFeatureSegment(name) {
  if (STRUCTURAL.has(name)) return true;
  return PASCAL_CASE.test(name);
}

function isValidDirectChildOfFeatureFolder(name) {
  if (STRUCTURAL_UNDER_FEATURE.has(name)) return true;
  return PASCAL_CASE.test(name);
}

function scanAppPages(appRoot) {
  const pagesDir = path.join(path.resolve(appRoot), "src", "pages");
  if (!fs.existsSync(pagesDir))
    return { violations: [], violationsUnderFeature: [] };

  const violations = [];
  const violationsUnderFeature = [];

  function walk(dir) {
    const base = path.basename(dir);
    const parentDir = path.dirname(dir);
    const parentBase = path.basename(parentDir);
    if (parentBase === "features" && PASCAL_CASE.test(base)) {
      for (const child of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!child.isDirectory()) continue;
        if (!isValidDirectChildOfFeatureFolder(child.name)) {
          violationsUnderFeature.push(path.join(dir, child.name));
        }
      }
    }

    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const full = path.join(dir, ent.name);
      if (ent.name === "features") {
        for (const child of fs.readdirSync(full, { withFileTypes: true })) {
          if (!child.isDirectory()) continue;
          const leaf = child.name;
          if (!isValidFeatureSegment(leaf)) {
            violations.push(path.join(full, leaf));
          }
        }
      }
      walk(full);
    }
  }

  walk(pagesDir);
  return { violations, violationsUnderFeature };
}

let ok = true;
for (const root of roots) {
  const { violations, violationsUnderFeature } = scanAppPages(root);
  if (violations.length) {
    ok = false;
    console.error(
      `${path.resolve(root)} — direct children of src/pages/**/features/ must use PascalCase (allowed exceptions: ${[...STRUCTURAL].sort().join(", ")}):`,
    );
    for (const f of violations) console.error(`  ${f}`);
  }
  if (violationsUnderFeature.length) {
    ok = false;
    console.error(
      `${path.resolve(root)} — direct children of src/pages/**/features/<Feature>/ must use PascalCase or a structural name (${[...STRUCTURAL_UNDER_FEATURE].sort().join(", ")}):`,
    );
    for (const f of violationsUnderFeature) console.error(`  ${f}`);
  }
}

if (!ok) process.exit(1);
console.log(
  "OK: feature folders under src/pages/**/features/ (both levels) use PascalCase or allowed structural names.",
);

#!/usr/bin/env node
// Feature subtree **/features/*/shared/components/<PascalWidget>/ must be referenced from more than one file outside that widget (frontend-page-structure: shared = multi-consumer within feature).
// With no args: every workspace folder with package.json + src/pages (repo root: npm run check:page-feature-shared-span).
// With args: only those app roots, e.g. from gaqno-ai-ui: node ../scripts/...mjs .
// Run: npm run check:page-feature-shared-span
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const PASCAL_WIDGET = /^[A-Z][a-zA-Z0-9]*$/;
const SRC_EXT = /\.(tsx?|mts|cts)$/;

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

function findFeatureSharedWidgets(pagesDir) {
  const widgets = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (!ent.isDirectory()) continue;
      const parentName = path.basename(dir);
      const grandName = path.basename(path.dirname(dir));
      if (
        parentName === "components" &&
        grandName === "shared" &&
        PASCAL_WIDGET.test(ent.name)
      ) {
        const relPosix = path.relative(pagesDir, full).replace(/\\/g, "/");
        const inFeatureSubtree =
          relPosix.includes("/features/") ||
          (relPosix.includes("/shared/components/") &&
            relPosix.split("/components/").length >= 3);
        if (inFeatureSubtree) {
          widgets.push(full);
        }
      }
      walk(full);
    }
  }
  walk(pagesDir);
  return widgets;
}

function needleFromWidget(pagesDir, widgetRoot) {
  const relPosix = path.relative(pagesDir, widgetRoot).replace(/\\/g, "/");
  const fi = relPosix.indexOf("features/");
  if (fi >= 0) return relPosix.slice(fi);
  const parts = relPosix.split("/components/");
  if (parts.length >= 3)
    return `components/${parts.slice(1).join("/components/")}`;
  return relPosix;
}

function countRefsOutsideWidget(appSrcRoot, widgetRoot, needle) {
  const prefix = widgetRoot + path.sep;
  let n = 0;
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules") continue;
        walk(full);
      } else if (SRC_EXT.test(ent.name)) {
        if (full.startsWith(prefix)) continue;
        const text = fs.readFileSync(full, "utf8");
        if (text.includes(needle)) n += 1;
      }
    }
  }
  walk(appSrcRoot);
  return n;
}

function scanApp(appRoot) {
  const pagesDir = path.join(path.resolve(appRoot), "src", "pages");
  const srcRoot = path.join(path.resolve(appRoot), "src");
  if (!fs.existsSync(pagesDir) || !fs.existsSync(srcRoot)) {
    return { violations: [], widgetCount: 0 };
  }

  const widgets = findFeatureSharedWidgets(pagesDir);
  const violations = [];
  for (const widgetRoot of widgets) {
    const needle = needleFromWidget(pagesDir, widgetRoot);
    const count = countRefsOutsideWidget(srcRoot, widgetRoot, needle);
    if (count <= 1) {
      violations.push({
        widgetRoot,
        needle,
        count,
      });
    }
  }
  return { violations, widgetCount: widgets.length };
}

let exitCode = 0;
let widgetsChecked = 0;
for (const appRoot of roots) {
  const { violations: bad, widgetCount } = scanApp(appRoot);
  widgetsChecked += widgetCount;
  if (bad.length === 0) continue;
  exitCode = 1;
  const label = path.relative(workspaceRoot, appRoot) || appRoot;
  console.error(`${label}: feature shared/components widgets with ≤1 external import path reference:`);
  for (const { widgetRoot, needle, count } of bad) {
    console.error(
      `  ${path.relative(appRoot, widgetRoot)} (${needle}) — ${count} file(s) outside widget folder reference this path; use .../features/<Area>/components/<Widget>/ for nested UI.`,
    );
  }
}

if (exitCode !== 0) {
  console.error(
    "\nMove single-consumer UI out of .../features/*/shared/components/ or deep .../components/*/shared/components/ (see frontend-page-structure: shared = multiple sub-areas).",
  );
  process.exit(exitCode);
}

if (!process.env.PAGE_CHECK_SUITE) {
  console.log(
    `OK: feature shared/components import span (${roots.length} app(s) in scope, ${widgetsChecked} features/**/shared/components/<Widget> folder(s) checked).`,
  );
}
process.exit(0);

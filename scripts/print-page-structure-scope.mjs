#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bold,
  cyan,
  dim,
  green,
} from "./lib/page-check-log.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const contractPath = path.join(__dirname, "check-page-root-contract.json");

function discoverAppRoots() {
  const roots = [];
  for (const ent of fs.readdirSync(workspaceRoot, { withFileTypes: true })) {
    if (!ent.isDirectory() || ent.name.startsWith(".") || ent.name === "node_modules")
      continue;
    const appRoot = path.join(workspaceRoot, ent.name);
    if (
      fs.existsSync(path.join(appRoot, "package.json")) &&
      fs.existsSync(path.join(appRoot, "src", "pages"))
    ) {
      roots.push(ent.name);
    }
  }
  return roots.sort();
}

function loadEnforcedContractApps() {
  try {
    const raw = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    if (!Array.isArray(raw.enforcedAppBasenames)) return [];
    return [...raw.enforcedAppBasenames].sort();
  } catch {
    return [];
  }
}

function loadSkipLooseApps() {
  try {
    const raw = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    if (!Array.isArray(raw.skipLooseFilesAtPagesRootForApps)) return [];
    return [...raw.skipLooseFilesAtPagesRootForApps].sort();
  } catch {
    return [];
  }
}

function printLabelBlock(title, items, bullet = false) {
  const joined = items.join(", ");
  const threshold = 76;
  console.log(`${cyan("  •")} ${bold(title)} ${dim(`(${items.length})`)}`);
  if (!bullet && joined.length <= threshold) {
    console.log(dim(`    ${joined}`));
    return;
  }
  for (const x of items) {
    console.log(dim(`    · ${x}`));
  }
}

const suite = Boolean(process.env.PAGE_CHECK_SUITE);
const singleArg = process.argv[2];
const roots = discoverAppRoots();
const enforced = loadEnforcedContractApps();
const skipLoose = loadSkipLooseApps();

if (singleArg) {
  const resolved = path.resolve(process.cwd(), singleArg);
  const bn = path.basename(resolved);
  console.log(`${cyan("  •")} ${bold("cwd scope")} ${dim(bn)}`);
  console.log(dim(`    ${resolved}`));
  printLabelBlock("page-root-contract enforcedApps", enforced);
  if (skipLoose.length > 0) {
    printLabelBlock("WAIVES loose *.ts(x) at src/pages/", skipLoose);
  }
} else {
  printLabelBlock("packages with package.json + src/pages", roots);
  const enforcedSet = new Set(enforced);
  const skippedByContract = roots.filter((n) => !enforcedSet.has(n));
  printLabelBlock("page-root-contract enforcedApps", enforced);
  if (skippedByContract.length > 0) {
    printLabelBlock(
      "not enforced (add to enforcedAppBasenames to enforce)",
      skippedByContract,
      true,
    );
  }
  if (skipLoose.length > 0) {
    printLabelBlock(
      "WAIVES loose *.ts(x) at src/pages/ (skipLooseFilesAtPagesRootForApps)",
      skipLoose,
    );
  }
  if (!suite) {
    console.log(
      dim(
        "  Gate chain: page-components → component-names → feature-names → feature-shared-span → subdomain-features-bucket → page-root-contract",
      ),
    );
  }
}

if (!suite) {
  console.log(`${green("  ✓")} ${bold("Scope summary")}`);
}

console.log("");

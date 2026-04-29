#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const singleArg = process.argv[2];
const roots = discoverAppRoots();
const enforced = loadEnforcedContractApps();
const skipLoose = loadSkipLooseApps();

if (singleArg) {
  const resolved = path.resolve(process.cwd(), singleArg);
  const bn = path.basename(resolved);
  console.log(`[check:page-structure] cwd scope: ${bn} (${resolved})`);
  console.log(
    `[check:page-structure] page-root-contract enforcedApps (${enforced.length}): ${enforced.join(", ")}`,
  );
  if (skipLoose.length > 0) {
    console.log(
      `[check:page-structure] page-root-contract WAIVES loose *.ts(x) at src/pages/ for: ${skipLoose.join(", ")}`,
    );
  }
} else {
  console.log(
    `[check:page-structure] packages with package.json + src/pages (${roots.length}): ${roots.join(", ")}`,
  );
  const enforcedSet = new Set(enforced);
  const skippedByContract = roots.filter((n) => !enforcedSet.has(n));
  console.log(
    `[check:page-structure] page-root-contract enforcedApps (${enforced.length}): ${enforced.join(", ")}`,
  );
  if (skippedByContract.length > 0) {
    console.log(
      `[check:page-structure] page-root-contract not applied to: ${skippedByContract.join(", ")} (add to enforcedAppBasenames in scripts/check-page-root-contract.json to enforce)`,
    );
  }
  if (skipLoose.length > 0) {
    console.log(
      `[check:page-structure] page-root-contract WAIVES loose *.ts(x) at src/pages/ for: ${skipLoose.join(", ")} (see skipLooseFilesAtPagesRootForApps in scripts/check-page-root-contract.json)`,
    );
  }
  console.log(
    "[check:page-structure] Gate chain: check:page-components → check:page-component-names → check:page-feature-names → check:page-feature-shared-span → check:page-subdomain-features-bucket → check:page-root-contract. Other good-practices rules are manual or different tooling.",
  );
}

#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  printSuiteBanner,
  printSuiteFooter,
  printSuiteGateChain,
  printSuiteStep,
} from "./lib/page-check-log.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");

const steps = [
  ["Scope & contract targets", "print-page-structure-scope.mjs"],
  ["No loose *.tsx under …/components/", "check-flat-page-components.mjs"],
  [
    "PascalCase / structural names (components/)",
    "check-page-component-folder-names.mjs",
  ],
  [
    "PascalCase / structural names (features/)",
    "check-page-feature-folder-names.mjs",
  ],
  ["Feature shared/components import span", "check-feature-shared-widget-import-span.mjs"],
  ["No nested features bucket under subdomain", "check-page-subdomain-features-bucket.mjs"],
  ["Page root contract (domains + shared/)", "check-page-root-contract.mjs"],
];

process.env.PAGE_CHECK_SUITE = "1";

printSuiteBanner("Page structure checks");
printSuiteGateChain();

for (const [label, scriptName] of steps) {
  printSuiteStep(label);
  const scriptPath = path.join(__dirname, scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: workspaceRoot,
    stdio: "inherit",
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    process.exit(code);
  }
}

printSuiteFooter();

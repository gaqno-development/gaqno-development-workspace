#!/usr/bin/env node
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const V1_PREFIX = 'setGlobalPrefix("v1")';

const serviceDirs = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith("-service"))
  .map((d) => d.name);

const missing = [];
const ok = [];

for (const dir of serviceDirs) {
  const mainPath = join(ROOT, dir, "src", "main.ts");
  try {
    const content = readFileSync(mainPath, "utf8");
    if (content.includes(V1_PREFIX)) {
      ok.push(dir);
    } else {
      missing.push(dir);
    }
  } catch {
    missing.push(dir);
  }
}

console.log("API prefix v1 check (backends):");
ok.forEach((d) => console.log("  OK   ", d));
missing.forEach((d) => console.log("  MISS ", d));

if (missing.length > 0) {
  console.log(
    '\nRule: every *-service must call setGlobalPrefix("v1") in src/main.ts'
  );
  process.exit(1);
}
console.log("\nAll backends use prefix v1.");
process.exit(0);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("Usage: migrate-page-components-to-folders.mjs <app-root> [...]");
  process.exit(1);
}

function listDirectTsx(componentsDir) {
  if (!fs.existsSync(componentsDir)) return [];
  return fs
    .readdirSync(componentsDir)
    .filter((n) => n.endsWith(".tsx"))
    .map((n) => path.join(componentsDir, n));
}

function componentBase(stem) {
  if (stem.endsWith(".test")) return stem.slice(0, -".test".length);
  if (stem.endsWith(".spec")) return stem.slice(0, -".spec".length);
  return stem;
}

function migrateApp(appRoot) {
  const pagesDir = path.join(appRoot, "src", "pages");
  if (!fs.existsSync(pagesDir)) {
    console.warn(`Skip (no src/pages): ${appRoot}`);
    return { moved: 0, skipped: 0 };
  }

  let moved = 0;
  const componentsDirs = [];

  function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, name.name);
      if (name.isDirectory()) {
        if (name.name === "components") componentsDirs.push(full);
        walk(full);
      }
    }
  }
  walk(pagesDir);

  for (const componentsDir of componentsDirs) {
    const files = listDirectTsx(componentsDir);
    const mains = files.filter((f) => {
      const b = path.basename(f);
      return !b.includes(".test.") && !b.includes(".spec.");
    });
    const tests = files.filter((f) => {
      const b = path.basename(f);
      return b.includes(".test.") || b.includes(".spec.");
    });

    for (const filePath of mains) {
      const stem = path.parse(filePath).name;
      const comp = componentBase(stem);
      const targetDir = path.join(componentsDir, comp);
      if (fs.existsSync(targetDir) && fs.statSync(targetDir).isFile()) {
        console.warn(`Skip (exists): ${targetDir}`);
        continue;
      }
      fs.mkdirSync(targetDir, { recursive: true });
      const dest = path.join(targetDir, `${stem}.tsx`);
      fs.renameSync(filePath, dest);
      const indexPath = path.join(targetDir, "index.ts");
      fs.writeFileSync(indexPath, `export * from "./${stem}";\n`);
      moved += 1;
    }

    for (const filePath of tests) {
      const stem = path.parse(filePath).name;
      const comp = componentBase(stem);
      const targetDir = path.join(componentsDir, comp);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const dest = path.join(targetDir, `${stem}.tsx`);
      fs.renameSync(filePath, dest);
      moved += 1;
    }
  }

  return { moved };
}

for (const root of roots) {
  const abs = path.resolve(root);
  const r = migrateApp(abs);
  console.log(`${abs}: moved ${r.moved} files`);
}

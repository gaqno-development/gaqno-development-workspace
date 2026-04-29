#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const appRoot = process.argv[2];
if (!appRoot) {
  console.error("Usage: fix-migrated-component-imports.mjs <app-root>");
  process.exit(1);
}

const pagesDir = path.join(path.resolve(appRoot), "src", "pages");
if (!fs.existsSync(pagesDir)) {
  console.error("No src/pages");
  process.exit(1);
}

function shouldFixFile(relPath) {
  const p = relPath.split(path.sep);
  const i = p.indexOf("components");
  if (i === -1) return null;
  const rest = p.slice(i + 1);
  if (rest.length < 2) return null;
  if (rest.length >= 3 && rest[0] === rest[1]) return null;
  const dirName = rest[0];
  if (dirName === "nodes" || dirName === "public") return null;
  const file = rest[rest.length - 1];
  const stem = path.parse(file).name;
  const baseStem = stem.replace(/\.(test|spec)$/, "");
  if (baseStem === dirName) return "standard";
  if (stem === `${dirName}.spec` || stem === `${dirName}.test`) return "standard";
  return null;
}

function fixContent(content, mode) {
  if (mode !== "standard") return content;
  let c = content;
  const bump = (t) => t.replaceAll(`from "../`, `from "../../`);
  c = bump(c);
  c = c.replaceAll(`from './`, `from '../`); // only relative same-dir - too broad!
  return c;
}

// Safer: only bump specific page-level modules
const BUMP_PREFIXES = [
  'from "../hooks/',
  "from '../hooks/",
  'from "../types',
  "from '../types",
  'from "../utils/',
  "from '../utils/",
  'from "../constants',
  "from '../constants",
  'from "../flow-constants',
  "from '../flow-constants",
  'from "../i18n',
  "from '../i18n",
];

function fixContentSafe(content) {
  let c = content;
  for (const from of BUMP_PREFIXES) {
    const to = from.replace(`"../`, `"../../`).replace(`'../`, `'../../`);
    c = c.split(from).join(to);
  }
  c = c.replace(
    /from "(\.\/)([A-Z][^"/]+)"/g,
    (m, dot, name) => {
      if (m.includes("node_modules")) return m;
      return `from "../${name}"`;
    },
  );
  c = c.replace(
    /from '(\.\/)([A-Z][^'/]+)'/g,
    (m, dot, name) => {
      return `from '../${name}'`;
    },
  );
  return c;
}

let n = 0;
function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full);
    else if (name.name.endsWith(".tsx") || name.name.endsWith(".ts")) {
      const rel = path.relative(pagesDir, full);
      const mode = shouldFixFile(rel);
      if (!mode) continue;
      const before = fs.readFileSync(full, "utf8");
      const after = fixContentSafe(before);
      if (after !== before) {
        fs.writeFileSync(full, after);
        n += 1;
      }
    }
  }
}
walk(pagesDir);
console.log(`Updated ${n} files in ${appRoot}`);

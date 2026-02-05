#!/usr/bin/env node
const fs = require('fs');
const path = process.argv[2];
if (!path) process.exit(1);

const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.scripts = pkg.scripts || {};
if (!pkg.scripts.prepare) {
  pkg.scripts = { prepare: 'husky', ...pkg.scripts };
}
pkg.devDependencies = pkg.devDependencies || {};
pkg.devDependencies['husky'] = '^9.1.7';
pkg.devDependencies['@commitlint/cli'] = '^19.6.1';
pkg.devDependencies['@commitlint/config-conventional'] = '^19.6.0';
if (!pkg.scripts.test) {
  pkg.scripts.test = 'echo "No tests"';
}
fs.writeFileSync(path, JSON.stringify(pkg, null, 2));

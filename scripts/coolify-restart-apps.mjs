#!/usr/bin/env node
/**
 * Restart Coolify applications by UUID or by name (substring match).
 * Requires COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN in .env (or env).
 *
 * Usage:
 *   node scripts/coolify-restart-apps.mjs <uuid-or-name> [uuid-or-name ...]
 *   node scripts/coolify-restart-apps.mjs --list
 *
 * Examples:
 *   node scripts/coolify-restart-apps.mjs rpg-service
 *   node scripts/coolify-restart-apps.mjs gaqno-rpg-service gaqno-erp-service
 *   node scripts/coolify-restart-apps.mjs --list
 */

import fs from "fs";
import path from "path";

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].trim().replace(/^["']|["']+$/g, "").trim();
  }
}
loadEnvFile(".env");

const BASE = (process.env.COOLIFY_BASE_URL || "").trim().replace(/\/$/, "");
const TOKEN = process.env.COOLIFY_ACCESS_TOKEN || process.env.COOLIFY_TOKEN || "";
const API_BASE = BASE.startsWith("http") ? `${BASE.replace(/\/$/, "")}/api/v1` : `http://${BASE}/api/v1`;

async function coolifyFetch(method, pathname, body) {
  const url = `${API_BASE}${pathname}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body != null) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`Coolify ${method} ${pathname}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

function isUuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str).trim());
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error("Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (or COOLIFY_TOKEN) in .env");
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((a) => a && a !== "--list");
  const listOnly = process.argv.includes("--list") || args.length === 0;

  let applications = [];
  try {
    applications = await coolifyFetch("GET", "/applications");
  } catch (e) {
    console.error("Failed to fetch applications:", e.message);
    process.exit(1);
  }

  if (!Array.isArray(applications)) {
    applications = applications?.data != null ? applications.data : [];
  }

  if (listOnly) {
    console.log("Coolify applications (use name or uuid with this script):\n");
    for (const app of applications) {
      const name = app.name || app.uuid || "?";
      const uuid = app.uuid || "—";
      console.log(`  ${name}\n    uuid: ${uuid}`);
    }
    return;
  }

  const toRestart = [];
  for (const arg of args) {
    if (isUuid(arg)) {
      const app = applications.find((a) => (a.uuid || a.id) === arg);
      if (app) toRestart.push(app);
      else console.error(`No application with uuid: ${arg}`);
    } else {
      const lower = arg.toLowerCase();
      const matches = applications.filter(
        (a) => (a.name || "").toLowerCase().includes(lower) || (a.fqdn || "").toLowerCase().includes(lower)
      );
      if (matches.length === 0) console.error(`No application matching: ${arg}`);
      else toRestart.push(...matches);
    }
  }

  const uniq = [...new Map(toRestart.map((a) => [a.uuid || a.id, a])).values()];
  if (uniq.length === 0) {
    console.error("No applications to restart.");
    process.exit(1);
  }

  for (const app of uniq) {
    const uuid = app.uuid || app.id;
    const name = app.name || uuid;
    try {
      const result = await coolifyFetch("POST", `/applications/${uuid}/restart`);
      const deploymentUuid = result?.deployment_uuid ?? result?.deploymentUuid ?? "—";
      console.log(`Restart queued: ${name} (deployment: ${deploymentUuid})`);
    } catch (e) {
      console.error(`Restart failed for ${name}:`, e.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

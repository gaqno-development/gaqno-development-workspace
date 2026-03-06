#!/usr/bin/env node
/**
 * List Coolify deployments that failed in the last N hours.
 * Requires COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN in .env (or env).
 * Usage: node scripts/coolify-failed-deployments.mjs [hours]
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
const HOURS = Math.max(0.1, parseFloat(process.argv[2] || "1", 10));
const SINCE_MS = Date.now() - HOURS * 60 * 60 * 1000;

async function coolifyFetch(method, pathname) {
  const url = `${API_BASE}${pathname}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Coolify ${method} ${pathname}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

function isFailed(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === "failed" || s === "failure" || s === "crashed" || s === "error";
}

function parseDate(str) {
  if (!str) return 0;
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error("Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (or COOLIFY_TOKEN) in .env");
    process.exit(1);
  }

  let deployments = [];
  try {
    deployments = await coolifyFetch("GET", "/deployments");
  } catch (e) {
    console.error("Failed to fetch deployments:", e.message);
    process.exit(1);
  }

  if (!Array.isArray(deployments)) {
    deployments = deployments?.data != null ? deployments.data : [];
  }

  const failed = deployments.filter((d) => {
    const createdAt = parseDate(d.created_at);
    return createdAt >= SINCE_MS && isFailed(d.status);
  });

  const recent = deployments.filter((d) => parseDate(d.created_at) >= SINCE_MS);

  if (failed.length === 0) {
    console.log(`No failed deployments in the last ${HOURS} hour(s).`);
    console.log(`(Total deployments from API: ${deployments.length}; in last ${HOURS}h: ${recent.length})\n`);
    if (recent.length > 0) {
      console.log("Recent deployments (last hour):");
      for (const d of recent.slice(0, 20)) {
        console.log(`  ${d.application_name || d.application_id || "?"} | ${d.status} | ${d.commit || "—"} | ${d.created_at}`);
      }
    }
    return;
  }

  console.log(`Failed deployments in the last ${HOURS} hour(s):\n`);
  for (const d of failed) {
    console.log(`  Application: ${d.application_name || d.application_id || "—"}`);
    console.log(`  Commit:      ${d.commit || d.git_commit_sha || "—"}`);
    console.log(`  Message:     ${d.commit_message || "—"}`);
    console.log(`  Status:      ${d.status}`);
    console.log(`  Created:     ${d.created_at}`);
    console.log(`  Server:      ${d.server_name || "—"}`);
    if (d.logs && d.logs.length > 0) {
      const tail = typeof d.logs === "string" ? d.logs.slice(-500) : String(d.logs).slice(-500);
      console.log(`  Logs (tail): ${tail.replace(/\n/g, " ")}`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

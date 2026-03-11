#!/usr/bin/env node
/**
 * List Coolify applications whose latest deployment is failed or retrying.
 * Requires COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (or COOLIFY_TOKEN) in .env.
 *
 * Usage: node scripts/coolify-status-retries.mjs
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

function isFailedOrRetrying(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return (
    s === "failed" ||
    s === "crashed" ||
    s === "error" ||
    s === "retrying" ||
    s.includes("retry")
  );
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error("Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (or COOLIFY_TOKEN) in .env");
    process.exit(1);
  }

  const appsRes = await coolifyFetch("GET", "/applications");
  const appList = Array.isArray(appsRes) ? appsRes : appsRes?.data ?? [];
  const failed = [];

  for (const app of appList) {
    const uuid = app.uuid;
    const name = app.name ?? app.uuid;
    const deploymentsRes = await coolifyFetch("GET", `/deployments/applications/${uuid}?take=1&skip=0`);
    const deployments = Array.isArray(deploymentsRes)
      ? deploymentsRes
      : deploymentsRes?.data ?? deploymentsRes?.deployments ?? [];
    const latest = deployments[0];
    if (!latest) {
      failed.push({ name, uuid, status: "no_deployment" });
      continue;
    }
    const status = latest.status ?? latest.deployment_status ?? "unknown";
    if (isFailedOrRetrying(status)) {
      failed.push({ name, uuid, status });
    }
  }

  if (failed.length === 0) {
    console.log("No applications with failed or retrying deployments.");
    return;
  }

  console.log(`Applications with failed/retrying deployments (${failed.length}):\n`);
  for (const f of failed) {
    console.log(`  ${f.name}: ${f.status}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Cancel all running/queued Coolify deployments.
 *
 * Requires COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN in .env (or env).
 *
 * Usage:
 *   node scripts/coolify-cancel-deployments.mjs [--dry-run] [--apply]
 *
 *   --dry-run  List cancellable deployments without cancelling
 *   --apply    Actually cancel each deployment
 */

import fs from "fs";
import path from "path";

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2]
        .trim()
        .replace(/^["']|["']+$/g, "")
        .trim();
  }
}
loadEnvFile(".env");

const BASE = (process.env.COOLIFY_BASE_URL || "").trim().replace(/\/$/, "");
const TOKEN = process.env.COOLIFY_ACCESS_TOKEN || process.env.COOLIFY_TOKEN || "";
const API_BASE = BASE.startsWith("http") ? `${BASE.replace(/\/$/, "")}/api/v1` : `http://${BASE}/api/v1`;

const dryRun = process.argv.includes("--dry-run");
const apply = process.argv.includes("--apply");

function isCancellable(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  const done = ["finished", "success", "successful", "deployed", "done", "failed", "failure", "crashed", "error", "cancelled", "cancelled-by-user"];
  if (done.some((d) => s === d || s.includes(d))) return false;
  return ["queued", "in_progress", "in-progress", "building", "pending", "running"].some((c) =>
    s.includes(c) || s === c
  );
}

function getDeploymentUuid(d) {
  return d.deployment_uuid ?? d.uuid ?? d.id ?? null;
}

async function coolifyFetch(method, pathname, body = undefined) {
  const url = `${API_BASE}${pathname}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`Coolify ${method} ${pathname}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error("Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (or COOLIFY_TOKEN) in .env");
    process.exit(1);
  }

  if (!apply && !dryRun) {
    console.log("Usage: node coolify-cancel-deployments.mjs [--dry-run] [--apply]");
    console.log("  --dry-run  List cancellable deployments without cancelling");
    console.log("  --apply   Actually cancel each deployment");
    process.exit(0);
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

  const cancellable = deployments.filter((d) => isCancellable(d.status ?? d.deployment_status));

  if (cancellable.length === 0) {
    console.log("No running or queued deployments to cancel.");
    return;
  }

  console.log(`Found ${cancellable.length} cancellable deployment(s):\n`);

  for (const d of cancellable) {
    const uuid = getDeploymentUuid(d);
    const name = d.application_name ?? d.application_id ?? d.name ?? "—";
    const status = d.status ?? d.deployment_status ?? "unknown";
    const commit = d.commit ?? "—";

    if (!uuid) {
      console.warn(`[?] Skipping deployment without UUID (${name}, ${status})`);
      continue;
    }

    console.log(`  ${name} — ${status} (commit: ${commit}) [${uuid}]`);

    if (apply) {
      try {
        const res = await coolifyFetch("POST", `/deployments/${uuid}/cancel`);
        console.log(`    ✓ Cancelled: ${res?.status ?? "cancelled-by-user"}`);
      } catch (err) {
        console.error(`    ✗ Failed: ${err.message}`);
      }
    }
  }

  if (dryRun) {
    console.log("\n[ dry-run ] Run with --apply to cancel these deployments.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

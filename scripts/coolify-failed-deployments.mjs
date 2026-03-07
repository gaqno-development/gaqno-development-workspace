#!/usr/bin/env node
/**
 * List Coolify deployments that failed (or had too many retries), and output their logs.
 * Considers: (1) deployments in the last N hours, (2) at least the last 3 deployments by date.
 * For each failure, indicates when there is a newer successful deploy for the same app ([PASSADO]).
 * Fetches full deployment details to get logs when needed.
 *
 * Requires COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN in .env (or env).
 *
 * Usage:
 *   node scripts/coolify-failed-deployments.mjs [hours] [options]
 *
 * Options:
 *   --no-fetch-logs   Use only list response (no GET /deployments/{uuid}); logs may be truncated or missing
 *   --lines=N         Max log lines to show per deployment (default: 250)
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

const argv = process.argv.slice(2);
const hoursArg = argv.find((a) => !a.startsWith("--"));
const HOURS = Math.max(0.1, parseFloat(hoursArg || "1", 10));
const SINCE_MS = Date.now() - HOURS * 60 * 60 * 1000;
const NO_FETCH_LOGS = argv.includes("--no-fetch-logs");
const LINES_MATCH = argv.find((a) => a.startsWith("--lines="));
const MAX_LOG_LINES = LINES_MATCH ? Math.max(50, parseInt(LINES_MATCH.split("=")[1], 10) || 250) : 250;

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

function hasHighRetries(d) {
  const n = d.retry_count ?? d.retryCount ?? d.retries;
  if (typeof n === "number" && n >= 2) return true;
  const s = String(d.status || "").toLowerCase();
  return s === "retrying" || s.includes("retry");
}

function parseDate(str) {
  if (!str) return 0;
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

function getDeploymentUuid(d) {
  return d.deployment_uuid ?? d.uuid ?? d.id ?? null;
}

function lastLines(str, maxLines) {
  if (!str || typeof str !== "string") return "";
  const lines = str.trim().split(/\r?\n/);
  if (lines.length <= maxLines) return str.trim();
  return lines.slice(-maxLines).join("\n");
}

const MIN_LAST_DEPLOYMENTS = 3;

function isSuccess(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === "finished" || s === "success" || s === "successful" || s === "deployed" || s === "done";
}

function appKey(d) {
  return d.application_id ?? d.application_name ?? "";
}

function hasNewerSuccessfulDeploy(allDeployments, failedDeploy) {
  const created = parseDate(failedDeploy.created_at);
  const key = appKey(failedDeploy);
  if (!key) return null;
  const newer = allDeployments.find(
    (d) => appKey(d) === key && parseDate(d.created_at) > created && isSuccess(d.status)
  );
  return newer ? newer : null;
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

  const byDateDesc = [...deployments].sort((a, b) => parseDate(b.created_at) - parseDate(a.created_at));
  const lastN = byDateDesc.slice(0, MIN_LAST_DEPLOYMENTS);
  const inWindow = deployments.filter((d) => parseDate(d.created_at) >= SINCE_MS);
  const toConsiderIds = new Set([
    ...inWindow.map((d) => getDeploymentUuid(d) || `${appKey(d)}-${d.created_at}`),
    ...lastN.map((d) => getDeploymentUuid(d) || `${appKey(d)}-${d.created_at}`),
  ]);
  const toConsider = deployments.filter(
    (d) => toConsiderIds.has(getDeploymentUuid(d)) || toConsiderIds.has(`${appKey(d)}-${d.created_at}`)
  );

  const failed = toConsider.filter((d) => isFailed(d.status));
  const highRetries = toConsider.filter((d) => !isFailed(d.status) && hasHighRetries(d));
  const withLogs = [...failed, ...highRetries];
  const seen = new Set();
  const unique = withLogs.filter((d) => {
    const key = getDeploymentUuid(d) || `${d.application_id}-${d.created_at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0) {
    console.log(`No failed or high-retry deployments (last ${HOURS}h + últimos ${MIN_LAST_DEPLOYMENTS} da lista).`);
    console.log(`(Total deployments from API: ${deployments.length}; in last ${HOURS}h: ${inWindow.length})\n`);
    if (byDateDesc.length > 0) {
      console.log("Últimos deployments (por data):");
      for (const d of byDateDesc.slice(0, 20)) {
        console.log(`  ${d.application_name || d.application_id || "?"} | ${d.status} | ${d.commit || "—"} | ${d.created_at}`);
      }
    }
    return;
  }

  console.log(`Failed: ${failed.length} | High retries: ${highRetries.length} (janela ${HOURS}h + últimos ${MIN_LAST_DEPLOYMENTS})\n`);

  for (const d of unique) {
    const appName = d.application_name || d.application_id || "—";
    const uuid = getDeploymentUuid(d);
    let logs = d.logs ? (typeof d.logs === "string" ? d.logs : String(d.logs)) : "";

    if (!NO_FETCH_LOGS && uuid && (!logs || logs.length < 100)) {
      try {
        const full = await coolifyFetch("GET", `/deployments/${uuid}`);
        if (full && full.logs) logs = typeof full.logs === "string" ? full.logs : String(full.logs);
      } catch (e) {
        logs = logs || `(Could not fetch logs: ${e.message})`;
      }
    }

    const newerSuccess = hasNewerSuccessfulDeploy(deployments, d);

    console.log("---");
    console.log(`Application: ${appName}`);
    console.log(`Commit:      ${d.commit || d.git_commit_sha || "—"}`);
    console.log(`Message:     ${d.commit_message || "—"}`);
    console.log(`Status:      ${d.status}`);
    console.log(`Created:     ${d.created_at}`);
    console.log(`Server:      ${d.server_name || "—"}`);
    if (d.retry_count != null || d.retryCount != null) {
      console.log(`Retries:     ${d.retry_count ?? d.retryCount}`);
    }
    if (newerSuccess) {
      console.log(`→ [PASSADO] Existe deploy mais recente com sucesso em ${newerSuccess.created_at} (commit ${newerSuccess.commit || "—"}).`);
    }
    console.log("");
    if (logs) {
      const tail = lastLines(logs, MAX_LOG_LINES);
      console.log("Logs (last " + MAX_LOG_LINES + " lines):");
      console.log("----------------------------------------");
      console.log(tail);
      console.log("----------------------------------------");
    } else {
      console.log("Logs: (none in response)");
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

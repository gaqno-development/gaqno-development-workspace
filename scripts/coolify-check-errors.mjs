#!/usr/bin/env node

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
const TOKEN = process.env.COOLIFY_ACCESS_TOKEN || "";
const API_BASE = `${BASE}/api/v1`;
const LINES = process.env.COOLIFY_LOG_LINES || "50";

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
  if (!res.ok) {
    throw new Error(`Coolify ${method} ${pathname}: ${res.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error(
      "Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (e.g. in .env)"
    );
    process.exit(1);
  }

  console.log("Coolify:", BASE);
  console.log("");

  const appsRes = await coolifyFetch("GET", "/applications");
  const appList = Array.isArray(appsRes) ? appsRes : appsRes?.data ?? [];
  if (appList.length === 0) {
    console.log("No applications found.");
    return;
  }

  const failed = [];
  const running = [];

  for (const app of appList) {
    const uuid = app.uuid;
    const name = app.name ?? app.uuid;
    const deploymentsRes = await coolifyFetch(
      "GET",
      `/deployments/applications/${uuid}?take=1&skip=0`
    );
    const deployments = Array.isArray(deploymentsRes)
      ? deploymentsRes
      : deploymentsRes?.data ?? deploymentsRes?.deployments ?? [];
    const latest = deployments[0];
    if (!latest) {
      failed.push({ name, uuid, status: "no_deployment", log: null });
      continue;
    }
    const status = latest.status ?? latest.deployment_status ?? "unknown";
    if (
      status === "Failed" ||
      status === "Crashed" ||
      status === "failed" ||
      status === "crashed" ||
      status === "Error"
    ) {
      failed.push({
        name,
        uuid,
        deploymentUuid: latest.uuid,
        status,
        log: null,
      });
    } else {
      running.push({ name, status });
    }
  }

  if (failed.length > 0) {
    console.log("--- Applications with failed/crashed deployments ---\n");
    for (const f of failed) {
      console.log(`${f.name} (${f.uuid}): ${f.status}`);
      if (f.deploymentUuid) {
        try {
          const logRes = await coolifyFetch(
            "GET",
            `/applications/${f.uuid}/logs?lines=${LINES}`
          );
          const logText =
            typeof logRes === "string"
              ? logRes
              : logRes?.logs ?? logRes?.data ?? JSON.stringify(logRes);
          if (logText) {
            console.log("Last log lines:");
            console.log(logText.slice(-2000));
          }
        } catch (e) {
          console.log("Log fetch error:", e.message);
        }
      }
      console.log("");
    }
  } else {
    console.log("No failed or crashed deployments found.");
  }

  console.log("--- All applications (latest deployment status) ---");
  for (const r of running) {
    console.log(`  ${r.name}: ${r.status}`);
  }
  for (const f of failed) {
    console.log(`  ${f.name}: ${f.status} (see above)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

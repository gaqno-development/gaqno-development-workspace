#!/usr/bin/env node

import fs from "fs";
import path from "path";

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m)
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

function toHttps(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/^http:\/\//i, "https://")
    .replace(/,(\s*)http:\/\//gi, ",$1https://");
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
  if (!res.ok)
    throw new Error(`Coolify ${method} ${pathname}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error(
      "Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (e.g. in .env)"
    );
    process.exit(1);
  }

  const dryRun = process.argv.includes("--dry-run");

  const appsRes = await coolifyFetch("GET", "/applications");
  const appList = Array.isArray(appsRes) ? appsRes : (appsRes?.data ?? []);
  console.log("Applications:", appList.length);

  for (const app of appList) {
    const uuid = app.uuid;
    const name = app.name || uuid;
    const full = await coolifyFetch("GET", `/applications/${uuid}`);
    const current =
      full.fqdn ??
      full.domains ??
      full.public_domain ??
      app.fqdn ??
      app.domains ??
      "";
    const currentStr = typeof current === "string" ? current : "";
    const updated = toHttps(currentStr);
    if (!currentStr || currentStr === updated) {
      console.log(`[skip] ${name}: already https or no domain`);
      continue;
    }
    console.log(`[update] ${name}: ${currentStr} -> ${updated}`);
    if (dryRun) continue;
    await coolifyFetch("PATCH", `/applications/${uuid}`, {
      domains: updated,
      force_domain_override: true,
    });
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BASE = (process.env.DOKPLOY_BASE_URL || process.env.DOKPLOY_URL || "").replace(/\/$/, "");
const API_KEY = process.env.DOKPLOY_API_KEY || "";
const MATCH = (process.env.DOKPLOY_LATENCY_INSPECT_MATCH || "erp,sso")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const TIMEOUT_MS = Math.min(
  Math.max(parseInt(process.env.DOKPLOY_HTTP_TIMEOUT_MS || "25000", 10) || 25000, 5000),
  120000,
);

async function dokployFetch(path, query = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "x-api-key": API_KEY,
        accept: "application/json",
      },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Dokploy ${res.status} ${path}: ${text.slice(0, 200)}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

function appMatches(a) {
  const name = `${a.name || ""} ${a.appName || ""}`.toLowerCase();
  return MATCH.some((m) => name.includes(m));
}

function redactApplication(full) {
  if (!full || typeof full !== "object") return full;
  const { env: _env, ...rest } = full;
  return rest;
}

async function main() {
  if (!BASE || !API_KEY) {
    console.error(
      "Set DOKPLOY_BASE_URL (…/api) and DOKPLOY_API_KEY. Optional: DOKPLOY_LATENCY_INSPECT_MATCH=erp,sso",
    );
    process.exit(2);
  }

  const projects = await dokployFetch("/project.all");
  const list = Array.isArray(projects) ? projects : projects?.projects || [];

  for (const p of list) {
    for (const a of p.applications || []) {
      if (!appMatches(a)) continue;
      const appId = a.applicationId || a.id;
      if (!appId) continue;
      const full = await dokployFetch("/application.one", {
        applicationId: String(appId),
      });
      const meta = redactApplication(full);
      console.log(
        JSON.stringify(
          {
            project: p.name || p.projectId,
            applicationId: appId,
            name: a.name || a.appName,
            dokployMetadataExcludingEnv: meta,
          },
          null,
          2,
        ),
      );
      console.log("");
    }
  }
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

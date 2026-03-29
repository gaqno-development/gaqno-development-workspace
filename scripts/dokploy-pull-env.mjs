#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env");

const BASE = (process.env.DOKPLOY_BASE_URL || process.env.DOKPLOY_URL || "").replace(/\/$/, "");
const API_KEY = process.env.DOKPLOY_API_KEY || "";
const MATCH = (process.env.DOKPLOY_ERP_APP_MATCH || "erp").toLowerCase();
const TIMEOUT_MS = Math.min(
  Math.max(parseInt(process.env.DOKPLOY_HTTP_TIMEOUT_MS || "25000", 10) || 25000, 5000),
  120000,
);

const args = new Set(process.argv.slice(2));
const LIST_ONLY = args.has("--list-apps");
const APPLY = args.has("--apply");

async function dokployFetch(path, query = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res;
    try {
      res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          "x-api-key": API_KEY,
          accept: "application/json",
        },
      });
    } catch (e) {
      const detail = e?.cause?.code || e?.cause?.message || e?.message || e;
      throw new Error(`cannot reach ${url.origin} (${detail}). VPN, firewall, or wrong DOKPLOY_BASE_URL?`);
    }
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Dokploy ${res.status} ${path}: ${text.slice(0, 200)}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

function parseEnvBlock(block) {
  const out = {};
  if (!block || typeof block !== "string") return out;
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function pickErpApp(projects) {
  const candidates = [];
  for (const p of projects || []) {
    const apps = p.applications || [];
    for (const a of apps) {
      const name = `${a.name || ""} ${a.appName || ""}`.toLowerCase();
      if (name.includes(MATCH)) {
        candidates.push({ project: p.name, app: a });
      }
    }
  }
  return candidates;
}

function mergeDatabaseUrlIntoEnvFile(content, databaseUrl) {
  const marker = "# ── Database (Dokploy / scripts/dokploy-pull-env.mjs) ──";
  const line = `DATABASE_URL=${databaseUrl}`;
  if (/^DATABASE_URL=/m.test(content)) {
    return content.replace(/^DATABASE_URL=.*$/m, line);
  }
  const inject = `\n${marker}\n${line}\n`;
  if (content.endsWith("\n")) return content + inject;
  return content + "\n" + inject;
}

async function main() {
  if (!BASE || !API_KEY) {
    console.error(
      "Set DOKPLOY_BASE_URL (…/api) and DOKPLOY_API_KEY in .env. npm run dokploy:list-apps | dokploy:apply",
    );
    process.exit(2);
  }

  const projects = await dokployFetch("/project.all");
  const list = Array.isArray(projects) ? projects : projects?.projects || [];

  if (LIST_ONLY) {
    for (const p of list) {
      for (const a of p.applications || []) {
        const id = a.applicationId || a.id;
        console.log(`${p.name || p.projectId}\t${a.name || a.appName}\t${id}`);
      }
    }
    return;
  }

  const erpCandidates = pickErpApp(list);
  if (erpCandidates.length === 0) {
    console.error(`No application name containing "${MATCH}". Use --list-apps or set DOKPLOY_ERP_APP_MATCH.`);
    process.exit(1);
  }

  const { app } = erpCandidates[0];
  const appId = app.applicationId || app.id;
  if (!appId) {
    console.error("Could not read applicationId from project list. Try --list-apps.");
    process.exit(1);
  }

  const full = await dokployFetch("/application.one", { applicationId: String(appId) });
  const vars = parseEnvBlock(full?.env || "");
  const databaseUrl = vars.DATABASE_URL;

  if (!databaseUrl) {
    console.error("application.one has no DATABASE_URL in env block. Check app in Dokploy UI.");
    process.exit(1);
  }

  const r2Keys = ["R2_ACCESS_KEY_ID", "R2_ACCESS_KEY", "R2_SECRET_ACCESS_KEY", "R2_SECRET_KEY", "R2_BUCKET", "R2_PUBLIC_URL"];
  const r2Lines = r2Keys.filter((k) => vars[k]).map((k) => `${k}=${vars[k]}`);

  if (APPLY) {
    let body = readFileSync(ENV_PATH, "utf-8");
    body = mergeDatabaseUrlIntoEnvFile(body, databaseUrl);
    writeFileSync(ENV_PATH, body, "utf-8");
    console.log(`Updated DATABASE_URL in ${ENV_PATH}`);
  } else {
    console.log("# Paste into .env or run with --apply");
    console.log(`DATABASE_URL=${databaseUrl}`);
    for (const line of r2Lines) console.log(line);
  }
}

function printConnectHints(errMsg) {
  const m = String(errMsg);
  if (!/cannot reach|UND_ERR_|ECONNREFUSED|ENOTFOUND|AbortError/i.test(m)) return;
  console.error("");
  console.error("Se a UI do Dokploy abre no browser mas este script falha:");
  console.error("  • Use o mesmo host que a UI, com sufixo /api — ex.: https://dokploy.seudominio.com/api");
  console.error("  • IP:3000 direto costuma estar fechado no firewall ou o serviço escuta só em 127.0.0.1.");
  console.error("No servidor: ss -tlnp | grep 3000  (veja se é 0.0.0.0 ou 127.0.0.1)");
  console.error("Túnel SSH se a API for só local no VPS:");
  console.error("  ssh -N -L 3000:127.0.0.1:3000 user@72.61.221.19");
  console.error("  DOKPLOY_BASE_URL=http://127.0.0.1:3000/api npm run dokploy:list-apps");
  console.error("  DOKPLOY_BASE_URL=http://127.0.0.1:3000/api npm run dokploy:apply");
}

main().catch((e) => {
  const msg =
    e?.name === "AbortError"
      ? `Request timed out after ${TIMEOUT_MS}ms (Dokploy lento ou URL errada)`
      : e?.message || e;
  console.error(msg);
  printConnectHints(msg);
  process.exit(1);
});

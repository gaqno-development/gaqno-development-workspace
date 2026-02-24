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

const BASE = (process.env.COOLIFY_BASE_URL || "")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const TOKEN = process.env.COOLIFY_ACCESS_TOKEN || "";
const API_BASE = `http://${BASE}/api/v1`;

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

async function findApplicationByName(namePattern) {
  const appsRes = await coolifyFetch("GET", "/applications");
  const appList = Array.isArray(appsRes) ? appsRes : (appsRes?.data ?? []);

  return appList.find(
    (app) =>
      (app.name &&
        app.name.toLowerCase().includes(namePattern.toLowerCase())) ||
      (app.fqdn && app.fqdn.toLowerCase().includes(namePattern.toLowerCase())),
  );
}

async function deployApplication(appUuid, appName) {
  console.log(`🚀 Deploying ${appName}...`);

  try {
    const deployRes = await coolifyFetch(
      "GET",
      `/deploy?uuid=${encodeURIComponent(appUuid)}&force=true`,
    );

    console.log(`✅ Deployment triggered for ${appName}`);
    console.log(`   Deployment UUID: ${deployRes?.deployment_uuid || "N/A"}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to deploy ${appName}:`, error.message);
    return false;
  }
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error(
      "Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (e.g. in .env)",
    );
    process.exit(1);
  }

  console.log("Coolify:", BASE);
  console.log("");

  const appsToDeploy = [
    { name: "shell", pattern: "shell" },
    { name: "omnichannel", pattern: "omnichannel" },
  ];

  const results = [];

  for (const app of appsToDeploy) {
    console.log(`\n--- Looking for ${app.name} application ---`);

    const appInfo = await findApplicationByName(app.pattern);

    if (!appInfo) {
      console.log(`❌ Application '${app.name}' not found`);
      results.push({ name: app.name, success: false, error: "Not found" });
      continue;
    }

    console.log(`✅ Found: ${appInfo.name} (${appInfo.uuid})`);
    console.log(`   FQDN: ${appInfo.fqdn || "N/A"}`);
    console.log(`   Status: ${appInfo.status || "N/A"}`);

    const success = await deployApplication(appInfo.uuid, appInfo.name);
    results.push({ name: app.name, success, uuid: appInfo.uuid });
  }

  console.log("\n--- Deployment Summary ---");
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.name}: Deployed successfully`);
    } else {
      console.log(`❌ ${result.name}: Failed - ${result.error}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Add Public Hostname (ingress) for grafana.gaqno.com.br to the Cloudflare Tunnel
 * so the tunnel routes traffic to Grafana (localhost:5678 when cloudflared uses network_mode: host).
 *
 * Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
 * Optional: CLOUDFLARE_TUNNEL_ID (if not set, uses first tunnel or one named like GAQNO_PROD).
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=xxx node scripts/cloudflare-tunnel-add-grafana-route.mjs
 */

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "17c0f489f699231dff3588ca19a9cb9a";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const TUNNEL_ID = process.env.CLOUDFLARE_TUNNEL_ID || "";
const GRAFANA_ORIGIN = process.env.GRAFANA_ORIGIN || "http://localhost:5678";

const BASE = "https://api.cloudflare.com/client/v4";

async function cf(method, path, body = undefined) {
  const url = `${BASE}${path}`;
  const opts = {
    method,
    headers: { Authorization: `Bearer ${TOKEN}` },
  };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Cloudflare API ${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  if (!TOKEN) {
    console.error("Set CLOUDFLARE_API_TOKEN (and optionally CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_TUNNEL_ID)");
    process.exit(1);
  }

  let tunnelId = TUNNEL_ID;
  if (!tunnelId) {
    const list = await cf("GET", `/accounts/${ACCOUNT_ID}/cfd_tunnel?per_page=50`);
    const tunnels = list.result || [];
    const found = tunnels.find((t) => t.name && (t.name.includes("GAQNO_PROD") || t.name.includes("gaqno")));
    if (found) {
      tunnelId = found.id;
      console.log("Using tunnel:", found.name, "(" + tunnelId + ")");
    } else if (tunnels.length > 0) {
      tunnelId = tunnels[0].id;
      console.log("Using first tunnel:", tunnels[0].name, "(" + tunnelId + ")");
    } else {
      console.error("No tunnels found. Set CLOUDFLARE_TUNNEL_ID or create a tunnel in the dashboard.");
      process.exit(1);
    }
  }

  const getConfig = await cf("GET", `/accounts/${ACCOUNT_ID}/cfd_tunnel/${tunnelId}/configurations`);
  const config = getConfig.result?.config || {};

  const ingress = Array.isArray(config.ingress) ? [...config.ingress] : [];
  const catchAll = ingress.filter((r) => !r.hostname && (r.service === "http_status:404" || r.service?.startsWith("http_status:")));
  const rest = ingress.filter((r) => r.hostname !== "grafana.gaqno.com.br" && r.service !== "http_status:404" && !r.service?.startsWith("http_status:"));

  const grafanaRule = { hostname: "grafana.gaqno.com.br", service: GRAFANA_ORIGIN };
  const newIngress = [...rest, grafanaRule, ...catchAll];
  if (catchAll.length === 0) {
    newIngress.push({ service: "http_status:404" });
  }

  const newConfig = { ...config, ingress: newIngress };
  await cf("PUT", `/accounts/${ACCOUNT_ID}/cfd_tunnel/${tunnelId}/configurations`, { config: newConfig });
  console.log("Added route: grafana.gaqno.com.br ->", GRAFANA_ORIGIN);
  console.log("Tunnel config updated. Allow a few seconds for cloudflared to pick up the change.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

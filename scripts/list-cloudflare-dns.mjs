#!/usr/bin/env node
/**
 * List Cloudflare DNS records for zone gaqno.com.br.
 * Optional filter: pass "grafana", "lenin", or any substring to show only matching names.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=xxx node scripts/list-cloudflare-dns.mjs
 *   CLOUDFLARE_API_TOKEN=xxx node scripts/list-cloudflare-dns.mjs grafana lenin
 */

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "d628a8ac60069acccbc154d173b88717";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";

const filters = process.argv.slice(2).map((s) => s.toLowerCase());

async function listDnsRecords() {
  if (!TOKEN) {
    console.error("Set CLOUDFLARE_API_TOKEN (e.g. export CLOUDFLARE_API_TOKEN=your_token)");
    console.error("Optional: CLOUDFLARE_ZONE_ID (default: gaqno.com.br zone)");
    process.exit(1);
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?per_page=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Cloudflare API error:", res.status, text);
    process.exit(1);
  }

  const data = await res.json();
  if (!data.success || !Array.isArray(data.result)) {
    console.error("Unexpected response:", data);
    process.exit(1);
  }

  let records = data.result;
  if (filters.length > 0) {
    records = records.filter((r) => {
      const name = (r.name || "").toLowerCase();
      return filters.some((f) => name.includes(f));
    });
  }

  if (records.length === 0) {
    console.log(filters.length ? `No DNS records matching: ${filters.join(", ")}` : "No DNS records.");
    return;
  }

  console.log(`Zone ${ZONE_ID} (gaqno.com.br) – ${records.length} record(s)\n`);
  for (const r of records) {
    const type = (r.type || "").padEnd(6);
    const name = r.name || "";
    const content = r.content || "";
    const proxied = r.proxied ? " (proxied)" : "";
    console.log(`${type} ${name}  →  ${content}${proxied}`);
  }
}

listDnsRecords().catch((err) => {
  console.error(err);
  process.exit(1);
});

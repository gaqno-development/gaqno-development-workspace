#!/usr/bin/env node
/**
 * Add a Cloudflare DNS record for zone gaqno.com.br.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=xxx node scripts/add-cloudflare-dns.mjs <name> <type> <content> [proxied]
 *
 * Examples:
 *   CLOUDFLARE_API_TOKEN=xxx node scripts/add-cloudflare-dns.mjs docs CNAME gaqno.com.br true
 *   CLOUDFLARE_API_TOKEN=xxx node scripts/add-cloudflare-dns.mjs docs CNAME gaqno.com.br
 *
 * Optional: CLOUDFLARE_ZONE_ID (default: gaqno.com.br zone)
 * proxied: true | false (default true for CNAME)
 */

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "d628a8ac60069acccbc154d173b88717";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";

const [name, type, content, proxiedRaw] = process.argv.slice(2);
const proxied = proxiedRaw !== "false" && proxiedRaw !== "0";

async function addDnsRecord() {
  if (!TOKEN) {
    console.error("Set CLOUDFLARE_API_TOKEN");
    process.exit(1);
  }
  if (!name || !type || !content) {
    console.error("Usage: node scripts/add-cloudflare-dns.mjs <name> <type> <content> [proxied]");
    console.error("Example: node scripts/add-cloudflare-dns.mjs docs CNAME gaqno.com.br true");
    process.exit(1);
  }

  const body = {
    type: type.toUpperCase(),
    name: name.includes(".") ? name : `${name}.gaqno.com.br`,
    content: content,
    ttl: 1,
    proxied: type.toUpperCase() === "CNAME" ? proxied : false,
  };

  const url = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    console.error("Cloudflare API error:", res.status, data);
    process.exit(1);
  }

  const r = data.result;
  console.log(`Created: ${r.type} ${r.name} → ${r.content} (proxied: ${r.proxied})`);
}

addDnsRecord().catch((err) => {
  console.error(err);
  process.exit(1);
});

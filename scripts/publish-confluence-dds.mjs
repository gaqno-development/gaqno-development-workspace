#!/usr/bin/env node
/**
 * Publishes docs/confluence/*.md to Confluence DDS space.
 * Requires: CONFLUENCE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN, CONFLUENCE_SPACE
 * Example: CONFLUENCE_SPACE=DDS node scripts/publish-confluence-dds.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, "../docs/confluence");
const SPACE_KEY = process.env.CONFLUENCE_SPACE || "DDS";
let BASE_URL =
  process.env.CONFLUENCE_URL || "https://gaqno-development.atlassian.net/wiki";
let USERNAME = process.env.CONFLUENCE_USERNAME;
let API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

if (!USERNAME || !API_TOKEN) {
  try {
    const mcpPath = join(__dirname, "../.cursor/mcp.json");
    const mcp = JSON.parse(readFileSync(mcpPath, "utf8"));
    const env = mcp?.mcpServers?.atlassian?.env || {};
    USERNAME = USERNAME || env.CONFLUENCE_USERNAME;
    API_TOKEN = API_TOKEN || env.CONFLUENCE_API_TOKEN;
    BASE_URL = BASE_URL || env.CONFLUENCE_URL || BASE_URL;
  } catch (_) {}
}

if (!USERNAME || !API_TOKEN) {
  console.error(
    "Set CONFLUENCE_USERNAME and CONFLUENCE_API_TOKEN, or ensure .cursor/mcp.json has atlassian env"
  );
  process.exit(1);
}

const auth = Buffer.from(`${USERNAME}:${API_TOKEN}`).toString("base64");

function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^#+ /.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      out.push(`<h${level}>${line.replace(/^#+\s*/, "").trim()}</h${level}>`);
      i++;
    } else if (/^\|.+\|$/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        const row = lines[i];
        const isSep = /^\|[\s\-:]+\|/.test(row);
        if (!isSep) {
          const cells = row
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
          const tag = rows.length === 0 ? "th" : "td";
          rows.push(
            "<tr>" +
              cells.map((c) => `<${tag}>${c}</${tag}>`).join("") +
              "</tr>"
          );
        }
        i++;
      }
      if (rows.length > 0) {
        const hasHeader = rows[0].includes("<th>");
        out.push(
          hasHeader
            ? `<table><thead>${rows[0]}</thead><tbody>${rows.slice(1).join("")}</tbody></table>`
            : `<table><tbody>${rows.join("")}</tbody></table>`
        );
      }
    } else if (/^-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push("<li>" + lines[i].replace(/^-\s+/, "").trim() + "</li>");
        i++;
      }
      out.push("<ul>" + items.join("") + "</ul>");
    } else if (/^\*\*.*\*\*/.test(line) || line.trim() === "") {
      if (line.trim()) {
        out.push(
          "<p>" +
            line
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.*?)\*/g, "<em>$1</em>")
              .replace(/`(.*?)`/g, "<code>$1</code>") +
            "</p>"
        );
      }
      i++;
    } else {
      out.push(
        "<p>" +
          line
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, "<code>$1</code>") +
          "</p>"
      );
      i++;
    }
  }
  return out.join("\n").replace(/<p><\/p>/g, "");
}

async function createPage(title, body, parentId) {
  const payload = {
    type: "page",
    title,
    space: { key: SPACE_KEY },
    body: { storage: { value: body, representation: "storage" } },
  };
  if (parentId) payload.ancestors = [{ id: parentId }];

  const res = await fetch(`${BASE_URL}/rest/api/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Confluence API error: ${res.status} ${err}`);
  }
  return res.json();
}

async function findPageByTitle(title) {
  const res = await fetch(
    `${BASE_URL}/rest/api/content?spaceKey=${SPACE_KEY}&title=${encodeURIComponent(title)}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}

async function updatePage(id, title, body) {
  const current = await fetch(
    `${BASE_URL}/rest/api/content/${id}?expand=version`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  ).then((r) => r.json());
  const nextVersion = current.version.number + 1;

  const res = await fetch(`${BASE_URL}/rest/api/content/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      id,
      type: "page",
      title,
      body: { storage: { value: body, representation: "storage" } },
      version: { number: nextVersion },
    }),
  });
  if (!res.ok) throw new Error(`Update failed: ${await res.text()}`);
  return res.json();
}

const DOCS = [
  {
    file: "01-System-Architecture-Overview.md",
    title: "System Architecture Overview",
  },
  {
    file: "02-Frontend-Architecture-Guide.md",
    title: "Frontend Architecture Guide",
  },
  {
    file: "03-Backend-Architecture-Guide.md",
    title: "Backend Architecture Guide",
  },
  { file: "04-Contracts-Types-Guide.md", title: "Contracts & Types Guide" },
  {
    file: "05-Architectural-Rules-Guardrails.md",
    title: "Architectural Rules & Guardrails",
  },
  { file: "06-Health-Dashboard.md", title: "Health Dashboard" },
];

async function main() {
  let parentId = null;
  const created = [];

  for (const { file, title } of DOCS) {
    const path = join(DOCS_DIR, file);
    try {
      const md = readFileSync(path, "utf8");
      const html = mdToHtml(md);
      const existing = await findPageByTitle(title);
      if (existing) {
        await updatePage(existing.id, title, html);
        console.log(`Updated: ${title} (${BASE_URL}${existing._links.webui})`);
        if (!parentId) parentId = existing.id;
        created.push({ title, url: `${BASE_URL}${existing._links.webui}` });
      } else {
        const page = await createPage(title, html, parentId);
        parentId = page.id;
        console.log(`Created: ${title} (${BASE_URL}${page._links.webui})`);
        created.push({ title, url: `${BASE_URL}${page._links.webui}` });
      }
    } catch (e) {
      console.error(`Failed ${file}:`, e.message);
    }
  }

  console.log(
    "\nPublished to DDS space:",
    `${BASE_URL}/spaces/${SPACE_KEY}/overview`
  );
  created.forEach((c) => console.log(`  - ${c.title}: ${c.url}`));
}

main().catch(console.error);

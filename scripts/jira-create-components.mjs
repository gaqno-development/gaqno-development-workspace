const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.jira");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const JIRA_URL =
  process.env.JIRA_URL?.replace(/\/$/, "") || "https://gaqno.atlassian.net";
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY || "GAQNO";

const COMPONENTS = [
  { name: "gaqno-admin-ui", description: "Frontend – Admin UI" },
  { name: "gaqno-ai-ui", description: "Frontend – AI UI" },
  { name: "gaqno-crm-ui", description: "Frontend – CRM UI" },
  { name: "gaqno-erp-ui", description: "Frontend – ERP UI" },
  { name: "gaqno-finance-ui", description: "Frontend – Finance UI" },
  { name: "gaqno-landing-ui", description: "Frontend – Landing UI" },
  { name: "gaqno-lenin-ui", description: "Frontend – Lenin UI" },
  { name: "gaqno-omnichannel-ui", description: "Frontend – Omnichannel UI" },
  { name: "gaqno-pdv-ui", description: "Frontend – PDV UI" },
  { name: "gaqno-rpg-ui", description: "Frontend – RPG UI" },
  { name: "gaqno-saas-ui", description: "Frontend – SaaS UI" },
  { name: "gaqno-shell-ui", description: "Frontend – Shell UI" },
  { name: "gaqno-sso-ui", description: "Frontend – SSO UI" },
  { name: "gaqno-admin-service", description: "Backend – Admin Service" },
  { name: "gaqno-ai-service", description: "Backend – AI Service" },
  { name: "gaqno-finance-service", description: "Backend – Finance Service" },
  {
    name: "gaqno-omnichannel-service",
    description: "Backend – Omnichannel Service",
  },
  { name: "gaqno-pdv-service", description: "Backend – PDV Service" },
  { name: "gaqno-rpg-service", description: "Backend – RPG Service" },
  { name: "gaqno-saas-service", description: "Backend – SaaS Service" },
  { name: "gaqno-sso-service", description: "Backend – SSO Service" },
  { name: "@gaqno-backcore", description: "Package – Backend shared core" },
  { name: "@gaqno-frontcore", description: "Package – Frontend shared core" },
  {
    name: "gaqno-development-workspace",
    description: "Workspace – Monorepo root",
  },
];

const auth = Buffer.from(`${JIRA_USERNAME}:${JIRA_API_TOKEN}`).toString(
  "base64"
);

async function createComponent(component) {
  const res = await fetch(`${JIRA_URL}/rest/api/3/component`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      name: component.name,
      description: component.description,
      project: PROJECT_KEY,
    }),
  });
  if (res.status === 201) {
    const data = await res.json();
    return { ok: true, id: data.id, name: data.name };
  }
  const err = await res.text();
  return { ok: false, status: res.status, body: err };
}

async function getExistingComponents() {
  const res = await fetch(
    `${JIRA_URL}/rest/api/3/project/${PROJECT_KEY}/components`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
    }
  );
  if (!res.ok) return new Set();
  const list = await res.json();
  return new Set(list.map((c) => c.name));
}

async function main() {
  if (!JIRA_USERNAME || !JIRA_API_TOKEN) {
    console.error(
      "Set JIRA_USERNAME and JIRA_API_TOKEN (and optionally JIRA_URL, JIRA_PROJECT_KEY)"
    );
    process.exit(1);
  }
  const existing = await getExistingComponents();
  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const component of COMPONENTS) {
    if (existing.has(component.name)) {
      console.log(`Skip (exists): ${component.name}`);
      skipped++;
      continue;
    }
    const result = await createComponent(component);
    if (result.ok) {
      console.log(`Created: ${result.name} (id ${result.id})`);
      created++;
    } else {
      console.error(
        `Failed: ${component.name} – ${result.status} ${result.body}`
      );
      failed++;
    }
  }
  console.log(
    `\nDone: ${created} created, ${skipped} skipped, ${failed} failed`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

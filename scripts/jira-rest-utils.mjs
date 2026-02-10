#!/usr/bin/env node
/**
 * Jira REST API utilities. Use from scripts or Node to avoid MCP latency.
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env)
 *
 * Usage from script:
 *   import { loadJiraEnv, getIssue, addComment, transitionIssueByName } from './jira-rest-utils.mjs';
 *   const env = loadJiraEnv();
 *   const issue = await getIssue(env, 'GAQNO-1113');
 *   await addComment(env, 'GAQNO-1113', 'Done');
 */

import fs from "fs";
import path from "path";

const DEFAULT_JIRA_URL = "https://gaqno.atlassian.net";

export function loadEnvFile(filename) {
  const cwd = process.cwd();
  const envPath = path.join(cwd, filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m)
      process.env[m[1]] = m[2]
        .trim()
        .replace(/^["']|["',]+$/g, "")
        .trim();
  }
}

export function loadJiraEnv() {
  loadEnvFile(".env.jira");
  loadEnvFile(".env");
  const baseUrl = (process.env.JIRA_URL || DEFAULT_JIRA_URL)
    .trim()
    .replace(/\/$/, "");
  const username = process.env.JIRA_USERNAME;
  const apiToken = process.env.JIRA_API_TOKEN;
  if (!username || !apiToken) {
    throw new Error(
      "Set JIRA_USERNAME and JIRA_API_TOKEN (or .env.jira / .env)"
    );
  }
  const auth = Buffer.from(`${username}:${apiToken}`).toString("base64");
  return { baseUrl, auth };
}

export async function jira(env, pathname, opts = {}) {
  const res = await fetch(`${env.baseUrl}${pathname}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${env.auth}`,
      ...opts.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function getIssue(env, issueKey, options = {}) {
  const fields =
    options.fields ?? "summary,status,description,issuetype,assignee";
  const expand = options.expand ?? "";
  const q = new URLSearchParams({ fields });
  if (expand) q.set("expand", expand);
  return jira(env, `/rest/api/3/issue/${issueKey}?${q}`);
}

export async function getTransitions(env, issueKey) {
  const data = await jira(env, `/rest/api/3/issue/${issueKey}/transitions`);
  return data.transitions ?? [];
}

const STATUS_ALIASES = {
  "in-progress": "Em andamento",
  in_progress: "Em andamento",
  "em andamento": "Em andamento",
  fazendo: "Em andamento",
  done: "Concluído",
  feito: "Concluído",
  concluído: "Concluído",
  "em revisão": "Em revisão",
  "in review": "Em revisão",
};

export async function transitionIssue(env, issueKey, transitionId, body = {}) {
  return jira(env, `/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: String(transitionId) }, ...body }),
  });
}

export async function transitionIssueByName(env, issueKey, toName) {
  const name = (toName || "").trim();
  const targetName = STATUS_ALIASES[name.toLowerCase()] ?? name;
  const transitions = await getTransitions(env, issueKey);
  const re = new RegExp(
    targetName.replace(/\s+/g, "\\s+").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i"
  );
  const t = transitions.find((x) => re.test(x.name || ""));
  if (!t) {
    const available = transitions.map((x) => x.name).join(", ") || "(nenhuma)";
    throw new Error(
      `No transition matching "${targetName}". Available: ${available}`
    );
  }
  await transitionIssue(env, issueKey, t.id);
  return { id: t.id, name: t.name };
}

export async function addComment(env, issueKey, body) {
  const payload =
    typeof body === "string"
      ? {
          body: {
            type: "doc",
            version: 1,
            content: [
              { type: "paragraph", content: [{ type: "text", text: body }] },
            ],
          },
        }
      : body;
  return jira(env, `/rest/api/3/issue/${issueKey}/comment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getIssueLinkTypes(env) {
  const data = await jira(env, "/rest/api/3/issueLinkType");
  return data.issueLinkTypes ?? [];
}

export async function createIssueLink(
  env,
  inwardKey,
  outwardKey,
  linkTypeName
) {
  const types = await getIssueLinkTypes(env);
  const name = (linkTypeName || "").trim().toLowerCase();
  const linkType = types.find(
    (t) =>
      t.name?.toLowerCase() === name ||
      t.inward?.toLowerCase() === name ||
      t.outward?.toLowerCase() === name
  );
  if (!linkType)
    throw new Error(
      `Link type "${linkTypeName}" not found. Available: ${types.map((t) => t.name).join(", ")}`
    );
  return jira(env, "/rest/api/3/issueLink", {
    method: "POST",
    body: JSON.stringify({
      type: { name: linkType.name },
      inwardIssue: { key: inwardKey },
      outwardIssue: { key: outwardKey },
    }),
  });
}

export async function createRemoteLink(
  env,
  issueKey,
  url,
  title,
  summary = ""
) {
  return jira(env, `/rest/api/3/issue/${issueKey}/remotelink`, {
    method: "POST",
    body: JSON.stringify({
      object: { url, title, summary },
    }),
  });
}

export async function getRemoteLinks(env, issueKey) {
  const data = await jira(env, `/rest/api/3/issue/${issueKey}/remotelink`);
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function deleteRemoteLink(env, issueKey, linkId) {
  return jira(env, `/rest/api/3/issue/${issueKey}/remotelink/${linkId}`, {
    method: "DELETE",
  });
}

export async function getIssueLinks(env, issueKey) {
  const issue = await getIssue(env, issueKey, {
    fields: "issuelinks",
    expand: "renderedFields",
  });
  return issue.fields?.issuelinks ?? [];
}

const CLI_CMDS = [
  "get",
  "transitions",
  "comment",
  "transition",
  "link-types",
  "link",
];

async function runCli() {
  const [cmd, issueKey, ...rest] = process.argv.slice(2);
  if (!cmd || !CLI_CMDS.includes(cmd)) return false;
  const env = loadJiraEnv();
  if (cmd === "get" && issueKey) {
    console.log(JSON.stringify(await getIssue(env, issueKey), null, 2));
    return true;
  }
  if (cmd === "transitions" && issueKey) {
    console.log(JSON.stringify(await getTransitions(env, issueKey), null, 2));
    return true;
  }
  if (cmd === "comment" && issueKey && rest.length) {
    await addComment(env, issueKey, rest.join(" "));
    console.log("Comment added.");
    return true;
  }
  if (cmd === "transition" && issueKey && rest[0]) {
    const r = await transitionIssueByName(env, issueKey, rest[0]);
    console.log(`${issueKey} → ${r.name} (${r.id})`);
    return true;
  }
  if (cmd === "link-types") {
    console.log(JSON.stringify(await getIssueLinkTypes(env), null, 2));
    return true;
  }
  if (cmd === "link" && issueKey && rest[0] && rest[1]) {
    const [outwardKey, typeName] = rest;
    await createIssueLink(env, issueKey, outwardKey, typeName);
    console.log(`Linked ${issueKey} → ${outwardKey} (${typeName})`);
    return true;
  }
  console.error(
    `Usage: node jira-rest-utils.mjs <${CLI_CMDS.join("|")}> [args]`
  );
  process.exit(1);
}

const isMain =
  process.argv[1] && process.argv[1].endsWith("jira-rest-utils.mjs");
if (isMain) {
  runCli()
    .then((ran) => {
      if (!ran) {
        console.error(
          `Usage: node jira-rest-utils.mjs <${CLI_CMDS.join("|")}> [args]`
        );
        process.exit(1);
      }
    })
    .catch((e) => {
      console.error(e.message || e);
      process.exit(1);
    });
}

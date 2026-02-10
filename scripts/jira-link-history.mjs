#!/usr/bin/env node
/**
 * Link a child issue to a parent as "History" (or list link types) via REST.
 * E.g. GAQNO-1113 has Histories 1117, 1123 → link 1123 to 1113.
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env)
 *
 * Usage:
 *   node scripts/jira-link-history.mjs --parent=GAQNO-1113 --child=GAQNO-1123
 *   node scripts/jira-link-history.mjs --list-types
 */

import {
  loadJiraEnv,
  createIssueLink,
  getIssueLinkTypes,
} from "./jira-rest-utils.mjs";

const HISTORY_LINK_NAMES = [
  "History",
  "História",
  "has history",
  "is history of",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const listTypes = args.includes("--list-types");
  const parent = args
    .find((a) => a.startsWith("--parent="))
    ?.split("=")[1]
    ?.trim();
  const child = args
    .find((a) => a.startsWith("--child="))
    ?.split("=")[1]
    ?.trim();
  return { listTypes, parent, child };
}

async function main() {
  const { listTypes, parent, child } = parseArgs();
  const env = loadJiraEnv();

  if (listTypes) {
    const types = await getIssueLinkTypes(env);
    console.log(JSON.stringify(types, null, 2));
    return;
  }

  if (!parent || !child) {
    console.error(
      "Usage: node jira-link-history.mjs --parent=GAQNO-1113 --child=GAQNO-1123"
    );
    console.error("       node jira-link-history.mjs --list-types");
    process.exit(1);
  }

  const types = await getIssueLinkTypes(env);
  const linkType = types.find((t) =>
    HISTORY_LINK_NAMES.some(
      (n) =>
        n.toLowerCase() === t.name?.toLowerCase() ||
        n.toLowerCase() === t.inward?.toLowerCase() ||
        n.toLowerCase() === t.outward?.toLowerCase()
    )
  );
  const typeName = linkType?.name ?? "History";
  await createIssueLink(env, child, parent, typeName);
  console.log(`Linked ${child} → ${parent} (${typeName}).`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Create a Jira Bug. Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env)
 *
 * Usage:
 *   node scripts/jira-create-bug.mjs --summary "Title" [--description "Body"] [--project=GAQNO]
 */

import { loadJiraEnv, jira } from "./jira-rest-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { project: "GAQNO", summary: "", description: "" };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--project=")) out.project = a.slice("--project=".length);
    else if (a.startsWith("--summary="))
      out.summary = a.slice("--summary=".length);
    else if (a === "--summary" && args[i + 1] != null) out.summary = args[++i];
    else if (a === "--description" && args[i + 1] != null)
      out.description = args[++i];
    else if (a.startsWith("--description="))
      out.description = a.slice("--description=".length);
  }
  return out;
}

async function createBug(env, projectKey, summary, description) {
  const body = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: "Bug" },
      summary: summary || "Bug",
      ...(description && {
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: description }],
            },
          ],
        },
      }),
    },
  };
  return jira(env, "/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function main() {
  const { project, summary, description } = parseArgs();
  if (!summary) {
    console.error(
      'Usage: node scripts/jira-create-bug.mjs --summary "Title" [--description "Body"] [--project=GAQNO]'
    );
    process.exit(1);
  }
  const env = loadJiraEnv();
  const created = await createBug(env, project, summary, description);
  console.log(`${created.key}\t${summary}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

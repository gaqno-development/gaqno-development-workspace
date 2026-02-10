#!/usr/bin/env node
/**
 * Add a comment to a Jira issue via REST (avoids MCP latency).
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (.env.jira / .env)
 *
 * Usage:
 *   node scripts/jira-comment.mjs --issue=GAQNO-1113 --body="Done"
 *   node scripts/jira-comment.mjs --issue=GAQNO-1113 --body="Progress: frontcore done"
 */

import { loadJiraEnv, addComment } from "./jira-rest-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const issue = args
    .find((a) => a.startsWith("--issue="))
    ?.split("=")[1]
    ?.trim();
  const bodyArg = args.find((a) => a.startsWith("--body="));
  const body = bodyArg
    ? bodyArg
        .split("=")
        .slice(1)
        .join("=")
        .replace(/^["']|["']$/g, "")
    : args
        .filter((a) => !a.startsWith("--"))
        .join(" ")
        .trim();
  return { issue, body };
}

async function main() {
  const { issue, body } = parseArgs();
  if (!issue || !body) {
    console.error(
      'Usage: node jira-comment.mjs --issue=GAQNO-XXX --body="Comment text"'
    );
    process.exit(1);
  }
  const env = loadJiraEnv();
  await addComment(env, issue, body);
  console.log(`Comment added to ${issue}.`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

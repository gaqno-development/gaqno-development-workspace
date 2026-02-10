#!/usr/bin/env node
/**
 * Migrate Jira PROJ issues to GitHub Issues + GitHub Project.
 *
 * Prerequisites:
 *   1. Export Jira to scripts/jira-export.json (or pass --file path).
 *      Use Jira search API or MCP jira_search and save the JSON with { issues: [...] }.
 *   2. gh auth refresh -s project,read:project
 *   3. Run: node scripts/jira-to-github-projects.mjs [--file scripts/jira-export.json] [--repo gaqno-development/gaqno-development-workspace] [--dry-run]
 *
 * Options:
 *   --file    Path to Jira export JSON (default: scripts/jira-export.json)
 *   --repo    GitHub repo for new issues (default: gaqno-development/gaqno-development-workspace)
 *   --owner   GitHub org/user for project (default: gaqno-development)
 *   --project-title  Title for new GitHub Project (default: "PROJ Backlog")
 *   --dry-run Create no issues/project, only print what would be done
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function parseArgs() {
  const args = process.argv.slice(2);
  const file =
    args.find((a) => a.startsWith("--file="))?.split("=")[1] ??
    resolve(__dirname, "jira-export.json");
  const repo =
    args.find((a) => a.startsWith("--repo="))?.split("=")[1] ??
    "gaqno-development/gaqno-development-workspace";
  const owner =
    args.find((a) => a.startsWith("--owner="))?.split("=")[1] ??
    "gaqno-development";
  const projectTitle =
    args.find((a) => a.startsWith("--project-title="))?.split("=")[1] ??
    "PROJ Backlog";
  const dryRun = args.includes("--dry-run");
  return { file, repo, owner, projectTitle, dryRun };
}

function gh(args, opts = {}) {
  const argv = Array.isArray(args) ? args : [args];
  if (opts.dryRun) {
    console.log(
      "[dry-run]",
      "gh",
      argv.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ")
    );
    return null;
  }
  const r = spawnSync("gh", argv, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.error?.message || "gh command failed");
  }
  return r.stdout;
}

function escapeBody(s) {
  if (!s || typeof s !== "string") return "";
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
}

async function main() {
  const { file, repo, owner, projectTitle, dryRun } = parseArgs();

  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    console.error("Failed to read Jira export:", file, e.message);
    process.exit(1);
  }

  const issues = data.issues ?? [];
  if (issues.length === 0) {
    console.error("No issues in export. Expected { issues: [...] }");
    process.exit(1);
  }

  console.log(
    `Found ${issues.length} Jira issues. Repo: ${repo}, Owner: ${owner}`
  );
  if (dryRun) console.log("DRY RUN – no changes will be made.\n");

  let projectNumber = null;
  if (!dryRun) {
    const out = gh([
      "project",
      "create",
      "--owner",
      owner,
      "--title",
      projectTitle,
      "--format",
      "json",
    ]);
    const created = JSON.parse(out);
    projectNumber = created.number ?? created.id;
    console.log(
      "Created GitHub Project:",
      projectTitle,
      "(#" + projectNumber + ")"
    );
  } else {
    projectNumber = 1;
    console.log("[dry-run] Would create project:", projectTitle);
  }

  const { writeFileSync, unlinkSync } = await import("fs");
  const issueUrls = [];
  for (const issue of issues) {
    const key = issue.key ?? issue.id;
    const summary = issue.summary ?? "(no summary)";
    const description = issue.description ?? "";
    const status = issue.status?.name ?? "";
    const title = `[${key}] ${summary}`.slice(0, 256);
    const jiraLink = `https://gaqno.atlassian.net/browse/${key}`;
    const body = `${description}\n\n---\nMigrated from Jira: ${jiraLink}\nStatus: ${status}`;

    if (dryRun) {
      console.log(`Would create issue: ${title}`);
      continue;
    }

    const bodyFile = resolve(ROOT, ".tmp-gh-issue-body.txt");
    writeFileSync(bodyFile, body, "utf-8");
    try {
      const out = gh([
        "issue",
        "create",
        "--repo",
        repo,
        "--title",
        title,
        "--body-file",
        bodyFile,
      ]);
      const url = out.trim().split("\n").pop();
      if (url && url.startsWith("http")) issueUrls.push(url);
    } catch (err) {
      console.warn("Failed to create issue:", title, err.message);
    } finally {
      try {
        unlinkSync(bodyFile);
      } catch (_) {}
    }
  }

  if (!dryRun && projectNumber && issueUrls.length > 0) {
    for (const url of issueUrls) {
      gh([
        "project",
        "item-add",
        String(projectNumber),
        "--owner",
        owner,
        "--url",
        url,
      ]);
    }
    console.log(
      `Added ${issueUrls.length} issues to project #${projectNumber}.`
    );
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

---
name: gaqno-mcp-bridge
description: Bridge to interact with configured MCP (Model Context Protocol) servers in the gaqno-development-workspace. Use when you need to deploy applications via Coolify, manage databases via Postgres MCP, automate browsers with Playwright, interact with Atlassian (Jira/Confluence), use Shadcn components, or manage Cloudflare resources. This skill provides instructions, examples, and references for each MCP server defined in .cursor/mcp.json.
---

# Gaqno MCP Bridge

## Overview

This skill enables seamless interaction with the MCP servers configured in the workspace's `.cursor/mcp.json`. Each MCP server provides specialized capabilities for deployment, database management, browser automation, issue tracking, UI components, and CDN management.

## Quick Start

1. **Locate MCP configuration**: `.cursor/mcp.json` in the workspace root.
2. **Verify servers are running**: Check each MCP server's health (some require external services).
3. **Use the appropriate tool**: For each MCP, follow the specific instructions below.

## MCP Servers

### 1. Coolify MCP
- **Purpose**: Manage Coolify deployments, applications, databases, and services.
- **Configuration**: Token and URL already set in `.cursor/mcp.json`.
- **Example commands** (via MCP):
  - List applications: `coolify apps list`
  - Deploy a service: `coolify deploy --app my-app --image my-image:latest`
  - View logs: `coolify logs --app my-app`
- **Notes**: The Coolify instance is accessible at `http://72.61.221.19:8000`. Token is valid (tested).

### 2. Playwright MCP
- **Purpose**: Browser automation and web scraping.
- **Configuration**: Default settings.
- **Example commands**:
  - Take screenshot: `playwright screenshot --url https://example.com`
  - Scrape content: `playwright scrape --url https://example.com --selector "h1"`
- **Use when**: You need to automate web interactions or extract data from websites.

### 3. Shadcn MCP
- **Purpose**: Generate and manage Shadcn UI components.
- **Configuration**: Default settings.
- **Example commands**:
  - Add a component: `shadcn add button`
  - List available components: `shadcn list`
- **Use when**: Building React/Next.js UIs with the Shadcn design system.

### 4. Atlassian MCP (Jira & Confluence)
- **Purpose**: Create, update, and query Jira issues; manage Confluence pages.
- **Configuration**: URLs and API tokens set (see `.env.jira` for credentials).
- **Example commands**:
  - Create Jira issue: `jira create --project GAQNO --summary "Fix bug" --description "Details"`
  - Search issues: `jira search --query "project=GAQNO AND status=Open"`
  - Update Confluence page: `confluence update --page "Documentation" --content "Updated content"`
- **Notes**: Credentials are for `gaqno.atlassian.net` and `gaqno-development.atlassian.net`.

### 5. Postgres MCP (Multiple Databases)
- **Purpose**: Connect to and query PostgreSQL databases.
- **Configuration**: Multiple database connections defined (ai_platform, main, etc.).
- **Example commands**:
  - Query database: `postgres query --db ai_platform --sql "SELECT * FROM users"`
  - List tables: `postgres tables --db main`
- **Use when**: You need to inspect or modify database contents directly.

### 6. Cloudflare MCP
- **Purpose**: Manage Cloudflare DNS, Workers, and other resources.
- **Configuration**: API token required (check environment variables).
- **Example commands**:
  - List zones: `cloudflare zones list`
  - Purge cache: `cloudflare purge --zone example.com`
- **Use when**: Managing CDN, DNS, or serverless functions on Cloudflare.

## Workflow Examples

### Deploy a Service via Coolify
1. Ensure the service code is built and containerized.
2. Use Coolify MCP to create/update the application.
3. Monitor deployment logs.
4. Verify health endpoints.

### Query Production Database
1. Identify which Postgres connection to use (ai_platform, main, etc.).
2. Use Postgres MCP to run read‑only queries (avoid writes in production).
3. Export results if needed.

### Automate Browser Task
1. Use Playwright MCP to navigate to a URL.
2. Perform actions (click, type, screenshot).
3. Extract data and save to workspace.

## Troubleshooting

- **MCP server not responding**: Check if the server process is running; some MCPs require external services (e.g., Coolify API).
- **Authentication errors**: Verify tokens in `.cursor/mcp.json` and `.env.jira`.
- **Connection refused**: Ensure the target service (database, Coolify) is accessible from the OpenClaw environment.

## References

- **`.cursor/mcp.json`**: Full MCP configuration.
- **`.env.jira`**: Atlassian credentials.
- **Coolify API docs**: `http://72.61.221.19:8000/docs`
- **Postgres connection strings**: Check environment variables.

## Notes

- This skill does not include scripts; it relies on the MCP servers being properly configured and accessible.
- Always verify destructive operations (deployments, database writes) before executing.
- Prefer using MCPs over manual API calls for consistency and safety.

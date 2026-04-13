# Cursor MCP configuration

Copy `mcp.json.example` to `mcp.json` and replace placeholders with your real values. Do not commit `mcp.json`; it is gitignored.

For OpenCode, copy the MCPs to `opencode.json` (project-level) or `~/.config/opencode/opencode.json` (global).

Required: Postgres `DATABASE_URI`, Dokploy tokens, Atlassian JIRA/CONFLUENCE tokens (or omit servers you do not use).

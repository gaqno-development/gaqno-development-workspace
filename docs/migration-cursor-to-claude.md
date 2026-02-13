# Cursor to Claude Code Migration

## Date: 2026-02-12

This document records the migration from Cursor IDE to Claude Code CLI.

## MCP Servers (Previously in Cursor)

The following MCP servers were configured in `.cursor/mcp.json`. These can be migrated to Claude Code plugins if needed:

### 1. Playwright MCP
```json
{
  "command": "npx",
  "args": ["@playwright/mcp@latest"]
}
```

### 2. Coolify MCP
```json
{
  "command": "npx",
  "args": ["-y", "@masonator/coolify-mcp"],
  "env": {
    "COOLIFY_ACCESS_TOKEN": "<redacted>",
    "COOLIFY_BASE_URL": "https://coolify.gaqno.com.br"
  }
}
```

### 3. Atlassian MCP (Jira/Confluence)
```json
{
  "command": "uvx",
  "args": ["mcp-atlassian"],
  "env": {
    "JIRA_URL": "https://gaqno.atlassian.net",
    "JIRA_USERNAME": "gabriel.aquino@outlook.com",
    "JIRA_API_TOKEN": "<redacted>",
    "CONFLUENCE_URL": "https://gaqno-development.atlassian.net/wiki",
    "CONFLUENCE_USERNAME": "gabriel.aquino@outlook.com",
    "CONFLUENCE_API_TOKEN": "<redacted>"
  }
}
```

### 4. Postgres MCP
```json
{
  "command": "docker",
  "args": ["run", "-i", "--rm", "-e", "DATABASE_URI", "crystaldba/postgres-mcp", "--access-mode=unrestricted"],
  "env": {
    "DATABASE_URI": "<redacted>"
  }
}
```

## Cursor Rules Migrated

All Cursor rules have been migrated to Claude Code agents:

| Cursor Rule | Migrated To |
|-------------|-------------|
| `worktree-for-new-work.mdc` | All agents (Step 1 in workflow) |
| `commit-and-workflow-agent.mdc` | `jira-specialist` agent |
| `no-classes-in-ui.mdc` | `frontend-dev` agent (architecture rules) |
| `push-when-build-passes.mdc` | `jira-specialist` agent (Step 7) |
| `no-co-authored-by-cursor.mdc` | Not needed (Claude Code uses different co-author) |

## Cursor Agents Replaced

Cursor agents in `.cursor/agents/` have been consolidated into four specialized Claude Code agents:

| Old Cursor Agent | New Claude Agent |
|------------------|------------------|
| `frontend-architecture-enforcer.md` | `frontend-dev` |
| `frontend-documentation-engineer.md` | `frontend-dev` |
| `backend-documentation-engineer.md` | `backend-dev` |
| `commit-and-workflow-agent.md` | `jira-specialist` |
| Various PR/merge agents | Removed (workflow handled by `jira-specialist`) |

## Files Removed

- `.cursor/` directory (entire)
- `gaqno-ai-service/.cursor/` directory

## New Claude Code Structure

```
.claude/
├── agents/
│   ├── frontend-dev.md
│   ├── backend-dev.md
│   ├── devops.md
│   └── jira-specialist.md
└── agent-memory/
    ├── frontend-dev/
    ├── backend-dev/
    ├── devops/
    └── jira-specialist/
```

## Migration Notes

- **MCP Servers**: If you need Jira, Coolify, Playwright, or Postgres integration with Claude Code, these will need to be set up as Claude Code plugins/MCP servers separately
- **API Tokens**: All sensitive tokens were in Cursor config - they are NOT migrated to Claude Code for security
- **Worktree Workflow**: Now mandatory in all agents (prevents cross-session conflicts)
- **Plans**: Old Cursor plans in `.cursor/plans/` were removed (they were session-specific)

## To Set Up MCP Servers in Claude Code

Refer to Claude Code documentation for adding MCP servers:
```bash
# Example: Add Atlassian MCP
claude mcp add atlassian
```

---

**Migration completed**: 2026-02-12
**Performed by**: Claude Code (Sonnet 4.5)

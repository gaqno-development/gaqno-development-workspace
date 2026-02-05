# Confluence Documentation

**Purpose:** Authoritative architectural documentation derived from the gaqno-development-workspace codebase.

**Status:** ✅ Published to Confluence DDS space — 2025-02-05

---

## Document Index (DDS Space)

| #   | Document                         | Confluence (DDS)                                                                                            | Local                                                                          |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0   | DDS Overview                     | [View](https://gaqno-development.atlassian.net/wiki/spaces/DDS/overview)                                    | —                                                                              |
| 1   | System Architecture Overview     | [View](https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/589825/System+Architecture+Overview)   | [01-System-Architecture-Overview.md](./01-System-Architecture-Overview.md)     |
| 2   | Frontend Architecture Guide      | [View](https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/688129/Frontend+Architecture+Guide)    | [02-Frontend-Architecture-Guide.md](./02-Frontend-Architecture-Guide.md)       |
| 3   | Backend Architecture Guide       | [View](https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/720897/Backend+Architecture+Guide)     | [03-Backend-Architecture-Guide.md](./03-Backend-Architecture-Guide.md)         |
| 4   | Contracts & Types Guide          | [View](https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/819201/Contracts+Types+Guide)          | [04-Contracts-Types-Guide.md](./04-Contracts-Types-Guide.md)                   |
| 5   | Architectural Rules & Guardrails | [View](https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/884737/Architectural+Rules+Guardrails) | [05-Architectural-Rules-Guardrails.md](./05-Architectural-Rules-Guardrails.md) |
| 6   | Health Dashboard                 | [View](https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/917505/Health+Dashboard)               | [06-Health-Dashboard.md](./06-Health-Dashboard.md)                             |

---

## Publishing Instructions

### Via Atlassian MCP (when available)

1. Ensure mcp-atlassian is connected in Cursor
2. Use Confluence create/update tools with each document's content
3. Link pages in Confluence space

### Manual

1. Copy each Markdown file content to a new Confluence page
2. Confluence supports Markdown; tables and code blocks render correctly
3. Create a parent "Architecture" or "Technical Documentation" space
4. Link documents using Confluence's link syntax

---

## Confluence structure (DDS space)

```
DDS Overview — https://gaqno-development.atlassian.net/wiki/spaces/DDS/overview
├── System Architecture Overview
├── Frontend Architecture Guide
├── Backend Architecture Guide
├── Contracts & Types Guide
├── Architectural Rules & Guardrails
└── Health Dashboard
```

## Republish to DDS

```bash
CONFLUENCE_SPACE=DDS node scripts/publish-confluence-dds.mjs
```

Uses credentials from `.cursor/mcp.json` (atlassian env) or `CONFLUENCE_USERNAME` / `CONFLUENCE_API_TOKEN`.

**Labels:** architecture, technical, documentation, frontend, backend, contracts, guardrails

---

## Trello

The Atlassian MCP (mcp-atlassian-gaqno) provides **Jira** and **Confluence** only. Trello is a separate Atlassian product and is not supported by this MCP. To integrate Trello:

- Use a dedicated [Trello MCP](https://github.com/search?q=trello+mcp) if available
- Or link Trello boards manually in Confluence/Jira

---

## Traceability

- **Code → Docs:** All content derived from actual repository structure
- **Docs → Jira:** See [JIRA-PLANNING-ARTIFACTS.md](../jira/JIRA-PLANNING-ARTIFACTS.md) for epic/story references
- **Last audit:** 2025-02-05 (AGENTS-AUDIT-REPORT.md, SYSTEM-ARCHITECTURE-AUDIT.md)

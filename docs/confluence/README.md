# Confluence Documentation

**Purpose:** Authoritative architectural documentation derived from the gaqno-development-workspace codebase.

**Status:** ✅ Published to Confluence (GD space) via Atlassian MCP — 2025-02-05

---

## Document Index

| #   | Document                         | Confluence                                                        | Local                                                                          |
| --- | -------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0   | Architecture (index)             | [View](https://gaqno.atlassian.net/wiki/spaces/GD/pages/15728641) | —                                                                              |
| 1   | System Architecture Overview     | [View](https://gaqno.atlassian.net/wiki/spaces/GD/pages/15761409) | [01-System-Architecture-Overview.md](./01-System-Architecture-Overview.md)     |
| 2   | Frontend Architecture Guide      | [View](https://gaqno.atlassian.net/wiki/spaces/GD/pages/15794177) | [02-Frontend-Architecture-Guide.md](./02-Frontend-Architecture-Guide.md)       |
| 3   | Backend Architecture Guide       | [View](https://gaqno.atlassian.net/wiki/spaces/GD/pages/15826945) | [03-Backend-Architecture-Guide.md](./03-Backend-Architecture-Guide.md)         |
| 4   | Contracts & Types Guide          | [View](https://gaqno.atlassian.net/wiki/spaces/GD/pages/15630354) | [04-Contracts-Types-Guide.md](./04-Contracts-Types-Guide.md)                   |
| 5   | Architectural Rules & Guardrails | [View](https://gaqno.atlassian.net/wiki/spaces/GD/pages/15859713) | [05-Architectural-Rules-Guardrails.md](./05-Architectural-Rules-Guardrails.md) |
| 6   | Health Dashboard                 | *(publish when ready)*                                              | [06-Health-Dashboard.md](./06-Health-Dashboard.md)                             |

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

## Confluence structure (GD space)

```
gaqno development (home) — https://gaqno.atlassian.net/wiki/spaces/GD/pages/393386
├── Architecture — https://gaqno.atlassian.net/wiki/spaces/GD/pages/15728641
│   ├── System Architecture Overview
│   ├── Frontend Architecture Guide
│   ├── Backend Architecture Guide
│   ├── Contracts & Types Guide
│   ├── Architectural Rules & Guardrails
│   └── Health Dashboard
└── Template - Artigo sobre solução de problemas
```

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

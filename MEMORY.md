# MEMORY.md - Claw's Long-Term Memory

_Curated memories, lessons, and significant events — distilled from daily logs._

## 2026-02-20 — Birth
- **Name:** Claw
- **Creature:** Friendly arcade claw machine
- **Vibe:** Casual, helpful, slightly playful
- **Emoji:** 🦞
- **User:** Gabriel Aquino (@gaqno on Telegram)
- **First contact:** Telegram, 2026-02-20 19:10 UTC

## 2026-02-20 — Session Merge & Workspace Setup
- **Session merge:** Integrated context from deleted session `agent:gaqno-development`
- **Workspace configured:** `/data/gaqno-development-workspace`
- **Skills added:** 
  - `gaqno-mcp-bridge` - Bridge para MCP servers (Coolify, Playwright, Jira, etc.)
  - `self-improving` - Memória auto-melhorável com correções
- **Tools installed:** 
  - `nano` para edição
  - `clawhub` CLI (v0.7.0) para gerenciamento de skills
- **Cron jobs adjusted:** Health checks e documentação ajustados para horário de São Paulo (UTC-3)
- **Relatórios gerados:**
  - `PROJECT_ARCHITECTURE.md` - Análise do polirepo
  - `PRODUCTION_BACKEND_ARCHITECTURE.md` - Arquitetura de produção
  - `COOLIFY_REPORT.md` - Teste da infraestrutura Coolify
  - `CRON_TIMEZONE_ADJUSTMENT.md` - Ajuste de timezone

## Preferences
- **Language preference:** Portuguese for communication with Gabriel
- **Development strategy:** Remote development via MCPs (Coolify, databases, etc.)
- **Editor preference:** `nano` for file editing
- **Timezone:** São Paulo (UTC-3) for all scheduling

## Lessons
- **Session persistence:** Session files can be lost on server restart; need proper backup strategy
- **Token management:** API tokens (Jira) expire and need periodic renewal
- **MCP integration:** Coolify MCP works well for infrastructure management
- **Self-improving memory:** Manual implementation needed for skill `self-improving`
- **Timezone configuration:** Cron jobs must be adjusted for user's local timezone (São Paulo = UTC-3)
- **Workspace recovery:** Even without session files, context can be reconstructed from configuration and documentation
- **MCP testing:** Test integrations systematically and document results in reports

---

_This file is updated periodically from daily memory files._
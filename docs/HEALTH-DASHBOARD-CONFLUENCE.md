# Health Dashboard — Confluence Summary

**Full docs:** [Confluence](./confluence/06-Health-Dashboard.md) | [Jira](./jira/HEALTH-DASHBOARD-IMPLEMENTATION-CARDS.md)

## Overview

The Health Dashboard is a **read-only real-time** view of platform health: CI/CD, self-healing activity, agent performance, and release timelines.

## Architecture

| Layer | Technology |
|-------|------------|
| Backend | NestJS (gaqno-admin-service) |
| Real-time | WebSocket (Socket.IO) |
| Frontend | Vite + React MFE (gaqno-admin-ui) |
| Shared types | @gaqno-backcore, @gaqno-frontcore |

## Backend APIs

| Endpoint | Description |
|----------|--------------|
| `GET /health/summary` | Health score, event counts, agents active |
| `GET /health/events` | Recent events (query: `limit`) |
| `GET /health/failures/by-type` | Failures aggregated by type (24h) |
| `GET /health/agents` | Agent stats (runs, success rate, confidence) |
| `GET /health/releases` | Release timeline |

## Health Score Formula

```
score = 100 - (failures_24h × 15) + min(self_heals_24h × 5, 20)
score = clamp(score, 0, 100)
```

## WebSocket

- **Path:** `/health-ws`
- **Event:** `health:new` — broadcast when a new health event is added
- **Client:** Socket.IO with auto-reconnect

## Event Types

| Type | Source | Description |
|------|--------|--------------|
| PIPELINE_FAILED | CI | CI pipeline failure |
| SELF_HEAL_TRIGGERED | AGENT | Self-healing run |
| PR_CREATED | CI | PR created |
| PR_MERGED | CI | PR merged |
| ESCALATED | AGENT | Escalated to human |
| RELEASE_RESUMED | RELEASE | Release resumed |

## Access

- **URL:** `/organization/health`
- **Permissions:** Admin area (admin.access)

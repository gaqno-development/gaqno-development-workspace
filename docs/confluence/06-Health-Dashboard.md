# Health Dashboard

**Document Type:** Confluence Page  
**Last Updated:** 2025-02-05  
**Parent:** Architecture (GD space)

---

## 1. Overview

The **Health Dashboard** is a read-only real-time view of platform health: CI/CD status, self-healing activity, agent performance, and release timelines. It is accessible at `/organization/health` within the admin area.

| Attribute | Value |
|-----------|-------|
| **URL** | `/organization/health` |
| **Permissions** | `admin.access` |
| **Backend** | gaqno-admin-service |
| **Frontend** | gaqno-admin-ui (MFE) |

---

## 2. Architecture

| Layer | Technology |
|-------|------------|
| Backend | NestJS (gaqno-admin-service) |
| Real-time | WebSocket (Socket.IO) |
| Frontend | Vite + React MFE (gaqno-admin-ui) |
| Shared types | @gaqno-backcore, @gaqno-frontcore |

---

## 3. Backend APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health/summary` | GET | Health score, event counts, agents active |
| `/health/events` | GET | Recent events (query: `limit`, default 50) |
| `/health/failures/by-type` | GET | Failures aggregated by type (24h) |
| `/health/agents` | GET | Agent stats (runs, success rate, confidence) |
| `/health/releases` | GET | Release timeline |

---

## 4. Health Score Formula

The health score is computed server-side and exposed via `GET /health/summary`:

```
score = 100 - (failures_24h × 15) + min(self_heals_24h × 5, 20)
score = clamp(score, 0, 100)
```

| Factor | Impact |
|--------|--------|
| Failures (24h) | −15 per failure |
| Self-heals (24h) | +5 per heal, max +20 bonus |

---

## 5. WebSocket (Real-time)

| Attribute | Value |
|-----------|-------|
| **Path** | `/health-ws` |
| **Protocol** | Socket.IO |
| **Event** | `health:new` — broadcast when a new health event is added |
| **Client** | Socket.IO with auto-reconnect |

---

## 6. Event Types

| Type | Source | Description |
|------|--------|-------------|
| PIPELINE_FAILED | CI | CI pipeline failure |
| SELF_HEAL_TRIGGERED | AGENT | Self-healing run |
| PR_CREATED | CI | PR created |
| PR_MERGED | CI | PR merged |
| ESCALATED | AGENT | Escalated to human |
| RELEASE_RESUMED | RELEASE | Release resumed |

**Severity:** `low` | `medium` | `high`  
**Source:** `CI` | `AGENT` | `RELEASE` | `PROD`

---

## 7. Frontend Components

| Component | Purpose |
|-----------|---------|
| HealthScoreCard | Health score and progress bar |
| FailureHeatmap | Failures by type (24h) |
| SelfHealingStats | Self-healing triggers and rate |
| AgentPerformanceTable | Agent runs, success rate, confidence |
| ReleaseTimeline | Recent releases and status |

---

## 8. Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SERVICE_ADMIN_URL` | `http://localhost:4010` | Admin service base URL |
| `PORT` (admin-service) | `4010` | Backend port |

---

## 9. Related Documentation

- [System Architecture Overview](./01-System-Architecture-Overview.md)
- [Backend Architecture Guide](./03-Backend-Architecture-Guide.md)
- [Frontend Architecture Guide](./02-Frontend-Architecture-Guide.md)
- [Jira: Health Dashboard Epic](../jira/HEALTH-DASHBOARD-IMPLEMENTATION-CARDS.md)

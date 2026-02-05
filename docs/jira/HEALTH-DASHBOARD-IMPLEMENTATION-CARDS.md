# Jira Cards — Health Dashboard Implementation

**Projeto:** KAN (gaqno-environment)  
**Status:** Ready for creation via Jira API / Atlassian MCP  
**Confluence:** [06-Health-Dashboard](../confluence/06-Health-Dashboard.md)

---

## Epic

### Health Dashboard — Real-time CI/CD, Self-healing, Agents & Releases

| Campo | Valor |
|-------|-------|
| **Tipo** | Epic |
| **Summary** | Health Dashboard — Real-time CI/CD, Self-healing, Agents & Releases |
| **Description** | Implementação de um dashboard read-only em tempo real que visualiza: saúde de CI/CD, atividade de self-healing, performance de agentes e timelines de release. Backend: NestJS (gaqno-admin-service) com WebSocket. Frontend: Vite MFE (gaqno-admin-ui). Confluence: [06-Health-Dashboard](https://gaqno.atlassian.net/wiki/spaces/GD/pages/) |

---

## Stories (vinculadas ao Epic)

### Story 1: Backend Health Module

| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Summary** | Backend Health Module — NestJS controller, service, gateway |
| **Description** | Módulo health em gaqno-admin-service: controller REST (summary, events, failures, agents, releases), service com lógica de negócio e score, gateway WebSocket (Socket.IO) para broadcast de eventos. Persistência in-memory (placeholder). |
| **Acceptance Criteria** | - GET /health/summary, /events, /failures/by-type, /agents, /releases; WebSocket em /health-ws; Health score calculado no backend; Testes unitários passando |

---

### Story 2: Shared Types & Contracts

| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Summary** | Shared Types — HealthEvent, HealthSummary, FailureByType, AgentStats, ReleaseInfo |
| **Description** | Tipos compartilhados em @gaqno-backcore (types/shared/health.ts) e @gaqno-frontcore (types/health.ts). Contratos alinhados front ↔ back. |
| **Acceptance Criteria** | - HealthEvent, HealthSummary, FailureByType, AgentStats, ReleaseInfo definidos; DTOs validados com class-validator; Sem any |

---

### Story 3: Frontend Health Dashboard Page

| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Summary** | Frontend Health Dashboard Page — Components & Hooks |
| **Description** | Página HealthDashboardPage em gaqno-admin-ui com componentes: HealthScoreCard, FailureHeatmap, SelfHealingStats, AgentPerformanceTable, ReleaseTimeline. Hooks: useHealthSummary, useHealthEvents, useHealthFailures, useHealthAgents, useHealthReleases. |
| **Acceptance Criteria** | - Página renderiza em /organization/health; Componentes usam @gaqno-frontcore; Sem lógica de negócio em componentes; Hooks testáveis |

---

### Story 4: Real-time WebSocket Hook

| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Summary** | useHealthSocket — Auto-connect, reconnect, typed events |
| **Description** | Hook useHealthSocket em admin-ui: conecta ao WebSocket /health-ws, auto-reconnect, disconnect graceful, eventos tipados (health:new). Invalida queries ao receber novo evento. |
| **Acceptance Criteria** | - Hook conecta ao admin service; Auto-reconnect em caso de queda; Eventos tipados; Invalidação de cache ao receber health:new |

---

### Story 5: Admin Client & Routing

| Campo | Valor |
|-------|-------|
| **Tipo** | Story |
| **Summary** | Admin Client & Routing — coreAxiosClient.admin, route /organization/health |
| **Description** | Adicionar coreAxiosClient.admin em @gaqno-frontcore (VITE_SERVICE_ADMIN_URL). Rota /organization/health em admin-ui App e AdminLayout. Permissão admin.access. |
| **Acceptance Criteria** | - coreAxiosClient.admin configurado; Rota /organization/health; Tab Health no AdminLayout; ROUTE_PERMISSIONS atualizado |

---

## Tasks (vinculadas às Stories)

### Backend

| Task | Story | Description |
|------|-------|-------------|
| HEALTH-1.1 | Story 1 | Criar health.controller.ts com 5 endpoints GET |
| HEALTH-1.2 | Story 1 | Criar health.service.ts com computeHealthScore, getEvents, getFailuresByType, getAgents, getReleases |
| HEALTH-1.3 | Story 1 | Criar health.gateway.ts (WebSocket Socket.IO) |
| HEALTH-1.4 | Story 1 | Criar CreateHealthEventDto com class-validator |
| HEALTH-1.5 | Story 1 | health.service.spec.ts — testes unitários |

### Shared

| Task | Story | Description |
|------|-------|-------------|
| HEALTH-2.1 | Story 2 | @gaqno-backcore types/shared/health.ts |
| HEALTH-2.2 | Story 2 | @gaqno-frontcore types/health.ts |

### Frontend

| Task | Story | Description |
|------|-------|-------------|
| HEALTH-3.1 | Story 3 | HealthScoreCard, FailureHeatmap, SelfHealingStats |
| HEALTH-3.2 | Story 3 | AgentPerformanceTable, ReleaseTimeline |
| HEALTH-3.3 | Story 3 | HealthDashboardPage.tsx |
| HEALTH-4.1 | Story 4 | useHealthSocket.ts com socket.io-client |
| HEALTH-5.1 | Story 5 | coreAxiosClient.admin em api-client.ts |
| HEALTH-5.2 | Story 5 | Rota e tab em admin-ui |

---

## Jira API / MCP Instructions

Para criar via Atlassian MCP ou Jira API:

1. **Epic:** Project KAN, type Epic, summary e description acima
2. **Stories:** Link parent = Epic key
3. **Tasks:** Link parent = Story key
4. **Confluence:** Criar página a partir de [06-Health-Dashboard.md](../confluence/06-Health-Dashboard.md) e linkar no Epic

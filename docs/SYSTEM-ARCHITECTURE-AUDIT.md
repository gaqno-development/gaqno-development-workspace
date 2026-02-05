# System Architecture Audit

**Auditor:** @system-architecture-auditor  
**Data:** 2025-02-05  
**Escopo:** Codebase completo — frontend, backend, shared packages

---

## 🚨 Critical Architectural Risks

### 1. Shell sobrecarregado (SRP violado)

O **gaqno-shell-ui** acumula três responsabilidades distintas:

- **Host do Module Federation** — carregar MFEs, layout, auth, menu
- **Admin platform** — 19 páginas em `pages/admin/` (Domains, Tenants, Branches, Users, Roles, Menu, Settings, Usage, Costing)
- **Dashboard** — ManagerDashboard, UserDashboard, widgets

**Impacto:** Bundle maior, deploy acoplado, evolução de admin travada no shell. Em 3–5 anos, o shell tende a virar monolito.

**Mitigação imediata:** Migrar páginas admin para gaqno-admin-ui ou criar MFE dedicado para platform admin.

---

### 2. Duplicação de responsabilidade admin

Existe **gaqno-admin-ui** (organização/tenant) e **páginas admin no shell** (plataforma/root). O menu filtra por scope, mas a implementação está fragmentada:

- `/organization/*` → gaqno-admin-ui (tenant)
- `/sass/*` e `/admin/*` → shell local (platform)

**Impacto:** Dois lugares para "admin", convenções diferentes, risco de duplicar lógica.

---

### 3. ~~Acoplamento frontend ↔ backend no shared package~~ (Resolvido)

~~O **@gaqno-frontcore** `api-client.ts` contém lógica específica de serviço.~~

**Resolução (2025-02-05):** Adicionado `on401Reject` callback em `AxiosClientConfig`. MFEs registram via `registerServiceConfig(serviceName, { on401Reject })`. gaqno-rpg-ui registra em main.tsx. Nenhuma lógica RPG hardcoded no frontcore.

---

### 4. Serviços mínimos sem evolução clara

**gaqno-admin-service** e **gaqno-saas-service** têm apenas `ConfigModule` e `main.ts`. A lógica de admin vive no **gaqno-sso-service** (Users, Tenants, Branches, etc.).

**Impacto:** Nomes de serviços não refletem responsabilidades. Admin e Saas podem virar "lixo arquitetural" ou forçar refactors grandes depois.

---

## ⚠️ Architectural Smells

### 1. God hook: `useMasterDashboard` (~576 linhas)

`gaqno-rpg-ui/src/hooks/useMasterDashboard.ts` concentra:

- Fetch de session, characters, actions, history, memory
- WebSocket
- Battle state
- Dice roll
- Action submission
- Streaming

**Recomendação:** Quebrar em hooks menores (ex.: `useMasterSessionData`, `useMasterBattle`, `useMasterDiceRoll`).

---

### 2. API clients duplicados

- **gaqno-finance-ui:** `lib/api-client.ts` próprio
- **@gaqno-frontcore:** `utils/api/api-client.ts` genérico
- **gaqno-ai-ui:** `utils/api/audioApi.ts`, etc.

Padrão inconsistente: alguns MFEs usam frontcore, outros criam clientes locais.

---

### 3. Tipos duplicados entre backcore e frontcore

`@gaqno-backcore/types/shared` e `@gaqno-frontcore/types/shared` têm estruturas paralelas (auth, user, org, sale, etc.). Risco de drift se um for alterado e o outro não.

---

### 4. DTOs sem contrato shared

DTOs em finance, pdv, rpg não implementam interfaces de `@gaqno-backcore`. `CreateTransactionInput` foi adicionado, mas o DTO do finance-service não o implementa (pacote npm ≠ workspace).

---

### 5. Tratamento de erro inconsistente

- Alguns hooks retornam `{ error }`, outros fazem `throw`
- API client: 401 com refresh em alguns casos, reject em outros (RPG)
- Sem padrão único de error boundary por MFE

---

## 🧱 Broken Principles

| Princípio               | Violação                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **DRY**                 | Tipos duplicados (backcore/frontcore); API clients por MFE                         |
| **SRP**                 | Shell = host + admin + dashboard; useMasterDashboard = múltiplas responsabilidades |
| **Open/Closed**         | api-client com `if (isRpgEndpoint)` — fechado para extensão                        |
| **Contract-first**      | DTOs não derivam de shared; frontend não usa contratos como fonte da verdade       |
| **Explicit boundaries** | Admin dividido entre shell e admin-ui; frontcore conhece detalhes do RPG           |

---

## 🛠 Strategic Refactors

### Ordem sugerida

| #   | Refactor                                                                  | Impacto | Esforço |
| --- | ------------------------------------------------------------------------- | ------- | ------- |
| 1   | Migrar páginas admin do shell para gaqno-admin-ui (ou MFE platform-admin) | Alto    | Alto    |
| 2   | Extrair lógica RPG do api-client para plugin/callback configurável        | Médio   | Médio   |
| 3   | Unificar types: backcore como fonte, frontcore re-exporta                 | Alto    | Médio   |
| 4   | Fazer DTOs implementarem interfaces shared (resolver pacote workspace)    | Médio   | Baixo   |
| 5   | Quebrar useMasterDashboard em hooks menores                               | Médio   | Médio   |
| 6   | Padronizar API client: todos os MFEs usam frontcore ou abstração comum    | Médio   | Alto    |
| 7   | Padronizar cobertura de testes (admin, saas, finance, pdv)                | Médio   | Alto    |

### Quick wins (baixo esforço)

- Documentar convenção snake_case (API) vs camelCase (frontend) e camada de transformação
- Adicionar `hooks/index.ts` em saas-ui e admin-ui
- Testes para `useCostingData` e `useUsersPage`

---

## Status pós-correções (2025-02-05)

As correções recentes (saas-ui, pdv-ui, admin-ui, rpg-ui, transaction types) **reduziram** violações de frontend (lógica em componentes, `any`). Os riscos estruturais acima **permanecem** e devem ser tratados em roadmap.

---

## Aplicação do audit (@front-dev, @back-dev)

Documentação criada para operacionalizar este audit:

| Documento                                                    | Descrição                                        |
| ------------------------------------------------------------ | ------------------------------------------------ |
| [REFACTORING-ROADMAP.md](./REFACTORING-ROADMAP.md)           | Passos executáveis por prioridade                |
| [API-CONTRACTS-CONVENTION.md](./API-CONTRACTS-CONVENTION.md) | snake_case vs camelCase, onde transformar        |
| [BACKEND.md](./BACKEND.md)                                   | Seção Architecture Audit, convenção de contratos |
| [FRONTEND.md](./FRONTEND.md)                                 | Seção Architecture Audit, padrões obrigatórios   |

**Quick wins aplicados:** hooks/index.ts em saas-ui e admin-ui; CostingPage usa barrel.

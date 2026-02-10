# Refactoring Roadmap

**Baseado em:** [system-architecture-audit.md](./system-architecture-audit.md)  
**Responsáveis:** @front-dev, @back-dev  
**Data:** 2025-02-05

Este documento operacionaliza o audit de arquitetura em passos executáveis.

---

## Prioridade 1 — Riscos Críticos

### 1.1 Migrar páginas admin do shell para MFE

**Problema:** Shell acumula host + 19 páginas admin + dashboard.

**Opções:**

| Opção | Descrição                                                                                  | Esforço |
| ----- | ------------------------------------------------------------------------------------------ | ------- |
| A     | Expandir gaqno-admin-ui para incluir rotas platform (/sass/_, /admin/_)                    | Alto    |
| B     | Criar gaqno-platform-admin-ui (novo MFE) para platform                                     | Alto    |
| C     | Manter shell como host; mover páginas para gaqno-admin-ui com rotas condicionais por scope | Médio   |

**Passos (Opção C):**

1. Criar rotas em gaqno-admin-ui para: domains, tenants, branches, users (platform), roles, menu, settings, usage, costing
2. Reutilizar componentes/páginas do shell (mover ou importar)
3. Atualizar shell: remover rotas /admin/_ e /sass/_; carregar admin MFE para ambas
4. Ajustar menu: /sass/_ e /admin/_ apontam para admin MFE
5. Validar permissões e scope no admin MFE

**Critério de conclusão:** Shell não possui páginas em `pages/admin/`; apenas host + dashboard.

---

### 1.2 Extrair lógica RPG do api-client

**Problema:** `@gaqno-frontcore/utils/api/api-client.ts` tem `if (isRpgEndpoint && isRpgRoute)`.

**Passos:**

1. Adicionar `on401Reject?: (requestUrl: string, currentPath: string) => boolean` em `AxiosClientConfig`
2. Se `true`, não tentar refresh; rejeitar imediatamente
3. gaqno-rpg-ui passa callback ao criar client: `(url, path) => url.includes('/v1/rpg/') && path.startsWith('/rpg')`
4. Remover lógica hardcoded do api-client

**Critério de conclusão:** Nenhum `isRpgEndpoint` ou `isRpgRoute` no frontcore.

**Status:** ✅ Concluído. Adicionado `on401Reject` em `AxiosClientConfig`; `registerServiceConfig` permite que MFEs registrem callback; gaqno-rpg-ui chama `registerServiceConfig('rpg', { on401Reject: (_, path) => path.startsWith('/rpg') })` em main.tsx.

---

### 1.3 Definir evolução de admin-service e saas-service

**Problema:** Serviços quase vazios; lógica em sso-service.

**Passos:**

1. **Documentar** decisão: admin-service e saas-service são stubs ou serão evoluídos?
2. Se stubs: renomear ou marcar como "placeholder" no README
3. Se evolução: definir módulos a migrar do sso (ex.: TenantsModule → saas-service)

**Critério de conclusão:** Decisão documentada em [../guides/backend.md](../guides/backend.md).

**Status:** ✅ Concluído. Decisão: stubs; lógica permanece no sso-service.

---

## Prioridade 2 — Smells e Princípios

### 2.1 Unificar types (backcore como fonte)

**Problema:** backcore e frontcore têm types/shared paralelos.

**Passos:**

1. backcore permanece fonte da verdade para tipos de domínio
2. frontcore re-exporta: `export * from '@gaqno-development/backcore'` (ou pacote unificado)
3. Remover duplicatas em frontcore/types/shared
4. Atualizar imports nos MFEs

**Critério de conclusão:** Uma única fonte de tipos shared.

---

### 2.2 DTOs implementam interfaces shared

**Problema:** DTOs não implementam `@gaqno-backcore/types`.

**Pré-requisito:** Resolver pacote — workspace usar `@gaqno-backcore` local ou publicar backcore.

**Passos:**

1. Adicionar override no package.json raiz: `"@gaqno-development/backcore": "workspace:*"` (se suportado)
2. Ou: publicar backcore com transaction types; atualizar finance-service
3. `CreateTransactionDto implements CreateTransactionInput`
4. Repetir para Category, CreditCard, etc.

**Critério de conclusão:** DTOs de finance implementam interfaces shared.

---

### 2.3 Quebrar useMasterDashboard

**Problema:** Hook com ~576 linhas.

**Passos:**

1. Extrair `useMasterSessionData` — fetch session, characters, actions, history, memory
2. Extrair `useMasterBattle` — battle state, damage, turn
3. Extrair `useMasterDiceRoll` — request, handlers
4. `useMasterDashboard` orquestra os sub-hooks

**Critério de conclusão:** Nenhum hook > 200 linhas.

---

### 2.4 Padronizar API client

**Problema:** finance-ui tem lib/api-client próprio; outros usam frontcore.

**Passos:**

1. Documentar padrão: MFEs usam `createAxiosClient` do frontcore com baseURL do serviço
2. Migrar finance-ui para frontcore (ou criar hook useFinanceApi que usa frontcore)
3. Remover gaqno-finance-ui/lib/api-client.ts

**Critério de conclusão:** Todos os MFEs usam frontcore para HTTP.

---

### 2.5 Padronizar tratamento de erro

**Passos:**

1. Documentar convenção: hooks de query retornam `{ data, error, isLoading }`; mutations `throw` ou retornam `{ error }`
2. Definir error boundary por MFE (ou no shell)
3. Atualizar hooks críticos para seguir convenção

**Critério de conclusão:** Convenção em [../guides/frontend.md](../guides/frontend.md); principais hooks conformes.

---

## Prioridade 3 — Testes

### 3.1 Cobertura mínima por MFE/service

| MFE/Service         | Atual   | Meta                     |
| ------------------- | ------- | ------------------------ |
| gaqno-admin-ui      | Baixa   | Hooks com spec           |
| gaqno-saas-ui       | Baixa   | useCostingData.spec      |
| gaqno-finance-ui    | Parcial | Hooks finance            |
| gaqno-pdv-ui        | Parcial | Hooks pdv                |
| gaqno-admin-service | Nenhum  | Módulos quando existirem |
| gaqno-saas-service  | Nenhum  | Módulos quando existirem |

**Passos:** Criar specs para hooks críticos; manter TDD para novas features.

---

## Quick Wins (Concluídos ou em andamento)

| Item                                           | Status                                                |
| ---------------------------------------------- | ----------------------------------------------------- |
| Documentar convenção snake_case vs camelCase   | ✅ [contracts-and-types.md](./contracts-and-types.md) |
| Adicionar hooks/index.ts em saas-ui e admin-ui | ✅                                                    |
| CostingPage e UsersPage usam barrel (hooks/)   | ✅                                                    |
| Testes para useCostingData e useUsersPage      | Pendente (requer vitest nos MFEs)                     |

---

## Referências

- [system-architecture-audit.md](./system-architecture-audit.md)
- [contracts-and-types.md](./contracts-and-types.md)
- [../guides/backend.md](../guides/backend.md)
- [../guides/frontend.md](../guides/frontend.md)

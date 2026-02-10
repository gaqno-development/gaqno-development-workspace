# Frontend Architecture Guide

Documentação da arquitetura frontend: MFEs, Shell, pacote compartilhado e convenções. Baseado na estrutura real do repositório e no agente `frontend-documentation-engineer`.

---

## 1. Visão geral do monorepo frontend

| Camada  | Aplicação                                                                                                                                | Responsabilidade                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Host    | **gaqno-shell-ui**                                                                                                                       | Roteamento, auth, layout, carregamento dos MFEs via Module Federation                          |
| Remotes | gaqno-ai-ui, gaqno-crm-ui, gaqno-erp-ui, gaqno-finance-ui, gaqno-pdv-ui, gaqno-rpg-ui, gaqno-sso-ui, gaqno-saas-ui, gaqno-omnichannel-ui | Aplicações independentes expostas como `./App`                                                 |
| Shared  | **@gaqno-development/frontcore**                                                                                                         | Componentes, hooks, contextos, providers, tipos, API client, layout (DashboardLayout, sidebar) |

O Shell roda na porta 3000. Cada MFE tem porta própria (ex.: ai 3002, crm 3003, rpg 3007). Em produção, o Shell serve em `/` e os MFEs servem apenas assets em `/<mfe>/assets/`.

---

## 2. Micro Frontends (MFEs)

### 2.1 Lista de MFEs

| MFE                  | Remote name | Porta (dev) | Rota no Shell                 |
| -------------------- | ----------- | ----------- | ----------------------------- |
| gaqno-ai-ui          | ai          | 3002        | /ai, /ai/\*                   |
| gaqno-crm-ui         | crm         | 3003        | /crm, /crm/\*                 |
| gaqno-erp-ui         | erp         | 3004        | /erp, /erp/\*                 |
| gaqno-finance-ui     | finance     | 3005        | /finance, /finance/\*         |
| gaqno-pdv-ui         | pdv         | 3006        | /pdv, /pdv/\*                 |
| gaqno-rpg-ui         | rpg         | 3007        | /rpg, /rpg/\*                 |
| gaqno-sso-ui         | sso         | 3001        | /sso, /sso/\*                 |
| gaqno-saas-ui        | saas        | 3008        | (fallback CostingPage)        |
| gaqno-omnichannel-ui | omnichannel | 3010        | /omnichannel, /omnichannel/\* |

### 2.2 Estrutura padrão de um MFE

Cada MFE usa **Vite** + **@originjs/vite-plugin-federation** e expõe um único entry:

- **exposes:** `{ './App': './src/App.tsx' }`
- **name:** igual ao remote name (ai, crm, erp, etc.)

Estrutura de pastas típica (ex.: gaqno-rpg-ui, gaqno-ai-ui):

| Pasta             | Uso                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`     | Entry: providers (QueryProvider, AuthProvider, TenantProvider do frontcore) + roteamento interno ou página raiz |
| `src/pages/`      | Views/páginas do domínio                                                                                        |
| `src/components/` | Componentes UI do MFE                                                                                           |
| `src/hooks/`      | Lógica por domínio (queries, mutations, estado); pode ter subpastas (ai/, books/, mutations/, queries/)         |
| `src/layouts/`    | Layouts específicos do MFE (ex.: AIPageLayout)                                                                  |
| `src/types/`      | Tipos do domínio                                                                                                |
| `src/lib/`        | Config, env, transformers                                                                                       |
| `src/utils/`      | Helpers e API do MFE                                                                                            |

### 2.3 Convenções em MFEs

- **Hooks:** prefixo `use`, organizados por domínio (ex.: `hooks/ai/`, `hooks/books/`, `hooks/mutations/`, `hooks/queries/`). Lógica fica em hooks; componentes focam em UI.
- **Pages:** um componente de página por rota/view; nomes em PascalCase (ex.: `BookChaptersPage`, `RpgPage`).
- **Components:** PascalCase; componentes reutilizáveis no MFE ou extração para frontcore quando compartilhados.
- **Shared:** react, react-dom, react-router-dom, @tanstack/react-query, zustand (e eventualmente socket.io-client) como singletons alinhados ao Shell.

### 2.4 Testes em MFEs

- **Co-location:** testes ao lado do código (ex.: `useBattleState.test.ts`, `useCampaignWizard.error-handling.spec.ts`, `*.spec.ts`).
- **E2E:** pastas `e2e/` ou `tests/` (ex.: gaqno-rpg-ui/e2e, gaqno-shell-ui/tests com Playwright).
- Shell: testes em `tests/*.spec.ts` (login, menu, módulos AI, certificação UI).

---

## 3. Shell (gaqno-shell-ui)

### 3.1 Responsabilidades

- **Roteamento:** React Router; rotas `/` (home), `/login`, `/register`, `/dashboard`, `/admin/*`, e por MFE (`/ai`, `/crm`, `/erp`, etc.).
- **Auth e guards:** uso de `useAuth` (frontcore); redirecionamento para `/login` em rotas autenticadas; definição de rotas públicas vs autenticadas no `ShellLayoutWrapper`.
- **Layout:** `ShellLayoutWrapper` aplica `DashboardLayout` (frontcore) com menu filtrado por permissões quando o usuário está autenticado em rotas que exigem layout.
- **Carregamento de MFEs:** lazy `import("ai/App")`, `import("rpg/App")`, etc., com `Suspense` e fallback "Carregando...". Cada rota de MFE tem `errorElement: <RouteErrorElement />`.
- **Providers globais:** no `App.tsx` raiz: ThemeProvider, QueryProvider, AuthProvider (frontcore), ToastContainer; dentro do layout: AppProvider, WhiteLabelProvider, TenantProvider.

### 3.2 Module Federation (Shell)

Configurado em `vite.config.ts` com `@originjs/vite-plugin-federation`:

- **name:** `"shell"`
- **remotes:** URLs de cada MFE: `{ MFE_*_URL }/assets/remoteEntry.js` (ex.: `MFE_AI_URL`, `MFE_RPG_URL`). Defaults em dev: localhost:3XXX.
- **shared:** react, react-dom (eager, singleton), react-router-dom, @tanstack/react-query, zustand, use-sync-external-store (singleton).

Variáveis de ambiente para remotes: `MFE_AI_URL`, `MFE_CRM_URL`, `MFE_ERP_URL`, `MFE_FINANCE_URL`, `MFE_PDV_URL`, `MFE_RPG_URL`, `MFE_SSO_URL`, `MFE_SAAS_URL`, `MFE_OMNICHANNEL_URL`. Produção deve apontar para o portal (ex.: `https://portal.gaqno.com.br/ai` para ai).

### 3.3 Menu e navegação

- Itens de menu definidos em `src/config/menu-config.ts` (MENU_ITEMS) com ícones, href e `requiredPermissions`.
- Menu exibido é filtrado por permissões via `useFilteredMenu()` (frontcore); sidebar e layout vêm de `@gaqno-development/frontcore` (DashboardLayout).

### 3.4 Estrutura do Shell

| Pasta             | Uso                                                                                |
| ----------------- | ---------------------------------------------------------------------------------- |
| `src/App.tsx`     | Router + lazy MFEs + providers                                                     |
| `src/pages/`      | Páginas próprias do Shell (Home, Login, Register, Dashboard, Admin, etc.)          |
| `src/components/` | shell-layout-wrapper, route-error-element, microfrontend-error-boundary, dashboard |
| `src/config/`     | menu-config, widget-registry                                                       |
| `src/hooks/`      | useAuthWithStorage, useLogin, useDashboard, useProfile, etc.                       |
| `tests/`          | E2E Playwright (login, menu, módulos AI, certificação UI)                          |

---

## 4. Pacote compartilhado (@gaqno-development/frontcore)

### 4.1 Escopo

O frontcore centraliza tudo que é comum entre Shell e MFEs para evitar duplicação e garantir consistência (UI, auth, tenant, API, permissões).

### 4.2 Exports principais (package.json)

| Export                   | Conteúdo                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `.`                      | hooks, lib, types, utils, store, contexts, styles, QueryProvider, ThemeProvider, components/admin        |
| `./hooks`                | useAuth, useApiQuery, useApiMutation, useFilteredMenu, usePermissions, useTenantQuery, etc.              |
| `./hooks/admin/*`        | useTenants, useUsers, useDomains, useBranding, useFeatures, useTenantCosts, useTenantUsage, useAnalytics |
| `./hooks/ai`             | useAIModelPreferences, useModelsRegistry                                                                 |
| `./hooks/auth`           | useSsoAuth                                                                                               |
| `./hooks/health`         | useHealthSummary, useHealthAgents, useHealthEvents, useHealthFailures, useHealthReleases                 |
| `./contexts`             | AuthContext, TenantContext                                                                               |
| `./store`                | authStore, uiStore, whiteLabelStore                                                                      |
| `./components`           | Layout (DashboardLayout, sidebar, etc.)                                                                  |
| `./components/providers` | QueryProvider, ThemeProvider, AppProvider, WhiteLabelProvider                                            |
| `./components/ui`        | Componentes UI (shadcn-style), ToastContainer                                                            |
| `./utils/api`            | api-client, sso-client                                                                                   |
| `./types`                | admin, app, auth, user, permissions, whitelabel, health, shared                                          |

### 4.3 O que fica no frontcore vs no MFE

| No frontcore                                         | No MFE                                            |
| ---------------------------------------------------- | ------------------------------------------------- |
| Auth, tenant, permissões, menu filtrado              | Lógica de negócio do domínio (RPG, AI, CRM, etc.) |
| Layout (DashboardLayout, sidebar), providers globais | Páginas e fluxos específicos do módulo            |
| Componentes UI e ícones compartilhados               | Componentes e hooks específicos do domínio        |
| API client base, SSO client                          | Chamadas e tipos de API do próprio serviço        |
| Hooks de admin, health, AI (preferências/modelos)    | Hooks de livros, campanhas, sessões, etc.         |

### 4.4 Dependências compartilhadas

frontcore declara peerDependencies: react, react-dom, @tanstack/react-query, react-hook-form, zod, tailwindcss, etc. Shell e MFEs usam as mesmas versões (singleton no Federation) para evitar múltiplas cópias no bundle.

---

## 5. Convenções gerais

### 5.1 Nomenclatura

- **Componentes:** PascalCase (ex.: `UserCard`, `ShellLayoutWrapper`).
- **Hooks:** camelCase com prefixo `use` (ex.: `useAuth`, `useRpgCampaigns`).
- **Constantes:** UPPER_SNAKE ou objetos em PascalCase conforme regras do projeto.
- **Páginas:** PascalCase + sufixo Page quando for componente de página (ex.: `BooksListPage`, `DashboardPage`).

### 5.2 Regras de código (conforme .cursor/rules)

- Sem comentários no código; nomes autoexplicativos.
- DRY: lógica repetida em hooks, utils ou services.
- Preferir objetos literais/mapas em vez de if/switch.
- Hooks contêm lógica; componentes contêm UI.
- Tipagem explícita; evitar `any`.

### 5.3 Ambiente e build

- **Shell:** `MFE_*` para URLs dos remotes; defaults localhost:3XXX.
- **Client (Shell e MFEs):** `VITE_SERVICE_*_URL` para APIs (ex.: `VITE_SERVICE_SSO_URL`, `VITE_SERVICE_RPG_URL`). Ver docs/FRONTEND.md e ENVIRONMENT.md.
- MFEs que usam frontcore em build podem precisar de `NPM_TOKEN` para o registry privado.

---

## 6. Resumo visual (texto)

```
[Browser]
    |
    v
[Shell - gaqno-shell-ui :3000]
    | ThemeProvider, QueryProvider, AuthProvider
    | Router: /, /login, /dashboard, /ai, /crm, /rpg, ...
    | ShellLayoutWrapper -> DashboardLayout (frontcore) + useFilteredMenu
    |
    +-- Lazy load MFEs via import("ai/App"), import("rpg/App"), ...
    |       each MFE exposes ./App -> src/App.tsx
    |
    +-- Shared runtime: react, react-dom, react-router-dom, react-query, zustand (singleton)
    |
    +-- @gaqno-development/frontcore
            | providers, contexts, hooks, layout, UI, api client, types
            +-- used by Shell and all MFEs
```

---

## 7. Referências no repositório

- **Regras e env:** `docs/FRONTEND.md`, `docs/ENVIRONMENT.md`
- **Confluence:** `docs/confluence/README.md` (links DDS)
- **Agente de documentação:** `.cursor/agents/frontend-documentation-engineer.md`

Este documento reflete a estrutura atual do monorepo; ao adicionar MFEs ou mudar convenções, atualizar este guia e a página correspondente no Confluence (DDS – Frontend Architecture Guide).

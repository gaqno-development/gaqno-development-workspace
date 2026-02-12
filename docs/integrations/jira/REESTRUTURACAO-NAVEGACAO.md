# Reestruturação — Navegação, Filtros e Dashboards (GaQno Development)

Objetivo: separação clara entre **Planejamento**, **Execução** e **Acompanhamento**, sem perda de histórico nem quebra de fluxos.

---

## 1. Estrutura de navegação (menu / boards)

### Menu final (ordem recomendada)

Ordem na sidebar do projeto (reordenar no Jira por arrastar):

```text
Discovery
Epicos
Backlog
Sprint Atual
Historias
Desenvolvimento
Bugs & Incidentes
Dashboards
```

**Dashboards** não é board; é o link para os painéis compartilhados (Produto/PO, Engenharia, Tech Lead, Gestão). No Jira: menu do projeto ou **Ferramentas** → **Dashboards**.

---

### Quadros (boards) do GAQNO

| #   | Nome              | Tipo   | Link                                                                             | Momento    |
| --- | ----------------- | ------ | -------------------------------------------------------------------------------- | ---------- |
| 75  | Discovery         | Kanban | [Abrir 75](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/75) | Pensar     |
| 71  | Epicos            | Kanban | [Abrir 71](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/71) | Planejar   |
| 76  | Backlog           | Kanban | [Abrir 76](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/76) | Planejar   |
| 77  | Sprint Atual      | Kanban | [Abrir 77](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/77) | Executar   |
| 111 | Historias         | Kanban | [Abrir 111](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/111) | Executar   |
| 73  | Desenvolvimento   | Scrum  | [Abrir 73](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/73) | Executar   |
| 78  | Bugs & Incidentes | Kanban | [Abrir 78](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/78) | Acompanhar |

- **75 Discovery:** ideias, validação, épicos ainda não prontos (label `discovery`).
- **71 Epicos:** governança, visão macro, progresso por módulo.
- **76 Backlog:** refinamento, planejamento, histórias fora da sprint (priorizar).
- **77 Sprint Atual:** daily, prioridades do dia, bloqueios.
- **111 Historias:** unidade de entrega, valor por sprint.
- **73 Desenvolvimento:** execução técnica, subtasks, sprint Scrum (renomear para **Execução Técnica** se quiser).
- **78 Bugs & Incidentes:** suporte, SRE, hotfix (produção separada de feature).

Ver também: [README.md § boards no GAQNO](README.md#3-boards-no-gaqno).

### Alvo (resumo da estrutura)

| Seção              | Itens de menu / uso                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **PLANEJAMENTO**   | Epicos (board 71), Roadmap (épicos por período), Backlog (histórias priorizadas fora da sprint) |
| **EXECUÇÃO**       | Sprint Atual (board 77), Historias (board 111), Execução Técnica (board 73, ex‑Desenvolvimento)  |
| **ACOMPANHAMENTO** | Dashboards, Bugs & Incidentes, Métricas                                                         |

### Ajustes manuais no Jira (sem API de rename de board)

- **Renomear board "Desenvolvimento" → "Execução Técnica"**  
  Jira → Projeto GAQNO → Board 73 (Desenvolvimento) → Configuração do board (engrenagem) → **Nome do board** → alterar para **Execução Técnica** → Salvar.
- **Ordem dos boards**  
  Reordenar na sidebar na ordem do [Menu final](#menu-final-ordem-recomendada): Discovery → Epicos → Backlog → Sprint Atual → Historias → Desenvolvimento → Bugs & Incidentes (Dashboards = link para painéis).
- **Roadmap**  
  Usar o board de Épicos (71) ou vista de roadmap do Jira (se disponível). Backlog = histórico sem sprint ou filtro `[PLANEJAMENTO] Backlog Prioritário`.

Nenhum menu existente foi removido; apenas renomeação e reorganização.

---

## 2. Filtros JQL reutilizáveis (globais)

Criados pelo script `scripts/jira-restructure-navigation-filters.mjs`. Nomes com prefixo `[GAQNO] [SEÇÃO]` para localização.

| Nome                                | JQL (resumo)                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [PLANEJAMENTO] Epics Ativos         | `project = GAQNO AND issuetype = Epic AND status NOT IN (Done, Cancelled) ORDER BY rank ASC`             |
| [PLANEJAMENTO] Backlog Prioritário  | `project = GAQNO AND issuetype = Story AND sprint IS EMPTY ORDER BY priority DESC`                       |
| [EXECUÇÃO] Sprint Atual             | `project = GAQNO AND sprint IN openSprints() ORDER BY rank ASC`                                          |
| [EXECUÇÃO] Historias em Progresso   | `project = GAQNO AND issuetype = Story AND status = "In Progress"` (se PT: `status = "Fazendo"`)         |
| [ACOMPANHAMENTO] Bugs Críticos      | `project = GAQNO AND issuetype = Bug AND priority IN (High, Highest) AND status != Done`                 |
| [ACOMPANHAMENTO] Incidentes Abertos | `project = GAQNO AND issuetype = Bug AND status NOT IN (Done, Resolved)` (ou label `incidente` se usar) |

Se o projeto usar status em português, edite o filtro no Jira e troque: `Done` → `Feito`, `Cancelled` → `Cancelado`, `In Progress` → `Fazendo`, `Resolved` → `Resolvido`.

---

## 3. Dashboards por papel

Criados pelo mesmo script; gadgets adicionados com `scripts/jira-add-gadgets-restructure.mjs`.

| Dashboard                  | Conteúdo (filtros nos gadgets)                                     |
| -------------------------- | ------------------------------------------------------------------ |
| **Dashboard Produto / PO** | Epics Ativos, Backlog Prioritário, Histórias por status            |
| **Dashboard Engenharia**   | Minhas issues, Sprint Atual, Historias em Progresso, Com PR aberta |
| **Dashboard Tech Lead**    | Bugs abertos, Bugs Críticos, Sem atividade 7d                      |
| **Dashboard Gestão**       | Épicos por status, Incidentes Abertos, Resumo issues               |

Dashboards são por **papel**, não por indivíduo; compartilhados com o projeto.

---

## 4. Governança e boas práticas

- **Components**: representar **módulos** (repos/serviços). Ex.: gaqno-rpg-ui, gaqno-finance-service. Não usar para pessoas nem sprints.
- **Labels**: uso técnico ou de contexto (frontend, backend, infra, debito-tecnico, producao). Evitar proliferação.
- **Branch e commit**: sempre incluir a **JIRA Key** (ex.: GAQNO-123) para vinculação automática (GitHub for Jira / Smart Commits).
- **Filtros**: nomear como `[GAQNO] [SEÇÃO] Descrição`; manter globais e reutilizáveis; não duplicar JQL por dashboard.
- **Histórico**: não remover boards nem filtros em uso; renomear e reposicionar apenas.

---

## 5. Scripts e ordem de execução

1. **Filtros e dashboards base (opcional)**  
   `node scripts/jira-create-proj-filters-dashboards.mjs`  
   Cria filtros e painéis por papel (Produto, Engenharia, Tech Lead, OPS, Liderança).

2. **Filtros e dashboards da reestruturação**  
   `node scripts/jira-restructure-navigation-filters.mjs`  
   Cria os 6 filtros [PLANEJAMENTO]/[EXECUÇÃO]/[ACOMPANHAMENTO] e os 4 dashboards (Produto/PO, Engenharia, Tech Lead, Gestão).

3. **Gadgets nos dashboards da reestruturação**  
   `node scripts/jira-add-gadgets-restructure.mjs`  
   Preenche os dashboards com gadgets “Resultados de filtro” apontando para os filtros corretos.

4. **Gadgets nos painéis antigos (opcional)**  
   `node scripts/jira-add-gadgets-to-proj-dashboards.mjs`  
   Para os painéis “[GAQNO] Painel …” já existentes.

Dry-run (só listar o que seria criado):  
`node scripts/jira-restructure-navigation-filters.mjs --dry-run`

---

## 6. Resumo das mudanças realizadas

| Item                         | Ação                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| Menu “Desenvolvimento”       | **Renomear manualmente** no Jira para “Execução Técnica” (board 73).                      |
| Menus “Historias” e “Epicos” | Mantidos; apenas **reposicionados** na lógica (Planejamento / Execução).                  |
| Novos filtros                | 6 filtros JQL criados via script (prefixos [PLANEJAMENTO], [EXECUÇÃO], [ACOMPANHAMENTO]). |
| Novos dashboards             | 4 dashboards por papel (Produto/PO, Engenharia, Tech Lead, Gestão) criados via script.    |
| Gadgets                      | Script para adicionar “Resultados de filtro” nos 4 dashboards da reestruturação.          |
| Dados e histórico            | Nenhuma remoção de dados; apenas criação de filtros/dashboards e renomeação de um board.  |

Ver também: [ESTRUTURA-ESPACOS-DASHBOARDS.md](ESTRUTURA-ESPACOS-DASHBOARDS.md), [README.md](README.md).

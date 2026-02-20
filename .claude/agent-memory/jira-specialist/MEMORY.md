# Jira Specialist Memory

## Projeto Jira
- **Projeto**: GAQNO (Gaqno Development)
- **URL**: https://gaqno.atlassian.net
- **Token**: Configurado e funcionando (testado em 2026-02-20)
- **MCP**: Configurado e testado com sucesso
- **GitHub Integration**: GitHub for Atlassian configurado (ver docs/GITHUB-JIRA-INTEGRATION.md)

## Tipos de Ticket Suportados (segundo teste MCP)
1. Subtarefa (Sub-task) ✅
2. História (Story) ✅  
3. [System] Incident
4. [System] Service request
5. [System] Service request with approvals
6. Tarefa (Task) ✅
7. Bug ✅
8. Epic (disponível para uso) ✅

## Estrutura do Workspace
Workspace principal: `/data/gaqno-development-workspace`
- **Estrutura**: Monorepo com submódulos Git
- **Cada serviço/UI**: Submódulo independente
- **`.gitmodules`**: Define mapeamentos dos repositórios

### Repositórios Identificados
**Serviços (backends):**
- gaqno-ai-service
- gaqno-pdv-service
- gaqno-sso-service
- gaqno-finance-service
- gaqno-rpg-service
- gaqno-omnichannel-service
- gaqno-admin-service
- gaqno-wellness-service
- gaqno-saas-service

**UIs (frontends):**
- gaqno-admin-ui
- gaqno-ai-ui
- gaqno-crm-ui
- gaqno-erp-ui
- gaqno-finance-ui
- gaqno-landing-ui
- gaqno-lenin-ui
- gaqno-omnichannel-ui
- gaqno-pdv-ui
- gaqno-rpg-ui
- gaqno-saas-ui
- gaqno-shell-ui
- gaqno-sso-ui

**Core (compartilhado):**
- @gaqno-backcore (repositório separado: gaqno-backcore)
- @gaqno-frontcore (repositório separado: gaqno-frontcore)
- @gaqno-types (repositório separado: gaqno-types)

## 📋 Padrões de Workflow Descobertos

### ✅ Convenções de Nomenclatura de Branches (CONFIRMADO)
**DOCUMENTAÇÃO OFICIAL (WORKSPACE-WORKFLOW.md):**
- **Epic**: `epic/GAQNO-XXXX` (ex: `epic/GAQNO-1113`)
- **Story**: `story/GAQNO-XXXX` (ex: `story/GAQNO-1123`)  
- **Bug**: `GAQNO-XXXX` (sem prefixo, apenas número do ticket)
- **Observação**: Há branches remotos com padrão `feature/GAQNO-XXXX` também em uso

**EXEMPLOS REAIS ENCONTRADOS:**
- `remotes/origin/GAQNO-1112` (bug)
- `remotes/origin/feature/GAQNO-1117` (story com prefixo feature)
- `remotes/origin/feature/GAQNO-1123` (story)
- `remotes/origin/feature/GAQNO-1325-message-templates-ui-padrao`

### ✅ Branch Base por Hierarquia (CONFIRMADO)
**DOCUMENTAÇÃO OFICIAL:**
- **Epic branches from**: `main`
- **Story branches from**: branch Epic pai (ex: `story/GAQNO-1117` → `epic/GAQNO-1113`)
- **Bug branches from**: `main`

**HIERARQUIA COMPLETA:**
```
main
 └── epic/GAQNO-1113  (release branch)
      ├── story/GAQNO-1117  → PR: story/GAQNO-1117 → epic/GAQNO-1113
      ├── story/GAQNO-1123  → PR: story/GAQNO-1123 → epic/GAQNO-1113
      └── (all stories merged) → PR: epic/GAQNO-1113 → main
```

### ✅ Convenção de Commits
- **1 Subtask = 1 Commit** (regra obrigatória)
- **Formato**: `GAQNO-XXXX type: descrição` (chave da SUBTAREFA, nunca da Story/Epic)
- Exemplo: `GAQNO-1170 feat: add retail content engine`

### ✅ Onde Abrir PRs (CRÍTICO!)
**REGRA PRINCIPAL:** PR deve ser aberta no repositório do componente alterado, NÃO no workspace.

| Alterou em: | Abrir PR em: |
|-------------|--------------|
| `gaqno-rpg-ui/` | `gaqno-development/gaqno-rpg-ui` |
| `gaqno-ai-service/` | `gaqno-development/gaqno-ai-service` |
| `@gaqno-frontcore/` | `gaqno-development/gaqno-frontcore` |
| `@gaqno-backcore/` | `gaqno-development/gaqno-backcore` |
| `@gaqno-types/` | `gaqno-development/gaqno-types` |
| Raiz do workspace (docs, scripts) | `gaqno-development/gaqno-development-workspace` |

### ✅ Workflow de Status Jira
- **Status "Fazendo"** = PR aberta (fila de code review)
- **JQL para PRs pendentes**: `project = GAQNO AND status = "Fazendo" ORDER BY updated DESC`
- **GitHub for Atlassian**: Vincula branches/commits/PRs ao painel "Development" do Jira

## 🔨 Comandos de Build por Tipo de Repositório

### Serviços (NestJS)
- **Build**: `npm run build` ou `nest build`
- **Dev**: `npm run start:dev`
- **Exemplo**: gaqno-ai-service usa NestJS

### Frontends (Vite + React)
- **Build**: `npm run build` (executa `vite build`)
- **Dev**: `npm run dev`
- **Exemplo**: gaqno-shell-ui usa Vite

### Scripts Úteis do Workspace
- `npm run build:all` - Build de todos os projetos
- `npm run dev` - Inicia todos em modo desenvolvimento
- `./build-all.sh` - Script completo de build com limpeza

## 📝 Templates e Exemplos

### Template de Mensagem de Commit
```
GAQNO-XXXX tipo: descrição breve

Descrição detalhada se necessário

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Template de PR
**Título**: `GAQNO-XXXX Descrição da funcionalidade`

**Corpo**:
- Link para ticket Jira
- Resumo das mudanças
- Notas de teste
- Checklist de revisão

## 🔍 JQL Queries Úteis
- Épicos: `project = GAQNO AND issuetype = Epic`
- Histórias: `project = GAQNO AND issuetype = Story` 
- Subtarefas: `project = GAQNO AND issuetype = Subtask`
- PRs pendentes: `project = GAQNO AND status = "Fazendo" AND development[pullrequests].open > 0`

## ⚠️ Pontos de Atenção

1. **Branch vs Commit Keys**: Branch usa chave da Story/Epic, commits usam chave da Subtask
2. **PR no repo correto**: Nunca abrir PR no workspace, sempre no repo específico
3. **Git worktree**: Recomendado criar worktree para evitar conflitos entre sessões
4. **Build antes do commit**: Executar build dentro do worktree antes de commitar

## 🚀 Próximas Ações
1. Testar workflow completo com ticket real
2. Criar scripts auxiliares para automatização
3. Documentar comandos exatos para cada tipo de repositório
4. Validar integração GitHub-Jira com PR real

---
*Memória atualizada em: 2026-02-20 20:32 UTC*
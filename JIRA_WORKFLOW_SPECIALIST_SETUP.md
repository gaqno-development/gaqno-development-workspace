# Configuração do Sub-agent Jira Workflow Specialist

## 📅 Data: 2026-02-20 20:30 UTC

## 🎯 Objetivo
Configurar sub-agent especializado em workflow Jira-Git integrado com a documentação `jira-specialist.md`.

## ✅ Sub-agent Criado
- **Session Key**: `agent:main:subagent:6c49dba9-dd9b-4908-a2d7-90dc100436ff`
- **Run ID**: `a14f6702-6b91-44ff-bedc-53425dc19138`
- **Label**: `jira-workflow-specialist`
- **Status**: Ativo e configurado

## 📋 Documentação Fornecida
O sub-agent recebeu a documentação completa de `jira-specialist.md` incluindo:

### Principais Funcionalidades:
1. **Validação de Tickets Jira via MCP**
2. **Gestão de Branches com convenções**
3. **Workflow de Commit estruturado**
4. **Gestão de Pull Requests com links Jira**
5. **Aplicação rigorosa de workflow**

### Padrões de Workflow:
- **Hierarquia Jira**: Epic → Story → Subtask
- **Convenção de branches**: `type/TICKET-KEY-description`
- **Formato de commit**: `[TICKET-KEY] Descrição`
- **Ordem de execução obrigatória**: 12 passos sequenciais

### Integração MCP:
- Busca de tickets diretamente do Jira
- Validação de hierarquia em tempo real
- Transições de status automatizadas
- Comentários com links de PR

## 🛠️ Contexto do Workspace para o Sub-agent

### Projeto Jira:
- **Projeto**: GAQNO (Gaqno Development)
- **URL**: https://gaqno.atlassian.net
- **Token**: Atualizado e funcionando
- **Status**: Projeto criado, sem tickets ainda

### Repositórios Gaqno:
```
/data/gaqno-development-workspace/
├── gaqno-ai-service/          # Serviço de IA
├── gaqno-sso-service/         # Serviço de autenticação
├── gaqno-finance-service/     # Serviço financeiro
├── gaqno-pdv-service/         # PDV
├── gaqno-rpg-service/         # RPG
├── gaqno-omnichannel-service/ # Omnichannel
└── gaqno-wellness-service/    # Wellness
```

### Configuração MCP Ativa:
```json
"atlassian": {
  "command": "uvx",
  "args": ["mcp-atlassian"],
  "env": {
    "JIRA_URL": "https://gaqno.atlassian.net",
    "JIRA_USERNAME": "gabriel.aquino@outlook.com",
    "JIRA_API_TOKEN": "ATATT3xFfGF0UzAmDlvKRT0Isu_v1-fzBDyE_tMVgn9JkCkH0ZE5waY2xRyKHRW08EEr7uqXjEv0ww6DdsKE1alVnpPS0mmAQIHvqOI6mberDOtoa54yYGV3sVMArX374dRfLFAIRtyTjnYg9M_hItIFeGmfEy96LK5brjvLhMeGiOX1axaKmf0=66ED92B3",
    "CONFLUENCE_URL": "https://gaqno-development.atlassian.net/wiki",
    "CONFLUENCE_USERNAME": "gabriel.aquino@outlook.com",
    "CONFLUENCE_API_TOKEN": "ATATT3xFfGF0UzAmDlvKRT0Isu_v1-fzBDyE_tMVgn9JkCkH0ZE5waY2xRyKHRW08EEr7uqXjEv0ww6DdsKE1alVnpPS0mmAQIHvqOI6mberDOtoa54yYGV3sVMArX374dRfLFAIRtyTjnYg9M_hItIFeGmfEy96LK5brjvLhMeGiOX1axaKmf0=66ED92B3"
  }
}
```

## 🎯 Casos de Uso Imediatos

### 1. **Criação de Primeira Estrutura Jira**
```bash
# O sub-agent pode ajudar a criar:
1. Epic: "Desenvolvimento da Plataforma Gaqno" (GAQNO-1)
2. Story: "Sistema de Autenticação SSO" (GAQNO-2)
3. Subtask: "Implementar login com email/senha" (GAQNO-3)
```

### 2. **Workflow para Desenvolvimento**
```bash
# Para qualquer ticket GAQNO-XXX:
1. Validar ticket via MCP
2. Criar branch: `feature/GAQNO-XXX-descricao`
3. Criar worktree isolado
4. Desenvolver e testar
5. Commit com mensagem formatada
6. Push e criar PR
7. Atualizar status Jira
```

### 3. **Integração com Serviços Existentes**
```bash
# Exemplo: Desenvolvimento no gaqno-ai-service
1. Ticket: GAQNO-4 (Integração OpenClaw)
2. Branch: `feature/GAQNO-4-openclaw-integration`
3. Repositório: /data/gaqno-development-workspace/gaqno-ai-service
4. Worktree: ../gaqno-ai-service-openclaw
```

## 📊 Fluxo de Trabalho do Sub-agent

### Passo a Passo Obrigatório:
1. **Identificar ticket** - Buscar no Jira via MCP
2. **Validar tipo e hierarquia** - Verificar relações
3. **Determinar branch** - Aplicar convenção
4. **Identificar repositório** - Localizar código
5. **Criar worktree** - Ambiente isolado
6. **Build antes do commit** - Validar
7. **Commit formatado** - Mensagem padrão
8. **Push para remote** - Enviar alterações
9. **Criar PR** - Com links Jira
10. **Atualizar Jira** - Transicionar status
11. **Limpar worktree** - Após merge

### Regras Estritas:
- **Nunca pular passos**
- **Sempre validar com MCP**
- **Sempre criar worktree**
- **Sempre build antes de commit**
- **1 Subtask = 1 Commit**

## 🔧 Como Usar o Sub-agent

### Chamando o Sub-agent:
```bash
# Para qualquer tarefa relacionada a Jira + Git:
"Preciso commitar mudanças para o ticket GAQNO-5"
"Vou desenvolver a feature do ticket GAQNO-6"
"Como criar branch para este bug do Jira?"
```

### Exemplos de Interação:
```
Usuário: "Commit estas mudanças para o GAQNO-7"
Sub-agent: "Passo 1: Buscando ticket GAQNO-7 no Jira via MCP..."
Sub-agent: "✅ Ticket encontrado: 'Melhorar performance da API' (Story)"
Sub-agent: "Passo 2: Validando hierarquia..."
Sub-agent: "✅ Parent: GAQNO-1 (Epic principal)"
Sub-agent: "Passo 3: Branch: feature/GAQNO-7-performance-api"
Sub-agent: "Passo 4: Repositório: gaqno-ai-service"
Sub-agent: "Passo 5: Criando worktree..."
```

## 🚀 Próximas Ações Sugeridas

### Imediatas:
1. **Criar primeiro épico** no projeto GAQNO
2. **Testar workflow** com um subtask simples
3. **Configurar memória persistente** do sub-agent

### Configuração:
1. **Definir convenções específicas** para projeto GAQNO
2. **Mapear repositórios** e comandos de build
3. **Configurar templates de PR**

### Integração:
1. **Conectar com CI/CD** via Coolify MCP
2. **Integrar com outros MCPs** (Postgres, Playwright)
3. **Automatizar deploys** baseados em status Jira

## 📝 Memória Persistente do Sub-agent

### Localização:
```
/home/gaqno/coding/gaqno/gaqno-development-workspace/.claude/agent-memory/jira-specialist/
├── MEMORY.md              # Memória principal (max 200 linhas)
├── workflow-patterns.md   # Padrões de workflow
├── repositories.md        # Repositórios e builds
├── jira-conventions.md    # Convenções do projeto GAQNO
└── mcp-patterns.md       # Padrões de uso MCP
```

### O que Salvar:
- Convenções de projeto GAQNO
- Localizações de repositórios
- Comandos de build por serviço
- Templates de PR
- JQL queries úteis
- Padrões de erro e soluções

## 🎉 Status Atual

### ✅ Configurado:
- Sub-agent criado com documentação completa
- Integração MCP Jira funcionando
- Workspace mapeado
- Fluxo de trabalho definido

### ⏳ Pendente:
- Primeiros tickets no projeto GAQNO
- Teste prático do workflow
- Configuração de memória persistente

### 🚀 Pronto para:
- Criar estrutura inicial de tickets
- Gerenciar desenvolvimento com workflow rigoroso
- Integrar Jira + Git + Deploy de forma automatizada

---

**Conclusão**: O sub-agent Jira Workflow Specialist está configurado e pronto para ajudar a implementar um workflow estruturado de desenvolvimento integrando Jira, Git e os serviços Gaqno com validação em tempo real via MCP.
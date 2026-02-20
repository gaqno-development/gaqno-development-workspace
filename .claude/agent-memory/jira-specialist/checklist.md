# Checklist de Workflow Jira-Git

## Pré-requisitos
- [ ] MCP Jira configurado e testado ✅ (confirmado em JIRA_MCP_TEST_REPORT.md)
- [ ] Token Atlassian válido ✅ (testado)
- [ ] Workspace clonado e submódulos inicializados ✅
- [ ] GitHub CLI instalado e autenticado (assumido)
- [ ] Acesso aos repositórios GitHub (assumido)

## Passo 1: Identificar Ticket Jira
- [ ] Extrair key do ticket do contexto (PROJ-NUM)
- [ ] **USAR MCP**: Buscar detalhes do ticket
- [ ] Verificar: tipo, status, assignee, summary
- [ ] Validar formato: `GAQNO-\d+`

## Passo 2: Determinar Tipo de Ticket
- [ ] **USAR MCP**: Extrair tipo do ticket
- [ ] Tipos válidos: Epic, Story, Subtask, Bug, Task
- [ ] Mapear para convenção de branch

## Passo 3: Validar Hierarquia
- [ ] **USAR MCP**: Buscar relacionamentos pai/filho
- [ ] Subtask → confirmar parent Story
- [ ] Story → confirmar parent Epic  
- [ ] Bug → verificar se vinculado ou standalone
- [ ] Validar toda a cadeia de hierarquia

## Passo 4: Determinar Nome e Base da Branch
- [ ] Aplicar convenção baseada no tipo:
  - Epic: `epic/GAQNO-XXXX`
  - Story: `story/GAQNO-XXXX` ou `feature/GAQNO-XXXX`
  - Bug: `GAQNO-XXXX` (sem prefixo)
- [ ] Determinar branch base:
  - Epic: `main`
  - Story: branch Epic pai
  - Subtask: branch Story pai
  - Bug: `main`

## Passo 5: Identificar Repositório
- [ ] Determinar qual repositório contém as mudanças
- [ ] Verificar diretório atual
- [ ] Confirmar com usuário se necessário
- [ ] Validar: PR deve ser aberta neste repositório

## Passo 6: Criar Worktree (OBRIGATÓRIO)
- [ ] Navegar para repositório identificado
- [ ] Criar branch com nome convencional
- [ ] Criar worktree: `git worktree add ../<repo>-<desc> -b <branch>`
- [ ] **TODO**: usar dentro do worktree

## Passo 7: Build Antes do Commit
- [ ] Executar dentro do worktree
- [ ] Comando de build específico do repositório:
  - Serviços: `npm run build`
  - Frontends: `npm run build`
  - Pacotes: `npm run build`
- [ ] Validar build bem-sucedido

## Passo 8: Commit das Mudanças
- [ ] Executar dentro do worktree
- [ ] Seguir regra: 1 Subtask = 1 Commit
- [ ] Formato: `GAQNO-XXXX tipo: descrição`
- [ ] Incluir `Co-Authored-By` se apropriado
- [ ] Validar escopo corresponde ao ticket

## Passo 9: Push para Remote
- [ ] Executar dentro do worktree
- [ ] `git push -u origin <branch-name>`
- [ ] Lidar com autenticação/conflitos

## Passo 10: Abrir Pull Request
- [ ] Usar GitHub CLI no diretório correto
- [ ] **CRÍTICO**: Abrir PR no repositório do componente
- [ ] Title: `GAQNO-XXXX Descrição`
- [ ] Body: Link Jira, resumo, testes, checklist
- [ ] Base branch: conforme hierarquia

## Passo 11: Atualizar Jira via MCP
- [ ] **USAR MCP**: Buscar transições disponíveis
- [ ] Perguntar: "Atualizar status para 'Fazendo'?"
- [ ] Se sim:
  - Transicionar status (ex: To Do → Fazendo)
  - Adicionar comentário com link da PR
  - Atualizar assignee se necessário
- [ ] Confirmar atualização bem-sucedida

## Passo 12: Limpeza do Worktree
- [ ] **APÓS PR SER MERGEADA**
- [ ] Remover worktree: `git worktree remove ../<path>`
- [ ] Opcional: deletar branch local/remota
- [ ] Atualizar main local: `git pull origin main`

## Validações de Segurança

### Validação de Branch
- [ ] Nome segue convenção do tipo
- [ ] Base branch correta conforme hierarquia
- [ ] Não há conflitos com branches existentes

### Validação de Commit
- [ ] Mensagem referencia ticket correto
- [ ] Formato: `GAQNO-XXXX (feat|fix|chore|...): descrição`
- [ ] Scope limitado à subtarefa

### Validação de PR
- [ ] Título contém key do ticket
- [ ] Repositório correto (não workspace)
- [ ] Base branch correta
- [ ] Descrição completa com contexto

### Validação Jira
- [ ] Ticket existe e é acessível
- [ ] Status permite transição
- [ ] Usuário tem permissão para atualizar

## Cenários Especiais

### Cenário A: Múltiplas Subtarefas em uma Story
1. Branch: `story/GAQNO-1200`
2. Commits: `GAQNO-1201`, `GAQNO-1202`, `GAQNO-1203`
3. PR: `story/GAQNO-1200` → `epic/GAQNO-1113`

### Cenário B: Bug em Produção
1. Branch: `GAQNO-1152` (sem prefixo)
2. Commit: `GAQNO-1152 fix: descrição`
3. PR: `GAQNO-1152` → `main`

### Cenário C: Pacote Compartilhado
1. Repositório: `gaqno-frontcore` (não workspace)
2. Branch: `story/GAQNO-1300`
3. PR: abrir no repo do pacote
4. Após merge: `npm publish`

## Troubleshooting

### MCP Não Responde
- [ ] Verificar conexão: `claude mcp list`
- [ ] Validar token Jira
- [ ] Testar autenticação básica

### Build Falha
- [ ] Verificar logs de erro
- [ ] Validar dependências instaladas
- [ ] Testar comando manualmente

### Push Rejeitado
- [ ] Verificar permissões
- [ ] Atualizar branch: `git pull --rebase origin main`
- [ ] Resolver conflitos

### PR Não Cria
- [ ] Verificar GitHub CLI autenticado
- [ ] Confirmar repositório correto
- [ ] Validar branch existe no remote

### Jira Não Atualiza
- [ ] Verificar permissões do usuário
- [ ] Validar transições disponíveis
- [ ] Testar com API direta
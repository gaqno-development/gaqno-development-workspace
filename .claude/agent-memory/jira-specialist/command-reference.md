# Command Reference

## Comandos Essenciais para Workflow Jira-Git

### 1. Inicialização do Ambiente
```bash
# Clonar workspace (se necessário)
git clone <workspace-repo-url>
cd gaqno-development-workspace

# Inicializar submódulos (se necessário)
git submodule update --init --recursive

# Instalar dependências do workspace
npm install --legacy-peer-deps
```

### 2. Identificação e Validação de Ticket Jira
```bash
# Buscar ticket via MCP (dentro do agente)
# jira fetch GAQNO-1200

# Buscar hierarquia via MCP
# jira get-links GAQNO-1200

# Buscar transições disponíveis
# jira get-transitions GAQNO-1200
```

### 3. Criação de Branch
```bash
# Epic a partir de main
git checkout -b epic/GAQNO-1113 main

# Story a partir de Epic
git checkout -b story/GAQNO-1117 epic/GAQNO-1113

# Bug a partir de main
git checkout -b GAQNO-1152 main

# Feature (alternativo)
git checkout -b feature/GAQNO-1123 epic/GAQNO-1113
```

### 4. Criação de Worktree (RECOMENDADO)
```bash
# Criar worktree para branch nova
cd gaqno-rpg-ui
git worktree add ../gaqno-rpg-ui-1200 -b story/GAQNO-1200

# Navegar para worktree
cd ../gaqno-rpg-ui-1200

# Verificar worktrees existentes
git worktree list
```

### 5. Build e Validação
```bash
# Dentro do worktree/repositório
npm run build

# Build específico para serviços NestJS
npm run build  # ou nest build

# Build específico para frontends Vite
npm run build  # executa vite build

# Testar antes do commit
npm test  # se disponível
```

### 6. Commit de Mudanças
```bash
# Adicionar mudanças
git add .

# Commit para subtarefa (formato padrão)
git commit -m "GAQNO-1201 feat: implementar componente X"

# Commit com descrição detalhada
git commit -m "GAQNO-1202 fix: corrigir bug no cálculo

- Problema: Cálculo incorreto quando Y = 0
- Solução: Adicionar validação de zero
- Testes: Adicionados testes unitários

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Verificar histórico
git log --oneline -5
```

### 7. Push para Remote
```bash
# Primeiro push (criar branch remota)
git push -u origin story/GAQNO-1200

# Push subsequente
git push origin
```

### 8. Criação de Pull Request
```bash
# Usando GitHub CLI (recomendado)
cd gaqno-rpg-ui

# Story para Epic
gh pr create \
  --base epic/GAQNO-1113 \
  --head story/GAQNO-1200 \
  --title "GAQNO-1200 Descrição da história" \
  --body "## Descrição

Link para Jira: https://gaqno.atlassian.net/browse/GAQNO-1200

## Mudanças
- Implementação do componente X
- Correção do bug Y
- Adição de testes

## Testes Realizados
- [x] Testes unitários
- [x] Testes de integração
- [ ] Testes e2e

## Checklist de Revisão
- [ ] Código segue padrões do projeto
- [ ] Testes passam
- [ ] Documentação atualizada
- [ ] Build bem-sucedido"

# Bug para main
gh pr create \
  --base main \
  --head GAQNO-1152 \
  --title "GAQNO-1152 fix: corrigir problema Z" \
  --body "## Fix

**Problema**: Descrição do problema
**Solução**: Descrição da solução
**Impacto**: O que foi afetado

Link: https://gaqno.atlassian.net/browse/GAQNO-1152"

# Pacote compartilhado (@gaqno-frontcore)
cd @gaqno-frontcore
gh pr create \
  --repo gaqno-development/gaqno-frontcore \
  --base epic/GAQNO-1113 \
  --head story/GAQNO-1300 \
  --title "GAQNO-1300 feat: nova funcionalidade no frontcore"
```

### 9. Atualização Jira via MCP
```bash
# Dentro do agente Jira Specialist:

# 1. Buscar transições disponíveis
# jira get-transitions GAQNO-1200

# 2. Transicionar status (ex: To Do → Fazendo)
# jira transition GAQNO-1200 "Fazendo"

# 3. Adicionar comentário com link da PR
# jira comment GAQNO-1200 "PR aberta: https://github.com/gaqno-development/gaqno-rpg-ui/pull/42"

# 4. Atualizar assignee se necessário
# jira update GAQNO-1200 --assignee gabriel.aquino@outlook.com
```

### 10. Limpeza Após Merge
```bash
# Após PR ser mergeada, limpar worktree
cd gaqno-rpg-ui
git worktree remove ../gaqno-rpg-ui-1200

# Apagar branch local (opcional)
git branch -d story/GAQNO-1200

# Apagar branch remota (opcional)
git push origin --delete story/GAQNO-1200

# Atualizar main local
git checkout main
git pull origin main
```

### 11. Comandos de Verificação
```bash
# Verificar status de todos os repositórios
find . -name ".git" -type d | xargs -I {} dirname {} | xargs -I {} sh -c 'echo "=== {} ===" && cd {} && git status -s'

# Verificar branches locais e remotas
git branch -avv

# Verificar submódulos
git submodule status

# Verificar se há alterações não commitadas
git status --porcelain
```

### 12. Comandos de Troubleshooting
```bash
# Conflito de merge: resolver e continuar
git mergetool
git add .
git commit

# Descartar mudanças locais
git checkout -- .

# Resetar para commit anterior
git reset --hard HEAD~1

# Rebase interativo
git rebase -i HEAD~3

# Cherry-pick de commit
git cherry-pick <commit-hash>
```

### 13. Scripts do Workspace
```bash
# Build completo
./build-all.sh

# Push em todos os repositórios com alterações
./push-all.sh

# Publicar pacotes compartilhados
./publish-packages.sh

# Copiar workflows para todos os repositórios
./scripts/copy-workflows-to-repos.sh
```

### 14. GitHub CLI Avançado
```bash
# Listar PRs abertas
gh pr list --state open

# Verificar PR específica
gh pr view 42 --web

# Fazer merge de PR
gh pr merge 42 --squash

# Adicionar reviewers
gh pr edit 42 --add-reviewer @gaqno/team

# Verificar checks de CI
gh pr checks 42
```

### 15. Integração com Jira (via Browser)
```bash
# Abrir ticket no navegador
open "https://gaqno.atlassian.net/browse/GAQNO-1200"

# Abrir PR no navegador
open "https://github.com/gaqno-development/gaqno-rpg-ui/pull/42"
```

## Fluxo Completo Exemplo

### Nova História com 3 Subtarefas
```bash
# Passo 1: Identificar tickets
# GAQNO-1200 (Story), GAQNO-1201, GAQNO-1202, GAQNO-1203 (Subtasks)

# Passo 2: Criar branch da história
cd gaqno-rpg-ui
git checkout -b story/GAQNO-1200 epic/GAQNO-1113

# Passo 3: Criar worktree
git worktree add ../gaqno-rpg-ui-1200 story/GAQNO-1200
cd ../gaqno-rpg-ui-1200

# Passo 4: Desenvolver subtarefa 1
# ... implementar mudanças para GAQNO-1201
npm run build
git add .
git commit -m "GAQNO-1201 feat: implementar parte A"

# Passo 5: Desenvolver subtarefa 2  
# ... implementar mudanças para GAQNO-1202
npm run build
git add .
git commit -m "GAQNO-1202 fix: corrigir bug B"

# Passo 6: Desenvolver subtarefa 3
# ... implementar mudanças para GAQNO-1203
npm run build
git add .
git commit -m "GAQNO-1203 test: adicionar testes C"

# Passo 7: Push
git push -u origin story/GAQNO-1200

# Passo 8: Criar PR
gh pr create --base epic/GAQNO-1113 --head story/GAQNO-1200 \
  --title "GAQNO-1200 Implementação do módulo X" \
  --body "Implementação completa conforme subtarefas 1201, 1202, 1203"

# Passo 9: Atualizar Jira (via MCP)
# jira transition GAQNO-1200 "Fazendo"
# jira comment GAQNO-1200 "PR #42 aberta: https://github.com/..."

# Passo 10: Após merge, limpar
cd gaqno-rpg-ui
git worktree remove ../gaqno-rpg-ui-1200
git checkout main
git pull origin main
```
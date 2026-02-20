# Workflow Patterns

## Hierarquia Jira-Git Comprovada

### Estrutura Real Encontrada
```
main (branch principal)
└── epic/GAQNO-1113 (branch de release)
    ├── story/GAQNO-1117 (branch de feature)
    │   ├── commit: GAQNO-1146 feat: primeira subtarefa
    │   ├── commit: GAQNO-1147 fix: segunda subtarefa  
    │   └── commit: GAQNO-1148 chore: terceira subtarefa
    ├── story/GAQNO-1123
    └── story/GAQNO-1160
```

### Fluxo de Desenvolvimento
1. **Criar branch do épico** a partir de `main`
   ```bash
   git checkout -b epic/GAQNO-1113 main
   git push -u origin epic/GAQNO-1113
   ```

2. **Criar branch da história** a partir do épico
   ```bash
   git checkout -b story/GAQNO-1117 epic/GAQNO-1113
   git push -u origin story/GAQNO-1117
   ```

3. **Desenvolver subtarefas** na branch da história
   - Cada commit referencia uma subtarefa diferente
   - Formato: `GAQNO-1146 tipo: descrição`

4. **Abrir PR da história** para o épico
   ```bash
   # Na pasta do repositório alterado
   cd gaqno-rpg-ui
   gh pr create --base epic/GAQNO-1113 --head story/GAQNO-1117 --title "GAQNO-1117 Descrição"
   ```

5. **Após aprovação**, merge da história no épico

6. **Quando épico completo**, PR do épico para `main`

### Fluxo de Bug Fix
1. **Criar branch do bug** a partir de `main`
   ```bash
   git checkout -b GAQNO-1152 main
   git push -u origin GAQNO-1152
   ```

2. **Desenvolver fix** e commitar
   ```bash
   git commit -m "GAQNO-1152 fix: descrição do fix"
   ```

3. **Abrir PR do bug** para `main`
   ```bash
   cd gaqno-rpg-ui
   gh pr create --base main --head GAQNO-1152 --title "GAQNO-1152 fix: descrição"
   ```

## Regras de Validação

### Validação de Branch
- **Épico**: `epic/GAQNO-\d+`
- **História**: `story/GAQNO-\d+` ou `feature/GAQNO-\d+`
- **Bug**: `GAQNO-\d+` (sem prefixo)

### Validação de Commit
- **Formato**: `GAQNO-\d+ (feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert): .+`
- **Mínimo**: 50 commits por subtarefa

### Validação de PR
- **Título deve conter**: `GAQNO-\d+`
- **Branch base correta** conforme hierarquia
- **Repositório correto**: PR deve ser aberta no repo do componente

## Cenários Comuns

### Cenário 1: Nova História com Múltiplas Subtarefas
```
Ticket: GAQNO-1200 (Story)
Subtarefas: GAQNO-1201, GAQNO-1202, GAQNO-1203

Workflow:
1. git checkout -b story/GAQNO-1200 epic/GAQNO-1113
2. git commit -m "GAQNO-1201 feat: implementar X"
3. git commit -m "GAQNO-1202 fix: corrigir Y"
4. git commit -m "GAQNO-1203 test: adicionar testes"
5. gh pr create --base epic/GAQNO-1113 --head story/GAQNO-1200
```

### Cenário 2: Bug em Produção
```
Ticket: GAQNO-1250 (Bug)

Workflow:
1. git checkout -b GAQNO-1250 main
2. git commit -m "GAQNO-1250 fix: corrigir problema Z"
3. gh pr create --base main --head GAQNO-1250
```

### Cenário 3: Alteração em Pacote Compartilhado
```
Componente: @gaqno-frontcore
Ticket: GAQNO-1300

Workflow:
1. cd @gaqno-frontcore
2. git checkout -b story/GAQNO-1300 epic/GAQNO-1113
3. Desenvolver e commitar
4. gh pr create --repo gaqno-development/gaqno-frontcore --base epic/GAQNO-1113 --head story/GAQNO-1300
5. Após merge, publicar pacote: npm publish
```

## Comandos GitHub CLI

### Criar PR com Validação
```bash
# Story para Epic
gh pr create \
  --base epic/GAQNO-1113 \
  --head story/GAQNO-1117 \
  --title "GAQNO-1117 Descrição da história" \
  --body "## Descrição\n\n- Link: https://gaqno.atlassian.net/browse/GAQNO-1117\n- Resumo: ..."

# Bug para main  
gh pr create \
  --base main \
  --head GAQNO-1152 \
  --title "GAQNO-1152 fix: Descrição do fix" \
  --body "## Fix\n\n- Link: https://gaqno.atlassian.net/browse/GAQNO-1152\n- Problema: ..."
```

### Verificar PRs Abertas por Ticket
```bash
# Buscar PRs com GAQNO-1117 no título
gh pr list --search "GAQNO-1117" --state all

# Listar PRs abertas no repositório atual
gh pr list --state open
```

## Integração Jira

### Status do Ticket
- **To Do**: Ticket criado, não iniciado
- **Fazendo**: Em desenvolvimento (PR aberta = code review pendente)
- **Concluído**: PR aprovada e mergeada

### Painel Development no Jira
- **Branch**: Aparece no ticket cuja key está no nome da branch
- **Commits**: Aparecem no ticket cuja key está na mensagem de commit
- **PR**: Aparece quando título contém key do ticket

### Backfill Manual (se não aparecer)
1. Jira → Apps → Manage apps → GitHub for Atlassian
2. Clicar na organização GitHub → Settings
3. "Continue backfill" → Escolher data inicial
4. Executar backfill
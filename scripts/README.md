# Scripts

## copy-workflows-to-repos.sh

Copia os workflows de CI (`ci.yml`, `branch-pr-validation.yml`) para cada repositório individual.

### Uso

```bash
./scripts/copy-workflows-to-repos.sh
```

Executar a partir do workspace root. Os workflows são copiados de `scripts/workflows/` para `{repo}/.github/workflows/`:

- `ci.yml` — lint, test, build
- `branch-pr-validation.yml` — validação de branch/PR
- `pr-agent.yml` — code review por IA ([PR-Agent](https://github.com/qodo-ai/pr-agent)); requer `OPENAI_KEY` em GitHub Secrets

---

## create-project.js

Cria um novo projeto Gaqno com UI (MFE) e/ou Service (NestJS).

### Modo interativo (recomendado)

Sem argumentos, o script abre uma interface interativa no terminal:

```bash
npm run create-project
```

Serão solicitados: nome do projeto, tipo (frontend / backend / ambos), portas e se deve rodar `npm install` ao final.

### Uso em linha de comando

```bash
npm run create-project -- <nome> [opções]
```

Ou forçar o modo interativo com `-i` ou `--interactive` mesmo tendo outros argumentos.

### Parâmetros

- **--type=frontend | backend | both** (default: both) — Cria só o frontend (gaqno-{nome}-ui), só o backend (gaqno-{nome}-service), ou os dois.
- **--ui-port=3XXX** — Porta do dev server da UI (default: 3011).
- **--service-port=4XXX** — Porta do service NestJS (default: 4011).
- **--install** — Executa `npm install --legacy-peer-deps` em cada pacote criado.

### Exemplos

```bash
# Projeto "inventory" completo (UI + Service) com portas padrão
npm run create-project -- inventory

# Apenas frontend
npm run create-project -- inventory --type=frontend

# Apenas backend
npm run create-project -- inventory --type=backend

# Com portas customizadas
npm run create-project -- inventory --ui-port=3012 --service-port=4012

# Com instalação automática de dependências
npm run create-project -- inventory --install
```

### Estrutura criada

**gaqno-{nome}-ui** (padrão frontend):

- Vite + React + Module Federation
- Tailwind CSS
- @gaqno-development/frontcore
- Estrutura: `src/{components,hooks,lib,pages,types,utils,config}`

**gaqno-{nome}-service** (padrão backend):

- NestJS 11
- ConfigModule global
- Estrutura: `src/{app.module,main}`

### Próximos passos após criar

1. `npm install` (na raiz ou em cada pacote)
2. Adicionar `MFE_{NOME}_URL` no `gaqno-shell-ui/vite.config.ts`
3. Adicionar rotas `/{nome}/*` no `gaqno-shell-ui/src/App.tsx`
4. Adicionar `VITE_SERVICE_{NOME}_URL` nas variáveis de ambiente do frontend
5. Adicionar scripts `dev:{nome}` e `dev:{nome}-service` no `package.json` raiz

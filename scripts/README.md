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

Cria um novo projeto Gaqno com UI (MFE) e Service (NestJS).

### Uso

```bash
npm run create-project -- <nome> [opções]
```

### Exemplos

```bash
# Projeto "inventory" com portas padrão (UI: 3011, Service: 4011)
npm run create-project -- inventory

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

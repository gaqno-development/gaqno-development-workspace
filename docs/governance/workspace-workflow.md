# Workspace Workflow

**Purpose:** Fluxo de desenvolvimento com PRs e CI por repositório individual.

---

## Regra principal: Workflows em cada projeto

**GitHub Actions estão em cada repositório** (ex: `gaqno-rpg-ui/.github/workflows/`).

| Contexto                                 | Actions disparam?                    |
| ---------------------------------------- | ------------------------------------ |
| Push/PR em **gaqno-rpg-ui**              | ✅ Sim (no gaqno-rpg-ui)             |
| Push/PR em **gaqno-admin-service**       | ✅ Sim (no gaqno-admin-service)      |
| Push no workspace (apenas submodule ref) | ❌ Não (workspace não tem workflows) |

### Por quê?

- Jira: status **Fazendo** = PR aberta; filtro "Fazendo" ou "Fazendo com PRs" para code review (ver [../integrations/github-jira.md](../integrations/github-jira.md))
- Jira abre PR no repositório individual (ex: gaqno-rpg-ui)
- Cada projeto tem CI, branch validation e PR validation próprios
- Fluxo: trabalhar no workspace → push no repo individual → abrir PR no repo individual

---

## Hierarquia: Epic → Story → Subtask (branches e commits)

Toda peça de trabalho DEVE pertencer à hierarquia Jira: **Epic → Story → Subtask**.

### Convenção de branches

| Nível     | Padrão da branch   | Base              | Propósito                                       |
| --------- | ------------------ | ----------------- | ----------------------------------------------- |
| **Epic**  | `epic/GAQNO-XXXX`  | `main`            | Branch de release; agrega histórias concluídas  |
| **Story** | `story/GAQNO-XXXX` | `epic/GAQNO-YYYY` | Branch de feature; contém commits de subtarefas |
| **Bug**   | `GAQNO-XXXX`       | `main`            | Hotfix; só número do ticket, sem prefixo        |

- **Branch do épico** (`epic/GAQNO-XXXX`): Criada uma vez por épico. É a branch de release. Histórias fazem merge NESTA branch quando concluídas. A branch do épico faz merge em `main` quando a release está pronta.
- **Branch da história** (`story/GAQNO-XXXX`): Criada a partir da branch do épico. Cada história tem sua branch. Contém N commits, um por subtarefa. Quando pronta, abre-se PR com base = `epic/GAQNO-YYYY` (épico pai).
- **Branch de bug** (`GAQNO-XXXX`): Criada a partir de `main`. Sem prefixo, só número do ticket. PR base = `main`.

### Convenção de commits

Cada commit numa branch de história corresponde a exatamente UMA subtarefa:

```
GAQNO-XXXX type: descrição
```

Onde:

- `GAQNO-XXXX` = chave da **Subtarefa** (NUNCA a chave da Story ou Epic)
- `type` = `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `style`, `perf`
- Um commit por subtarefa. NÃO combine subtarefas em um único commit.

### Exemplo

Epic GAQNO-1159 (AI Content & Video Engine), histórias 1160–1169:

```
main
 └── epic/GAQNO-1159  (release)
      ├── story/GAQNO-1160  (Story: AI MFE integration)
      │    ├── GAQNO-1170 feat: add retail content engine to AI MFE
      │    ├── GAQNO-1171 chore: configure env vars for content API
      │    ├── GAQNO-1172 fix: resolve SSO token refresh
      │    └── GAQNO-1173 refactor: extract content service
      │    └── PR: story/GAQNO-1160 → epic/GAQNO-1159
      │
      ├── story/GAQNO-1161  (Story: SSO service integration)
      │    ├── GAQNO-1174 feat: add SSO endpoint for content auth
      │    ├── GAQNO-1175 test: add SSO content auth tests
      │    ├── GAQNO-1176 chore: update SSO config for content
      │    └── GAQNO-1177 docs: update SSO API documentation
      │    └── PR: story/GAQNO-1161 → epic/GAQNO-1159
      │
      └── (all stories merged) → PR: epic/GAQNO-1159 → main
```

### Base do PR

| Tipo de branch     | Base do PR                              |
| ------------------ | --------------------------------------- |
| `story/GAQNO-XXXX` | `epic/GAQNO-YYYY` (branch do épico pai) |
| `epic/GAQNO-XXXX`  | `main` (quando a release está pronta)   |
| `GAQNO-XXXX` (bug) | `main`                                  |

---

## Processo de desenvolvimento

1. **Clonar e abrir o workspace**

   ```bash
   git clone <workspace-repo-url>
   cd gaqno-development-workspace
   ```

2. **Trabalhar dentro do workspace**
   - Editar código em `gaqno-rpg-ui/`, `gaqno-finance-ui/`, etc.
   - Commits e pushes feitos no repo onde houve alteração

3. **Push para branch no repo alterado**

   ```bash
   cd gaqno-rpg-ui
   git add .
   git commit -m "GAQNO-1170 feat: add retail content engine"
   git push origin story/GAQNO-1160
   ```

4. **Abrir PR no repositório individual (não no workspace)**
   - Alterou `gaqno-rpg-ui/` → abrir PR em **gaqno-development/gaqno-rpg-ui**
   - Alterou `gaqno-ai-service/` → abrir PR em **gaqno-development/gaqno-ai-service**
   - Alterou **@gaqno-frontcore/** → abrir PR em **gaqno-development/gaqno-frontcore**; após merge, publicar: `cd @gaqno-frontcore && npm publish` ou `./publish-packages.sh`
   - Alterou **@gaqno-backcore/** → abrir PR em **gaqno-development/gaqno-backcore**; após merge, publicar a partir do repo do pacote
   - Alterou **@gaqno-types/** → abrir PR em **gaqno-development/gaqno-types**; após merge, publicar a partir do repo do pacote
   - Alterou só raiz do workspace (docs, scripts) → abrir PR em **gaqno-development/gaqno-development-workspace**
   - Story PR: `cd gaqno-rpg-ui && gh pr create --base epic/GAQNO-1159 --head story/GAQNO-1160 --title "GAQNO-1160 AI MFE integration"`
   - Bug PR: `cd gaqno-rpg-ui && gh pr create --base main --head GAQNO-1152 --title "GAQNO-1152 fix: DevOps hotfix"`
   - CI e validações disparam no próprio repo

---

## Pacotes compartilhados (@gaqno-frontcore, @gaqno-backcore, @gaqno-types)

**Todos os `@gaqno-*` são pacotes no GitHub:** cada um tem seu próprio repositório em gaqno-development (gaqno-frontcore, gaqno-backcore, gaqno-types). No workspace eles são npm workspaces; para abrir PR de alterações num pacote, use o repo GitHub correspondente.

O fluxo correto é: **PR no repositório do pacote** (ex.: gaqno-development/gaqno-frontcore), **não no workspace**. Após merge, publicar o pacote (`npm publish` no diretório do pacote ou `./publish-packages.sh` na raiz do workspace).

Se o pacote ainda **não for um submodule** (não estiver em `.gitmodules`), para passar a usar esse fluxo: (1) crie o repositório no GitHub (ex.: gaqno-frontcore); (2) no workspace, envie o conteúdo do pacote para esse repo e adicione como submodule: `git submodule add <url> @gaqno-frontcore`; (3) a partir daí, commits e push são feitos dentro de `@gaqno-frontcore`, e a PR é aberta no repo do pacote.

## Scripts

- **push-all.sh** — Faz commit e push em todos os repos com alterações (cada um dispara seu próprio CI). Lista de repos vem de `.gitmodules` ou da lista fixa (não inclui @gaqno-frontcore até ser submodule).
- **publish-packages.sh** — Publica @gaqno-frontcore (e outros pacotes) no registry (npm/GitHub Packages).
- **scripts/copy-workflows-to-repos.sh** — Copia workflows (ci.yml, branch-pr-validation.yml) para todos os repos

---

## Workflows por repo

Cada repo possui em `.github/workflows/`:

- **ci.yml** — lint, test, build em push/PR
- **branch-pr-validation.yml** — valida nome da branch e título do PR (padrão GAQNO-XX)
- **pr-agent.yml** — [PR-Agent](https://github.com/qodo-ai/pr-agent): code review por IA (requer `OPENAI_KEY` em GitHub Secrets)

---

## Referências

- [../runbooks/dev-run.md](../runbooks/dev-run.md) — Como rodar o ambiente
- [../integrations/github-jira.md](../integrations/github-jira.md) — Integração GitHub–Jira

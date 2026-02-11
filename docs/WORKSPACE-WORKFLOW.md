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

- Jira: status **Fazendo** = PR aberta; filtro “Fazendo” ou “Fazendo com PRs” para code review (ver [GITHUB-JIRA-INTEGRATION.md](./GITHUB-JIRA-INTEGRATION.md))
- Jira abre PR no repositório individual (ex: gaqno-rpg-ui)
- Cada projeto tem CI, branch validation e PR validation próprios
- Fluxo: trabalhar no workspace → push no repo individual → abrir PR no repo individual

---

## Epic vs História: branches de release

- **Épico** (ex.: GAQNO-1113): tem uma **branch de release** (ex.: `feature/GAQNO-1113` ou `release/GAQNO-1113`) que agrega todas as **histórias concluídas**.
- **História** (ex.: GAQNO-1117, GAQNO-1123): cada uma tem sua **própria branch** com seus commits (ex.: `feature/GAQNO-1117`, `feature/GAQNO-1123`).
- A branch do épico é atualizada fazendo **merge** (ou rebase) das branches das histórias já finalizadas; assim, a release do épico contém o resultado de todas as histórias com seus commits dentro.

Exemplo: épico 1113 com histórias 1117 (concluída) e 1123 (em andamento). A branch `feature/GAQNO-1113` recebe o merge de `feature/GAQNO-1117`; quando 1123 for concluída, recebe também o merge de `feature/GAQNO-1123`.

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
   git commit -m "GAQNO-XX descrição"
   git push origin feature/GAQNO-XX-...
   ```

4. **Abrir PR no repositório individual (não no workspace)**
   - Alterou `gaqno-rpg-ui/` → abrir PR em **gaqno-development/gaqno-rpg-ui**
   - Alterou `gaqno-ai-service/` → abrir PR em **gaqno-development/gaqno-ai-service**
   - Alterou **@gaqno-frontcore/** → abrir PR em **gaqno-development/gaqno-frontcore**; após merge, publicar: `cd @gaqno-frontcore && npm publish` ou `./publish-packages.sh`
   - Alterou **@gaqno-backcore/** → abrir PR em **gaqno-development/gaqno-backcore**; após merge, publicar a partir do repo do pacote
   - Alterou **@gaqno-types/** → abrir PR em **gaqno-development/gaqno-types**; após merge, publicar a partir do repo do pacote
   - Alterou só raiz do workspace (docs, scripts) → abrir PR em **gaqno-development/gaqno-development-workspace**
   - Ex.: `cd gaqno-rpg-ui && gh pr create --base main --head feature/GAQNO-XX-... --title "GAQNO-XX Descrição"`
   - Para pacotes (quando forem submodule): `cd @gaqno-frontcore && gh pr create --base main --head feature/GAQNO-XX-... --title "GAQNO-XX Descrição"`
   - CI e validações disparam no próprio repo

---

## Pacotes compartilhados (@gaqno-frontcore, @gaqno-backcore, @gaqno-types)

**Todos os `@gaqno-*` são pacotes no GitHub:** cada um tem seu próprio repositório em gaqno-development (gaqno-frontcore, gaqno-backcore, gaqno-types). No workspace eles são npm workspaces; para abrir PR de alterações num pacote, use o repo GitHub correspondente abaixo.

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

- [DEV-RUN.md](./DEV-RUN.md) — Como rodar o ambiente
- [GITHUB-JIRA-INTEGRATION.md](./GITHUB-JIRA-INTEGRATION.md) — Integração GitHub–Jira

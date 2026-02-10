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

## Epic vs História: branches de release

- **Épico** (ex.: GAQNO-1159): tem uma **branch de release** (ex.: `GAQNO-1159`) que agrega as branches das **histórias** concluídas. Não se usa a branch do épico para commits do dia a dia. **Não vincule branch nem PR ao épico** até todas as histórias estarem concluídas; o épico só recebe a branch de release quando todas as histórias estiverem fechadas. O painel Desenvolvimento do épico pode continuar mostrando PRs vindos do app GitHub for Jira (dos filhos); isso é controlado pelo app, não por links remotos do Jira.
- **História** (ex.: GAQNO-1160 … GAQNO-1169): cada uma tem sua **própria branch** (ex.: `GAQNO-1160`). O nome da branch é sempre o número da **história**.
- **Commits na branch da história = subtarefas** dessa história. Cada história tem 4 subtarefas; cada subtarefa vira um commit na branch da história, com a chave da **subtask** na mensagem (ex.: GAQNO-1170, GAQNO-1171, GAQNO-1172, GAQNO-1173 na branch `GAQNO-1160`).
- A branch do épico é atualizada fazendo **merge** das branches das histórias já finalizadas.

Exemplo — Epic GAQNO-1159 (AI Content & Video Engine), histórias 1160–1169:

- Branch `GAQNO-1160` → commits: `GAQNO-1170`, `GAQNO-1171`, `GAQNO-1172`, `GAQNO-1173` (4 subtarefas).
- Branch `GAQNO-1161` → commits: `GAQNO-1174`, `GAQNO-1175`, `GAQNO-1176`, `GAQNO-1177`.
- Branch `GAQNO-1159` (release) recebe merge de `GAQNO-1160`, depois de `GAQNO-1161`, etc.

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
   - Alterou só raiz do workspace (docs, scripts) → abrir PR em **gaqno-development/gaqno-development-workspace**
   - Ex.: `cd gaqno-rpg-ui && gh pr create --base main --head feature/GAQNO-XX-... --title "GAQNO-XX Descrição"`
   - Para pacotes (quando forem submodule): `cd @gaqno-frontcore && gh pr create --base main --head feature/GAQNO-XX-... --title "GAQNO-XX Descrição"`
   - CI e validações disparam no próprio repo

---

## Pacotes compartilhados (@gaqno-frontcore, @gaqno-backcore)

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

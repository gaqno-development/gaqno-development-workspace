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

- Jira abre PR no repositório individual (ex: gaqno-rpg-ui)
- Cada projeto tem CI, branch validation e PR validation próprios
- Fluxo: trabalhar no workspace → push no repo individual → abrir PR no repo individual

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
   git commit -m "KAN-XX descrição"
   git push origin feature/KAN-XX-...
   ```

4. **Abrir PR no repositório individual**
   - Ex: https://github.com/gaqno-development/gaqno-rpg-ui/pull/new/feature/KAN-XX-...
   - CI e validações disparam no próprio repo

---

## Scripts

- **push-all.sh** — Faz commit e push em todos os repos com alterações (cada um dispara seu próprio CI)
- **scripts/copy-workflows-to-repos.sh** — Copia workflows (ci.yml, branch-pr-validation.yml) para todos os repos

---

## Workflows por repo

Cada repo possui em `.github/workflows/`:

- **ci.yml** — lint, test, build em push/PR
- **branch-pr-validation.yml** — valida nome da branch e título do PR (padrão KAN-XX)
- **pr-agent.yml** — [PR-Agent](https://github.com/qodo-ai/pr-agent): code review por IA (requer `OPENAI_KEY` em GitHub Secrets)

---

## Referências

- [DEV-RUN.md](./DEV-RUN.md) — Como rodar o ambiente
- [GITHUB-JIRA-INTEGRATION.md](./GITHUB-JIRA-INTEGRATION.md) — Integração GitHub–Jira

# Workspace Workflow

**Purpose:** Define o fluxo de desenvolvimento centrado no workspace para garantir que GitHub Actions disparem em todos os módulos.

---

## Regra principal: Push apenas pelo workspace

**GitHub Actions só disparam quando commits e pushes são feitos a partir do `gaqno-development-workspace`.**

| Contexto                                                            | Actions disparam? |
| ------------------------------------------------------------------- | ----------------- |
| Push via **workspace** (gaqno-development-workspace)                | ✅ Sim            |
| Push direto em repositório individual (ex: gaqno-rpg-ui standalone) | ❌ Não            |

### Por quê?

- Os workflows estão em `.github/workflows/` no **root do workspace**
- O workspace é o repositório principal que contém os módulos (MFEs, services)
- Pushes feitos em clones isolados dos submódulos não acionam os workflows do workspace

---

## Processo de desenvolvimento obrigatório

1. **Clonar e abrir o workspace**

   ```bash
   git clone <workspace-repo-url>
   cd gaqno-development-workspace
   ```

2. **Trabalhar dentro do workspace**
   - Editar código em `gaqno-rpg-ui/`, `gaqno-finance-ui/`, etc.
   - Commits e pushes feitos a partir do workspace

3. **Push para branches**

   ```bash
   git add .
   git commit -m "KAN-XX descrição"
   git push origin feature/KAN-XX-...
   ```

4. **Actions disparam automaticamente** no repositório do workspace

---

## Consequências

| Ação                 | Resultado                                                     |
| -------------------- | ------------------------------------------------------------- |
| Push via workspace   | CI, branch validation, PR gatekeeper, self-healing etc. rodam |
| Push em repo isolado | Nenhum workflow dispara                                       |

---

## Scripts

- **push-all.sh** — Faz commit e push em todos os submódulos a partir do workspace (dispara Actions)

## Referências

- [DEV-RUN.md](./DEV-RUN.md) — Como rodar o ambiente
- [GITHUB-JIRA-INTEGRATION.md](./GITHUB-JIRA-INTEGRATION.md) — Integração GitHub–Jira
- [.github/workflows/](../.github/workflows/) — Workflows do workspace

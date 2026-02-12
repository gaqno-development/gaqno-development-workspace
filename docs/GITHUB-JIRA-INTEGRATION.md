# GitHub–Jira Integration

**Purpose:** Ensure PRs, branches, and commits appear in Jira’s Development panel, and quickly see **Fazendo** issues with open PRs (code review queue).

---

## 0. Onde abrir a PR (obrigatório)

**A PR deve ser aberta no repositório do componente que você alterou**, não no `gaqno-development-workspace`.

| Onde você alterou                               | Onde abrir a PR                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `gaqno-rpg-ui/`                                 | [gaqno-development/gaqno-rpg-ui](https://github.com/gaqno-development/gaqno-rpg-ui) |
| `gaqno-finance-ui/`, `gaqno-ai-ui/`, etc.       | `gaqno-development/gaqno-<nome-do-app>` (o mesmo repo da pasta)                     |
| `gaqno-rpg-service/`, `gaqno-ai-service/`, etc. | `gaqno-development/gaqno-<nome-do-service>`                                         |
| Só scripts raiz, `docs/`, config do workspace   | `gaqno-development/gaqno-development-workspace`                                     |

- Você **trabalha** no workspace (clone único, edita em `gaqno-rpg-ui/`, etc.).
- Você faz **push** na pasta do repo (ex.: `cd gaqno-rpg-ui && git push origin feature/GAQNO-XX-...`).
- Você **abre a PR** no GitHub **desse repo** (ex.: gaqno-rpg-ui), não no workspace.

Assim o CI e o app GitHub for Jira rodam no repo correto. Ver [WORKSPACE-WORKFLOW.md](./WORKSPACE-WORKFLOW.md).

---

## Fazendo com PRs (fila de code review)

Use o status **Fazendo** para itens com PR aberta aguardando review. Para ver só esses itens:

1. **Filtro salvo no Jira**  
   Busca avançada (JQL) → cole a JQL abaixo → **Salvar como** (ex.: _PRs pendentes de Code Review_) → adicionar aos **Favoritos**.

2. **JQL recomendada**

   ```text
   project = GAQNO AND status = "Fazendo" ORDER BY updated DESC
   ```

   Para filtrar apenas issues que já têm PR vinculada (quando o app GitHub estiver conectado):

   ```text
   project = GAQNO AND status = "Fazendo" AND development[pullrequests].open > 0 ORDER BY updated DESC
   ```

3. **Board**  
   Crie um board (Kanban) baseado nesse filtro para ver **Fazendo** em coluna única com PRs.

4. **Confluence**  
   Guia completo (campo Code Review, outras JQLs): [Jira: Campo Code Review e PRs Pendentes de Aprovação](https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/98308).

---

## 1. Confirm integration

1. In Jira: **Apps** → **Manage your apps** → **GitHub for Atlassian**
2. Check that your GitHub org is listed and connected
3. Open any issue (e.g. GAQNO-32) and look for the **Development** panel

---

## 2. Setup (if not connected)

1. **Apps** → **Explore more apps** → search **GitHub for Atlassian** → **Get app**
2. **Get started** → **GitHub Cloud** → sign in to GitHub
3. Select the org (e.g. `gaqno`) → **Connect**
4. Choose **All repositories** or **Only select repositories**
5. **Install** and complete the flow

---

## 3. Link development info to issues

Include the Jira key in:

| Action         | Example                                               |
| -------------- | ----------------------------------------------------- |
| Branch name    | `feature/GAQNO-32-migrate-finance-ui-api-client`      |
| Commit message | `GAQNO-32 Add createAxiosClient usage`                |
| PR title       | `GAQNO-32 Migrate finance-ui to frontcore API client` |

After pushing, the **Development** panel on the issue will show branches, commits, and PRs. Issues in **Fazendo** with a linked PR will appear in the “Fazendo com PRs” filter/board.

---

## 3.1 Se branch ou PR não aparecer no Development

Se o app **GitHub for Atlassian** não estiver conectado ao repositório (ex.: `gaqno-development-workspace`) ou o painel **Development** continuar vazio:

1. No Jira, abra o issue → **Links** (ou Development, conforme o layout).
2. **Link** → **Link issue** → preencha:
   - **Link type:** Web link (ou outro disponível).
   - **Title:** `Branch: feature/GAQNO-XX-nome-da-branch` ou `PR #N – GAQNO-XX`.
   - **URL:**
     - Branch: `https://github.com/gaqno-development/<repo>/tree/feature/GAQNO-XX-...`
     - PR: `https://github.com/gaqno-development/<repo>/pull/N`

Assim o card em **Fazendo** continua com link clicável para a branch e para a PR mesmo sem o app preencher o Development.

---

## 3.2 Story + subtarefas: branch da história, commits por subtarefa

Quando a branch é da **história** (ex.: `feature/GAQNO-1123`) e cada commit referencia uma **subtarefa** (ex.: GAQNO-1146, GAQNO-1147, GAQNO-1148):

- **Branch** → aparece no issue cuja key está no **nome da branch** (ex.: GAQNO-1123).
- **Cada commit** → aparece no issue cuja key está na **primeira linha da mensagem** (ex.: `GAQNO-1146 ...`, `GAQNO-1147 ...`).

Se só um commit ou só a branch aparecer no painel Development:

1. **Backfill manual** (recomendado): o app pode ter indexado só parte dos commits na primeira sincronização.
   - Jira: **Apps** → **Manage apps** → **GitHub for Atlassian**.
   - Clique na organização GitHub → engrenagem (settings) → **Continue backfill**.
   - Escolha a data (ex.: início da branch) → **Backfill data**. Opcional: marque **Restart the backfill** só se quiser reimportar tudo.
   - Ref: [Backfill GitHub data in Jira](https://support.atlassian.com/jira-cloud-administration/docs/understand-github-for-jiras-initial-backfill-process/).
2. **Aguardar** alguns minutos e atualizar a página do issue (sync pode ser assíncrono).
3. **Link manual**: no issue (ex.: GAQNO-1123 ou GAQNO-1147), **Development** → **Link** → informar URL da branch ou do commit no GitHub.

---

## 4. References

- [Connect GitHub Cloud to Jira](https://support.atlassian.com/jira-cloud-administration/docs/integrate-with-github/)
- [Link GitHub development information to Jira work items](https://support.atlassian.com/jira-cloud-administration/docs/use-the-github-for-jira-app/)

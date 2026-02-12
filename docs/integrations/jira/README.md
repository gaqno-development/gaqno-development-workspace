# Jira (GAQNO)

Projeto único do workspace: **GAQNO**. Boards, épicos, histórias e tarefas: https://gaqno.atlassian.net/browse/GAQNO

---

## Epic → Story → Subtask (Git, GAQNO)

Para épicos com histórias e subtarefas (ex.: Epic **GAQNO-1159** — AI Content & Video Engine):

- **Epic** (GAQNO-1159): branch de **release**; recebe merge das branches das histórias. Não usar como branch de trabalho.
- **Histórias** (GAQNO-1160 até GAQNO-1169): cada história = **uma branch** com o número da história (ex.: `GAQNO-1160`).
- **Subtarefas** = **commits** na branch da história. Cada história tem 4 subtarefas; cada commit usa a chave da **subtask** na mensagem.

Exemplo: branch `GAQNO-1160` tem os commits `GAQNO-1170`, `GAQNO-1171`, `GAQNO-1172`, `GAQNO-1173`.  
Detalhes: `.cursor/agents/commit-and-workflow-agent.md` (regra EPIC → STORY BRANCH → SUBTASK COMMITS) e [../../governance/workspace-workflow.md](../../governance/workspace-workflow.md).

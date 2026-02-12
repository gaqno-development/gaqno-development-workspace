# Estrutura de JIRA — Espaços (Projetos) e Painéis (Dashboards)

Referência de estrutura que escala com produto + engenharia + operação.

---

## Princípios

1. **Poucos projetos, bem definidos**
2. **Dashboards por papel (role), não por pessoa**
3. **Tudo que é recorrente vira painel**

---

## 1. Estrutura de Espaços / Projetos no JIRA

No JIRA, "Espaço" normalmente = **Projeto**. Projeto atual no workspace: **GAQNO** (Gaqno Development — onde estão os boards de trabalho: Épicos, Histórias, Desenvolvimento; ver [README.md](README.md) § 3 boards no GAQNO). Ver [README.md](README.md) e [CENARIO-PROJ-SaaS-MF.md](CENARIO-PROJ-SaaS-MF.md).

### Visão macro (recomendada)

```text
CORE
PLATFORM
PROD-APP
OPS
```

---

## Projetos sugeridos

### CORE — Domínios de negócio

Módulos principais do produto.

Exemplo:

```text
CORE-PAY   → Pagamentos
CORE-AUTH  → Autenticação / SSO
CORE-FIN   → Financeiro
CORE-CAT   → Catálogo
```

Quando usar: feature de negócio, roadmap de produto, épicos duradouros.

---

### PLATFORM — Infra / Arquitetura / DevEx

Tudo que não é feature direta para usuário.

Exemplo:

```text
PLAT-INFRA   → CI/CD, Kubernetes, VPS
PLAT-SEC     → Segurança
PLAT-OBS     → Observabilidade
PLAT-ARCH    → Refactors estruturais
```

---

### PROD-APP — Aplicações finais

Frontend, mobile, microfrontends.

Exemplo:

```text
APP-WEB     → Web App
APP-ADMIN   → Admin
APP-MOBILE  → Mobile
```

---

### OPS — Operação e Suporte

Incidentes e demandas rápidas.

Exemplo:

```text
OPS-SUP    → Suporte
OPS-INC    → Incidentes
OPS-BUG    → Bugs em produção
```

---

## 2. Tipos de Painéis (Dashboards)

Regra geral: **um painel por papel**.

### Painel: Produto / PO

Objetivo: visão de valor e entrega.

Widgets: Roadmap por Épico, Histórias por status, Burndown por sprint, Features entregues por período.

Foco: o que está pronto, o que atrasou, dependências.

---

### Painel: Time de Engenharia

Objetivo: trabalho do dia a dia.

Widgets: Minhas issues, Issues por status, PRs abertos (integração Git), Subtasks bloqueadas.

Foco: fluxo, gargalos, Pull Requests.

---

### Painel: Tech Lead / Arquiteto

Objetivo: qualidade e saúde técnica.

Widgets: Débito técnico por módulo, Bugs abertos vs fechados, Tempo médio em Code Review, Issues sem atividade.

---

### Painel: Operação / SRE

Objetivo: estabilidade e resposta rápida.

Widgets: Incidentes abertos, SLA / SLO, Bugs críticos, Deploys recentes.

---

### Painel: Liderança / Gestão

Objetivo: visão executiva.

Widgets: Épicos por status, Lead time médio, Throughput por sprint, Incidentes por período.

---

## 3. Padrão de Filtros (base de tudo)

Os exemplos de JQL abaixo usam `Done` para status concluído; se o projeto estiver em português, use `"Feito"` onde aparecer `Done`.

Convenção de filtros:

```text
[CORE] Epics Ativos
[APP] Histórias em QA
[OPS] Incidentes Críticos
[PLAT] Débito Técnico
```

Crie filtros **globais e reutilizáveis**, não filtros por dashboard.

---

## 4. Labels e Componentes (governança)

### Labels (uso livre, mas controlado)

`frontend`, `backend`, `infra`, `security`, `performance`

### Componentes

Representar **módulos reais**. Exemplo (CORE-PAY): `api`, `worker`, `webhook`, `database`. Alimenta métricas e dashboards.

---

## 5. Estrutura recomendada (resumo visual)

```text
JIRA
├── CORE (negócio)
│   ├── Epics (módulos)
│   └── Histórias + Subtasks
│
├── PLATFORM (infra/devex)
│
├── APP (frontends)
│
└── OPS (incidentes/bugs)
```

---

## 6. Exemplo de dashboards com JQL (GAQNO)

Os **3 boards** (71 Épicos, 72 Histórias, 73 Desenvolvimento) devem usar colunas alinhadas ao fluxo: **A fazer → Fazendo → (Em revisão) → Feito**. Ver [README.md](README.md) § 3 boards — _Colunas recomendadas (fluxo de desenvolvimento)_ para o mapeamento por board.

Usar um filtro por gadget; nome do filtro entre colchetes ajuda a achar no Jira.

### [GAQNO] Produto / PO

- Épicos ativos (roadmap):  
  `project = GAQNO AND issuetype = Epic AND status IN ("A fazer", "Fazendo") ORDER BY rank ASC`
- Histórias por status:  
  `project = GAQNO AND issuetype = Story ORDER BY status ASC, updated DESC`
- Tarefas em andamento:  
  `project = GAQNO AND issuetype = Task AND status = "Fazendo" ORDER BY updated DESC`

### [GAQNO] Engenharia

- Minhas issues:  
  `project = GAQNO AND assignee = currentUser() AND status != Done ORDER BY updated DESC`
- Fila Fazendo (code review):  
  `project = GAQNO AND status = "Fazendo" ORDER BY updated DESC`
- Com PR aberta (requer GitHub for Jira):  
  `project = GAQNO AND status = "Fazendo" AND development[pullrequests].open > 0 ORDER BY updated DESC`

### [GAQNO] Tech Lead / Arquiteto

- Débito técnico (label):  
  `project = GAQNO AND labels = debito-tecnico AND status != Done ORDER BY priority DESC`
- Bugs abertos:  
  `project = GAQNO AND issuetype = Bug AND status != Done ORDER BY priority DESC`
- Sem atividade há 7 dias:  
  `project = GAQNO AND updated < -7d AND status != Done ORDER BY updated ASC`
  (Se o projeto usar status em português: `status NOT IN ("Feito", "Tarefas pendentes")`.)

### [GAQNO] Operação / SRE

- Bugs em produção (label `producao`; ajuste ao fluxo):  
  `project = GAQNO AND issuetype = Bug AND labels = producao ORDER BY priority DESC`

### [GAQNO] Liderança

- Épicos por status:  
  `project = GAQNO AND issuetype = Epic ORDER BY status ASC, updated DESC`
- Resumo de issues (todos os tipos):  
  `project = GAQNO ORDER BY issuetype ASC, status ASC, updated DESC`

Crie cada JQL como **Filtro** salvo (nome entre colchetes); no dashboard use o gadget **Resultados de filtro** e escolha o filtro. Assim o mesmo filtro serve a vários painéis. Para criar todos de uma vez no GAQNO: `node scripts/jira-create-proj-filters-dashboards.mjs` (ver [scripts/README.md](../scripts/README.md)). No Cursor, o **MCP Jira** (Atlassian) permite executar essas JQLs diretamente (busca por filtro, listagem de issues) sem abrir o Jira na web.

---

## 7. Governança

### Quem pode criar o quê

| Ação                             | Responsável                                    |
| -------------------------------- | ---------------------------------------------- |
| Novo projeto (CORE/PLAT/APP/OPS) | Admin Jira / gestor de produto                 |
| Épico                            | PO / Tech Lead                                 |
| História / Task                  | Qualquer membro do projeto                     |
| Filtro global                    | Qualquer um; preferir nome [PROJETO] Descrição |
| Dashboard compartilhado          | Criador compartilha com projeto ou grupo       |

### Convenção de filtros

- Nome: `[PROJETO] Descrição curta` (ex.: `[GAQNO] Epics Ativos`, `[GAQNO] Fazendo`).
- Filtros globais e reutilizáveis; não duplicar JQL por dashboard.

### Labels e componentes

- **Labels:** uso livre mas controlado; preferir lista curta (`frontend`, `backend`, `infra`, `debito-tecnico`, `producao`).
- **Componentes:** um por módulo real (repo ou serviço). Criar no projeto e associar às issues; não criar componente por pessoa ou por sprint.

---

## Baías (status → fase)

Mapeamento de **status** do Jira para **baías** do fluxo (colunas / etapas de valor):

| Status      | Baía        |
| ----------- | ----------- |
| Discovery   | Pensar      |
| Ready       | Planejar    |
| In Progress | Executar    |
| At Risk     | Decidir     |
| Done        | Valor       |
| Cancelled   | Aprendizado |

Usar no workflow de Épicos (e, se desejado, de Histórias): configurar os status no esquema do projeto e mapear as colunas do board para essas baías.

---

## Discovery (Épicos em descoberta)

**Hoje (GAQNO):** os projetos CORE, PLATFORM, APP e o status **Discovery** não existem no Jira. Use **label** para marcar itens em descoberta. O board [Discovery (75)](https://gaqno.atlassian.net/jira/software/c/projects/GAQNO/boards/75) já usa este JQL:

```text
project = GAQNO AND labels = discovery ORDER BY rank ASC, updated DESC
```

Adicione a label **discovery** às issues (Épicos, Histórias, etc.) para elas aparecerem no board.

**Futuro (quando existirem CORE/PLATFORM/APP e o status Discovery no workflow):** aí sim usar:

```text
project IN (CORE, PLATFORM, APP) AND issuetype = Epic AND status = Discovery
```

Para isso ser válido é preciso: (1) criar os projetos CORE, PLATFORM, APP no Jira; (2) no esquema do projeto, adicionar o status **Discovery** ao workflow e mapear a coluna do board para a baía **Pensar**.

---

## Resultado

- Clareza por domínio
- Dashboards úteis (não decorativos)
- Base sólida para automação
- Escala sem caos

---

Ver também: [README.md](README.md) (GAQNO, componentes, hierarquia). [CENARIO-PROJ-SaaS-MF.md](CENARIO-PROJ-SaaS-MF.md) (mapeamento GAQNO ↔ CORE/PLAT/APP/OPS no cenário SaaS + MF). [REESTRUTURACAO-NAVEGACAO.md](REESTRUTURACAO-NAVEGACAO.md) (reestruturação Planejamento / Execução / Acompanhamento, filtros e dashboards por papel).

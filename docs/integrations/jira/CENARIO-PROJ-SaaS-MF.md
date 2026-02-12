# Cenário GAQNO — SaaS + microserviços + microfrontends

Mapeamento do workspace atual (projeto GAQNO + componentes por repo) para a estrutura CORE / PLATFORM / APP / OPS em [ESTRUTURA-ESPACOS-DASHBOARDS.md](ESTRUTURA-ESPACOS-DASHBOARDS.md).

---

## Situação atual

- **Projeto:** GAQNO (Gaqno Development) — único projeto Jira do workspace; épicos, histórias, tarefas e débito técnico.
- **Componentes = repositórios:** no GAQNO, cada `gaqno-*-ui`, `gaqno-*-service`, `@gaqno-frontcore`, `@gaqno-backcore` é um componente. Scripts: `jira-create-components.mjs`, `jira-create-components-and-assign.mjs` (default `JIRA_PROJECT_KEY=GAQNO`).

GAQNO concentra **PLATFORM (infra/arch/DevEx)** e as **applications (MFs + backends)** via componentes. Projetos CORE-PAY, CORE-AUTH, PLAT-INFRA, APP-WEB, OPS-INC ainda não existem.

---

## Mapeamento repos → eixo CORE / PLAT / APP

| Eixo              | Papel                    | Repos (componentes no GAQNO)                                                                                                                                                                               |
| ----------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **APP**           | Aplicações (frontends)   | gaqno-admin-ui, gaqno-ai-ui, gaqno-crm-ui, gaqno-erp-ui, gaqno-finance-ui, gaqno-landing-ui, gaqno-lenin-ui, gaqno-omnichannel-ui, gaqno-pdv-ui, gaqno-rpg-ui, gaqno-saas-ui, gaqno-shell-ui, gaqno-sso-ui |
| **APP / backend** | Serviços (microserviços) | gaqno-admin-service, gaqno-ai-service, gaqno-finance-service, gaqno-omnichannel-service, gaqno-pdv-service, gaqno-rpg-service, gaqno-saas-service, gaqno-sso-service                                       |
| **PLAT**          | Pacotes compartilhados   | @gaqno-frontcore, @gaqno-backcore                                                                                                                                                                          |
| **PLAT**          | Workspace (CI, monorepo) | gaqno-development-workspace                                                                                                                                                                                |

Domínios de negócio (CORE-PAY, CORE-AUTH, etc.) hoje não estão como projetos separados; as features vivem como épicos/tarefas no GAQNO com componente indicando o repo.

---

## Estratégia recomendada (curto prazo)

1. **Manter um único projeto GAQNO** para não fragmentar os boards nem a migração já feita.
2. **Usar componentes** para “onde” (repo): filtrar/agrupar por componente no board e nos dashboards (Produto, Engenharia, Tech Lead) como em [ESTRUTURA-ESPACOS-DASHBOARDS.md](ESTRUTURA-ESPACOS-DASHBOARDS.md) §6.
3. **Labels** para eixo quando precisar: ex. `frontend`, `backend`, `infra` (ou `plataforma`) para @gaqno-\*core e workspace.
4. **Filtros e dashboards por papel** já descritos no doc de estrutura; JQL usa `project = GAQNO` e opcionalmente `component` ou `labels`.

Assim você já segue a lógica CORE/PLAT/APP/OPS (valor × onde) sem criar vários projetos de uma vez.

---

## Quando evoluir para vários projetos (CORE / PLAT / APP / OPS)

Considerar novos projetos quando:

- Um domínio (ex.: Pagamentos, SSO) tiver roadmap e squad próprios e quiser board/backlog isolado.
- Operação quiser projeto só de incidentes/bugs (OPS-INC, OPS-BUG) com fluxo e SLA próprios.
- PLAT tiver tanto volume que um PLAT-ARCH ou PLAT-INFRA separado facilitar priorização.

Passos sugeridos:

1. Criar o novo projeto no Jira (ex.: CORE-PAY, OPS-INC).
2. Definir esquema de tipos (Epic, Story, Task, Bug) e componentes desse projeto.
3. Migrar ou linkar issues (move em massa ou link para manter histórico).
4. Replicar o padrão de filtros `[CORE-PAY] …` e dashboards por papel para o novo projeto.

---

## Resumo visual (hoje)

```text
GAQNO (projeto principal)
├── Épicos (valor / iniciativa)
├── Histórias (opcional; Epic Link)
├── Tasks (parent = Épico)
└── Componentes = repos
    ├── gaqno-*-ui          → APP (frontends)
    ├── gaqno-*-service     → APP (backends)
    ├── @gaqno-frontcore    → PLAT
    ├── @gaqno-backcore     → PLAT
    └── gaqno-development-workspace → PLAT
```

Quando criar OPS ou CORE/APP separados, cada um terá seu board e seus componentes; GAQNO pode virar só PLAT ou ser descontinuado conforme a organização do time.

Ver também: [README.md](README.md), [ESTRUTURA-ESPACOS-DASHBOARDS.md](ESTRUTURA-ESPACOS-DASHBOARDS.md).

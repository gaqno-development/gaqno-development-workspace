# Documentação — gaqno-development-workspace

Índice central da documentação, organizada por **contexto** e por **time** para fácil manutenção.

---

## Por contexto

| Pasta                            | Conteúdo                                                                      | Quando usar                                          |
| -------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| [architecture/](./architecture/) | Visão do sistema, frontend, backend, contratos de API, roadmap de refatoração | Entender desenho e regras de arquitetura             |
| [runbooks/](./runbooks/)         | Como rodar o ambiente, portas, variáveis, banco de dados                      | Subir stack, configurar dev, criar DBs               |
| [guides/](./guides/)             | Guias técnicos por stack (frontend, backend)                                  | Convenções de código, env, Module Federation, NestJS |
| [governance/](./governance/)     | TPM, fluxo de trabalho, agentes, revisão por agents                           | Processo de desenvolvimento, épicos, PRs             |
| [integrations/](./integrations/) | GitHub–Jira, Jira (espaços, automações), Confluence                           | Integrações e ferramentas de gestão                  |
| [data/](./data/)                 | Scripts SQL (pgAdmin, seeds por serviço)                                      | Criar DBs, seeds, referência de schemas              |
| [product/](./product/)           | Contratos e fundação de produto (AI, ERP)                                     | Conteúdo de produto e contratos de dados             |

---

## Por time

### Frontend

- [Arquitetura frontend](./architecture/README.md#frontend) (MFEs, Shell, frontcore)
- [Guia frontend](./guides/frontend.md) — env, Module Federation, Nginx, Coolify
- [Runbook: ambiente e portas](./runbooks/environment.md)
- [Runbook: rodar dev](./runbooks/dev-run.md)

### Backend

- [Arquitetura backend](./architecture/README.md#backend)
- [Guia backend](./guides/backend.md) — env por serviço, NestJS
- [Runbook: banco de dados](./runbooks/database.md)
- [Dados: seeds e pgAdmin](./data/README.md)

### DevOps / Infra

- [Runbooks](./runbooks/) — dev-run, environment, database
- [Dados](./data/) — scripts de DB, seeds
- [Integrações](./integrations/) — GitHub, Jira (opcional)

### Produto / TPM

- [Governança](./governance/) — TPM, traceability, workflow, agentes
- [Integrações](./integrations/) — Jira, Confluence
- [Produto](./product/) — contratos e conteúdo AI/ERP

---

## Manutenção

- Cada pasta tem um **README.md** com o índice dos arquivos e responsabilidade.
- Links entre documentos usam caminhos relativos (ex.: `../runbooks/environment.md`).
- Documentos publicados no Confluence têm fonte nesta árvore; ver [integrations/confluence/](./integrations/confluence/).

# Arquitetura

Visão do sistema, frontend, backend, contratos de API e roadmap de refatoração.

| Documento                                                      | Descrição                                                |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| [system-architecture-audit.md](./system-architecture-audit.md) | Auditoria de arquitetura: riscos, smells, recomendações  |
| [frontend-architecture.md](./frontend-architecture.md)         | MFEs, Shell, frontcore, convenções (fonte do Confluence) |
| [contracts-and-types.md](./contracts-and-types.md)             | Convenção API: snake_case vs camelCase, onde transformar |
| [refactoring-roadmap.md](./refactoring-roadmap.md)             | Passos executáveis a partir do audit                     |

**Frontend:** MFEs, Shell, Module Federation, @gaqno-frontcore — ver [frontend-architecture.md](./frontend-architecture.md) e [../guides/frontend.md](../guides/frontend.md).

**Backend:** NestJS, serviços por domínio, DB por serviço — ver [system-architecture-audit.md](./system-architecture-audit.md) e [../guides/backend.md](../guides/backend.md).

**Publicação:** Frontend Architecture e outros guias no Confluence (DDS): [DDS Overview](https://gaqno-development.atlassian.net/wiki/spaces/DDS/overview).

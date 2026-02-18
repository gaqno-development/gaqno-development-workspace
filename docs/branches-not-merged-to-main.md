# Análise: branches que ainda não subiram para main

**Data:** 2025-02-18  
**Contexto:** Trabalho direto na `main`; este documento lista branches (repositório raiz e submódulos) que ainda **não foram mergeadas** em `main` (ou seja, têm commits à frente de `main`).

---

## 1. Repositório raiz (gaqno-development-workspace)

Branches **remotas** em `origin` com commits que **não estão em main**:

| Branch | Commits à frente de main |
|--------|---------------------------|
| `GAQNO-1152` | 1 |
| `GAQNO-1262` | 2 |
| `feature/GAQNO-1117` | 3 |
| `feature/GAQNO-1123` | 1 |
| `feature/KAN-30-unify-types` | 4 |
| `feature/KAN-46-session-hooks` | 1 |
| `fix/section-subnav-collapse-visible` | 1 |

Branches **locais** com commits à frente de main (mesmo conjunto acima, onde existem localmente):  
`GAQNO-1152`, `GAQNO-1262`, `feature/GAQNO-1117`, `feature/GAQNO-1123`, `feature/KAN-46-session-hooks`.

---

## 2. Submódulos: branch atual vs main

Submódulos que estão **checkoutados em uma branch que não é main** (e quantos commits essa branch está à frente de `origin/main` no próprio repositório do submódulo):

| Submódulo | Branch atual | Commits à frente de origin/main |
|-----------|--------------|----------------------------------|
| gaqno-admin-service | `fix/GAQNO-1284-docker-legacy-peer-deps` | 1 |
| gaqno-admin-ui | `GAQNO-1284` | 6 |
| gaqno-ai-ui | `pr-6` | 9 |
| gaqno-erp-ui | `GAQNO-1262` | 4 |
| gaqno-finance-ui | `GAQNO-1162` | 9 |
| gaqno-landing-ui | `GAQNO-1262` | ? (sem origin/main) |
| gaqno-lenin-ui | `GAQNO-1262` | ? (sem origin/main) |
| gaqno-pdv-service | `chore/types-import-from-package` | 4 |
| gaqno-pdv-ui | `GAQNO-1262` | 5 |
| gaqno-rpg-service | `GAQNO-1262` | 7 |
| gaqno-rpg-ui | `GAQNO-1125` | 5 |
| gaqno-saas-service | `fix/GAQNO-1289-docker-ignore-scripts` | 4 |
| gaqno-saas-ui | `GAQNO-1262` | 6 |
| gaqno-sso-ui | `GAQNO-1262` | 4 |

Submódulos que **já estão em main**:  
gaqno-ai-service (master), gaqno-crm-ui, gaqno-finance-service, gaqno-omnichannel-service, gaqno-omnichannel-ui, gaqno-shell-ui, gaqno-sso-service.

---

## 3. Resumo executivo

- **Raiz:** 7 branches remotas ainda não mergeadas em main; as mais à frente são `feature/KAN-30-unify-types` (4) e `feature/GAQNO-1117` (3).
- **Submódulos:** 14 submódulos estão em branches de feature/fix; as com mais commits à frente de main no próprio repo são **gaqno-ai-ui** (pr-6, 9), **gaqno-finance-ui** (GAQNO-1162, 9), **gaqno-rpg-service** (GAQNO-1262, 7), **gaqno-admin-ui** (GAQNO-1284, 6) e **gaqno-saas-ui** (GAQNO-1262, 6).

Para incorporar trabalho ao fluxo “direto na main”: fazer merge (ou squash merge) da branch desejada em `main` no repositório correspondente e dar push; no workspace, atualizar o ponteiro do submódulo e commitar na raiz se necessário.

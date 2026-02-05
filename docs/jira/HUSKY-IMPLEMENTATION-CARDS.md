# Cards Jira — Implementação Husky

**Projeto:** KAN (gaqno-enviroment)  
**Status:** ✅ Criados via Jira API — 2025-02-05

---

## Epic

### KAN-16: Husky + Commitlint + Lint-staged — Git hooks setup

| Campo           | Valor                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**        | Epic                                                                                                                                                                                                                                                           |
| **Summary**     | Husky + Commitlint + Lint-staged — Git hooks setup                                                                                                                                                                                                             |
| **Description** | Implementação de Git hooks com Husky para garantir qualidade de commits e código. Escopo: Husky, Commitlint (conventional commits), Lint-staged, hooks pre-commit, commit-msg, pre-push. Confluence: https://gaqno.atlassian.net/wiki/spaces/GD/pages/15859713 |

---

## Stories (vinculadas ao Epic)

### KAN-21: commit-msg — Validação de mensagens de commit

| Campo                   | Valor                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tipo**                | Story                                                                                                                                                                                                        |
| **Summary**             | commit-msg — Validação de mensagens de commit                                                                                                                                                                |
| **Description**         | Hook commit-msg: valida formato conventional commits via commitlint. Tipos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. Header max 100 chars. Subject sem PascalCase/upper-case. |
| **Acceptance Criteria** | - .husky/commit-msg existe; npx commitlint --edit $1; commitlint.config.js com regras convencionais                                                                                                          |

---

### KAN-22: pre-commit — Lint-staged e lint em pacotes afetados

| Campo                   | Valor                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Tipo**                | Story                                                                                                          |
| **Summary**             | pre-commit — Lint-staged e lint em pacotes afetados                                                            |
| **Description**         | Hook pre-commit: lint-staged (eslint --fix em _.ts, _.tsx, _.js, _.jsx) + turbo run lint em pacotes alterados. |
| **Acceptance Criteria** | - .husky/pre-commit existe; npx lint-staged; lint-staged config em package.json; turbo run lint                |

---

### KAN-23: pre-push — Testes completos antes do push

| Campo                   | Valor                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **Tipo**                | Story                                                                                    |
| **Summary**             | pre-push — Testes completos antes do push                                                |
| **Description**         | Hook pre-push: turbo run test para garantir que testes passam antes de enviar ao remoto. |
| **Acceptance Criteria** | - .husky/pre-push existe; turbo run test                                                 |

---

### KAN-24: Setup Husky em novos pacotes (create-project)

| Campo                   | Valor                                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**                | Story                                                                                                                                                                                                                 |
| **Summary**             | Setup Husky em novos pacotes (create-project)                                                                                                                                                                         |
| **Description**         | Script setup-husky-per-repo.sh e add-husky-to-package.js: adicionar Husky automaticamente em novos MFEs/serviços criados pelo create-project. Incluir gaqno-warehouse-service e gaqno-warehouse-ui na lista de REPOS. |
| **Acceptance Criteria** | - scripts/setup-husky-per-repo.sh; scripts/add-husky-to-package.js; create-project.js chama setup ao criar novo pacote                                                                                                |

---

## Tasks (vinculadas às Stories)

### HUSKY-1.1: Criar .husky/commit-msg

- Conteúdo: `npx --no -- commitlint --edit "$1"`
- chmod +x

### HUSKY-2.1: Instalar lint-staged

- npm install -D lint-staged

### HUSKY-2.2: Configurar lint-staged em package.json

- "lint-staged": { "_.{ts,tsx}": ["eslint --fix"], "_.{js,jsx}": ["eslint --fix"] }

### HUSKY-2.3: Atualizar .husky/pre-commit

- npx lint-staged + turbo run lint

### HUSKY-3.1: Criar .husky/pre-push

- Conteúdo: turbo run test
- chmod +x

### HUSKY-4.1: Incluir warehouse no setup-husky-per-repo.sh

- Adicionar gaqno-warehouse-service, gaqno-warehouse-ui ao array REPOS

---

## Status

Todos marcados como **Feito** (implementação já aplicada no workspace).

| Key                                                 | Summary                          | Status |
| --------------------------------------------------- | -------------------------------- | ------ |
| [KAN-16](https://gaqno.atlassian.net/browse/KAN-16) | Husky + Commitlint + Lint-staged | Feito  |
| [KAN-21](https://gaqno.atlassian.net/browse/KAN-21) | commit-msg                       | Feito  |
| [KAN-22](https://gaqno.atlassian.net/browse/KAN-22) | pre-commit                       | Feito  |
| [KAN-23](https://gaqno.atlassian.net/browse/KAN-23) | pre-push                         | Feito  |
| [KAN-24](https://gaqno.atlassian.net/browse/KAN-24) | Setup em novos pacotes           | Feito  |

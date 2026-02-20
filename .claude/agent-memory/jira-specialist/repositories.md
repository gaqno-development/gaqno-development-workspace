# Repositories Reference

## Repositórios no Workspace

### Backend Services
| Diretório | Repositório GitHub | Framework | Build Command | Dev Command |
|-----------|-------------------|-----------|---------------|-------------|
| `gaqno-ai-service` | `gaqno-development/gaqno-ai-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-sso-service` | `gaqno-development/gaqno-sso-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-finance-service` | `gaqno-development/gaqno-finance-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-pdv-service` | `gaqno-development/gaqno-pdv-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-rpg-service` | `gaqno-development/gaqno-rpg-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-omnichannel-service` | `gaqno-development/gaqno-omnichannel-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-admin-service` | `gaqno-development/gaqno-admin-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-wellness-service` | `gaqno-development/gaqno-wellness-service` | NestJS | `npm run build` | `npm run start:dev` |
| `gaqno-saas-service` | `gaqno-development/gaqno-saas-service` | NestJS | `npm run build` | `npm run start:dev` |

### Frontend Applications
| Diretório | Repositório GitHub | Framework | Build Command | Dev Command |
|-----------|-------------------|-----------|---------------|-------------|
| `gaqno-shell-ui` | `gaqno-development/gaqno-shell-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-sso-ui` | `gaqno-development/gaqno-sso-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-ai-ui` | `gaqno-development/gaqno-ai-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-crm-ui` | `gaqno-development/gaqno-crm-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-erp-ui` | `gaqno-development/gaqno-erp-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-finance-ui` | `gaqno-development/gaqno-finance-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-pdv-ui` | `gaqno-development/gaqno-pdv-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-rpg-ui` | `gaqno-development/gaqno-rpg-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-saas-ui` | `gaqno-development/gaqno-saas-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-admin-ui` | `gaqno-development/gaqno-admin-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-omnichannel-ui` | `gaqno-development/gaqno-omnichannel-ui` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-landing-ui` | `gaqno/gaqno_landing` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-lenin-ui` | `gaqno/llm_lenin` | React + Vite | `npm run build` | `npm run dev` |
| `gaqno-wellness-ui` | `gaqno-development/gaqno-wellness-ui` | React + Vite | `npm run build` | `npm run dev` |

### Shared Packages
| Diretório | Repositório GitHub | Tipo | Publicação |
|-----------|-------------------|------|------------|
| `@gaqno-backcore` | `gaqno-development/gaqno-backcore` | Biblioteca backend | `npm publish` |
| `@gaqno-frontcore` | `gaqno-development/gaqno-frontcore` | Biblioteca frontend | `npm publish` |
| `@gaqno-types` | `gaqno-development/gaqno-types` | Tipos TypeScript | `npm publish` |

## Estrutura de Submódulos

### `.gitmodules` atual
```
[submodule "gaqno-ai-service"]
	path = gaqno-ai-service
	url = git@github.com:gaqno-development/gaqno-ai-service.git

[submodule "gaqno-pdv-service"]
	path = gaqno-pdv-service
	url = git@github.com:gaqno-development/gaqno-pdv-service.git

[submodule "gaqno-sso-service"]
	path = gaqno-sso-service
	url = git@github.com:gaqno-development/gaqno-sso-service.git

[submodule "gaqno-finance-service"]
	path = gaqno-finance-service
	url = git@github.com:gaqno-development/gaqno-finance-service.git

[submodule "gaqno-rpg-service"]
	path = gaqno-rpg-service
	url = git@github.com:gaqno-development/gaqno-rpg-service.git

[submodule "gaqno-omnichannel-service"]
	path = gaqno-omnichannel-service
	url = git@github.com:gaqno-development/gaqno-omnichannel-service.git

[submodule "gaqno-admin-service"]
	path = gaqno-admin-service
	url = git@github.com:gaqno-development/gaqno-admin-service.git

[submodule "gaqno-admin-ui"]
	path = gaqno-admin-ui
	url = git@github.com:gaqno-development/gaqno-admin-ui.git

[submodule "gaqno-ai-ui"]
	path = gaqno-ai-ui
	url = git@github.com:gaqno-development/gaqno-ai.git

[submodule "gaqno-crm-ui"]
	path = gaqno-crm-ui
	url = git@github.com:gaqno-development/gaqno-crm.git

[submodule "gaqno-erp-ui"]
	path = gaqno-erp-ui
	url = git@github.com:gaqno-development/gaqno-erp.git

[submodule "gaqno-finance-ui"]
	path = gaqno-finance-ui
	url = git@github.com:gaqno-development/gaqno-finance.git

[submodule "gaqno-landing-ui"]
	path = gaqno-landing-ui
	url = git@github.com:gaqno/gaqno_landing.git

[submodule "gaqno-lenin-ui"]
	path = gaqno-lenin-ui
	url = git@github.com:gaqno/llm_lenin.git

[submodule "gaqno-omnichannel-ui"]
	path = gaqno-omnichannel-ui
	url = git@github.com:gaqno-development/gaqno-omnichannel.git

[submodule "gaqno-pdv-ui"]
	path = gaqno-pdv-ui
	url = git@github.com:gaqno-development/gaqno-pdv.git

[submodule "gaqno-rpg-ui"]
	path = gaqno-rpg-ui
	url = git@github.com:gaqno-development/gaqno-rpg.git
```

## Branch Default por Repositório

Para verificar branch default de cada repositório:
```bash
cd <diretório-do-repo>
git remote show origin | grep "HEAD branch"
```

**Padrão observado**: Todos os repositórios usam `main` como branch default.

## Scripts de Build do Workspace

### Build All
```bash
# Via npm script
npm run build:all

# Via script shell
./build-all.sh
```

O script `build-all.sh`:
1. Limpa node_modules
2. Instala dependências
3. Atualiza pacotes @gaqno-dev
4. Build de serviços
5. Build de frontends

### Comandos por Categoria
```bash
# Build de todos os frontends
npm run build -w gaqno-shell-ui -w gaqno-sso-ui -w gaqno-ai-ui -w gaqno-crm-ui -w gaqno-erp-ui -w gaqno-finance-ui -w gaqno-pdv-ui -w gaqno-rpg-ui

# Build de todos os serviços
npm run build -w gaqno-sso-service -w gaqno-ai-service -w gaqno-finance-service -w gaqno-pdv-service -w gaqno-rpg-service

# Dev mode
npm run dev  # Todos (exceto gaqno-lenin-ui)
npm run dev:backends  # Apenas serviços
npm run dev:frontends  # Apenas frontends
```

## Worktree por Repositório

### Criar Worktree para Trabalho
```bash
# Exemplo: Trabalhar em gaqno-rpg-ui com ticket GAQNO-1200
cd gaqno-rpg-ui
git worktree add ../gaqno-rpg-ui-1200 -b story/GAQNO-1200

# Trabalhar no worktree
cd ../gaqno-rpg-ui-1200
npm run build  # Build dentro do worktree
git commit -m "GAQNO-1201 feat: implementação"
git push origin story/GAQNO-1200
```

### Limpar Worktree Após Merge
```bash
cd gaqno-rpg-ui
git worktree remove ../gaqno-rpg-ui-1200
git branch -d story/GAQNO-1200  # Opcional
```

## GitHub Actions por Repositório

Cada repositório tem seus próprios workflows em `.github/workflows/`:

### Workflows Comuns
- **ci.yml**: Lint, test, build em push/PR
- **branch-pr-validation.yml**: Valida nome da branch e título do PR
- **pr-agent.yml**: Code review por IA (PR-Agent)

### Branch Protection Rules
- **Requer review**: Provavelmente sim (verificar configuração)
- **Requer CI passando**: Sim
- **Requer branch atualizada**: Possivelmente sim
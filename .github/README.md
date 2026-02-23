# GitHub Actions

Os workflows de CI (lint, test, build, branch/PR validation) estão em **cada repositório individual**.

- Push e PR em `gaqno-rpg-ui` → workflows disparam em `gaqno-rpg-ui`
- Push e PR em `gaqno-admin-service` → workflows disparam em `gaqno-admin-service`
- etc.

Cada submodule segue seu próprio fluxo de desenvolvimento.

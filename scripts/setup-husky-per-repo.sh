#!/bin/bash
# Adiciona Husky e commitlint em cada repositório individual.
# Execute na raiz do workspace: ./scripts/setup-husky-per-repo.sh

set -e

REPOS=(
  "gaqno-admin-service"
  "gaqno-admin-ui"
  "gaqno-ai-service"
  "gaqno-ai-ui"
  "gaqno-crm-service"
  "gaqno-crm-ui"
  "gaqno-erp-ui"
  "gaqno-finance-service"
  "gaqno-finance-ui"
  "gaqno-landing-ui"
  "gaqno-lenin-ui"
  "gaqno-omnichannel-service"
  "gaqno-omnichannel-ui"
  "gaqno-pdv-service"
  "gaqno-pdv-ui"
  "gaqno-rpg-service"
  "gaqno-rpg-ui"
  "gaqno-saas-service"
  "gaqno-saas-ui"
  "gaqno-shell-ui"
  "gaqno-sso-service"
  "gaqno-sso-ui"
)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

for repo in "${REPOS[@]}"; do
  REPO_PATH="$WORKSPACE_ROOT/$repo"
  if [ ! -d "$REPO_PATH" ]; then
    echo "⚠️  Pulando $repo (não encontrado)"
    continue
  fi

  if [ ! -f "$REPO_PATH/package.json" ]; then
    echo "⚠️  Pulando $repo (sem package.json)"
    continue
  fi

  echo "📦 Configurando $repo..."

  # Cria commitlint.config.js (copia do workspace ou cria padrão)
  if [ -f "$WORKSPACE_ROOT/commitlint.config.js" ]; then
    cp "$WORKSPACE_ROOT/commitlint.config.js" "$REPO_PATH/commitlint.config.js"
  else
    cat > "$REPO_PATH/commitlint.config.js" << 'COMMITLINT_EOF'
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
  },
};
COMMITLINT_EOF
  fi

  # Cria .husky
  mkdir -p "$REPO_PATH/.husky"
  echo 'npx --no -- commitlint --edit "$1"' > "$REPO_PATH/.husky/commit-msg"
  chmod +x "$REPO_PATH/.husky/commit-msg"
  cat > "$REPO_PATH/.husky/pre-commit" << 'PRE_COMMIT_EOF'
# Skip test if push-all.sh already ran it (avoids double run)
if [ -z "$GAQNO_TESTS_ALREADY_RAN" ]; then
  npm run test
fi
PRE_COMMIT_EOF
  chmod +x "$REPO_PATH/.husky/pre-commit"

  # Adiciona prepare e devDependencies via node
  node "$SCRIPT_DIR/add-husky-to-package.js" "$REPO_PATH/package.json"

  echo "✅ $repo configurado"
done

echo ""
echo "🎉 Concluído! Execute 'npm install' em cada repo ou no workspace para instalar as dependências."
echo "   Em cada repo: cd <repo> && npm install && npx husky"

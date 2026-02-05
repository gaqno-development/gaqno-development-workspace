#!/bin/bash
#
# Copia os workflows de CI para cada repositório individual.
# Executar a partir do workspace root.
#
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOWS_SRC="$BASE_DIR/scripts/workflows"

REPOS=(
  gaqno-admin-service gaqno-admin-ui gaqno-ai-service gaqno-ai-ui
  gaqno-crm-ui gaqno-erp-ui gaqno-finance-service gaqno-finance-ui
  gaqno-landing-ui gaqno-lenin-ui gaqno-omnichannel-service gaqno-omnichannel-ui
  gaqno-pdv-service gaqno-pdv-ui gaqno-rpg-service gaqno-rpg-ui
  gaqno-saas-service gaqno-saas-ui gaqno-shell-ui gaqno-sso-service gaqno-sso-ui
)

for repo in "${REPOS[@]}"; do
  REPO_PATH="$BASE_DIR/$repo"
  WORKFLOWS_DEST="$REPO_PATH/.github/workflows"

  if [ ! -d "$REPO_PATH" ]; then
    echo "⚠️  Skipping $repo (directory does not exist)"
    continue
  fi

  mkdir -p "$WORKFLOWS_DEST"
  cp "$WORKFLOWS_SRC/ci.yml" "$WORKFLOWS_DEST/"
  cp "$WORKFLOWS_SRC/branch-pr-validation.yml" "$WORKFLOWS_DEST/"
  cp "$WORKFLOWS_SRC/pr-agent.yml" "$WORKFLOWS_DEST/"
  echo "✅ $repo"
done

echo ""
echo "🎉 Workflows copiados para todos os repositórios."
echo "   PR-Agent: adicione OPENAI_KEY em GitHub Secrets para ativar code review por IA."
echo "   Commit e push em cada repo para ativar os workflows."

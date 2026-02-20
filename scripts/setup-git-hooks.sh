#!/bin/bash

# Script para configurar git hooks de validação Docker
# Uso: ./setup-git-hooks.sh <servico>

set -e

SERVICE="$1"
WORKSPACE_DIR="/data/gaqno-development-workspace"
SERVICE_DIR="$WORKSPACE_DIR/$SERVICE"
HOOKS_DIR="$SERVICE_DIR/.git/hooks"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[GIT-HOOKS]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar parâmetro
if [ -z "$SERVICE" ]; then
    echo "Uso: $0 <servico>"
    echo "Exemplo: $0 gaqno-ai-service"
    exit 1
fi

if [ ! -d "$SERVICE_DIR" ]; then
    error "Serviço '$SERVICE' não encontrado"
    exit 1
fi

if [ ! -d "$SERVICE_DIR/.git" ]; then
    error "Diretório .git não encontrado em $SERVICE"
    echo "Execute primeiro: cd $SERVICE_DIR && git init"
    exit 1
fi

log "Configurando git hooks para: $SERVICE"
log "Diretório: $SERVICE_DIR"

# Criar diretório de hooks se não existir
mkdir -p "$HOOKS_DIR"

# 1. Hook pre-commit: Validação Docker básica
log "Criando hook pre-commit..."

cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Git pre-commit hook para validação Docker
# Valida se o build Docker funciona antes de permitir commit

set -e

WORKSPACE_DIR="/data/gaqno-development-workspace"
SCRIPT_DIR="$WORKSPACE_DIR/scripts"
SERVICE_DIR="$(git rev-parse --show-toplevel)"
SERVICE_NAME="$(basename "$SERVICE_DIR")"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[PRE-COMMIT]${NC} Validando $SERVICE_NAME..."

# Extrair ticket key da branch atual ou mensagem de commit
BRANCH_NAME="$(git branch --show-current)"
TICKET_KEY=""

# Tentar extrair de branch (formato: type/GAQNO-XXXX-description)
if [[ "$BRANCH_NAME" =~ ([A-Z]+-[0-9]+) ]]; then
    TICKET_KEY="${BASH_REMATCH[1]}"
    echo "Ticket detectado da branch: $TICKET_KEY"
fi

# Se não encontrou na branch, tentar da mensagem de commit
if [ -z "$TICKET_KEY" ]; then
    COMMIT_MSG_FILE="$1"
    if [ -f "$COMMIT_MSG_FILE" ]; then
        COMMIT_MSG="$(head -n1 "$COMMIT_MSG_FILE")"
        if [[ "$COMMIT_MSG" =~ \[([A-Z]+-[0-9]+)\] ]]; then
            TICKET_KEY="${BASH_REMATCH[1]}"
            echo "Ticket detectado da mensagem: $TICKET_KEY"
        fi
    fi
fi

# Se ainda não tem ticket, usar placeholder
if [ -z "$TICKET_KEY" ]; then
    TICKET_KEY="NO-TICKET"
    echo -e "${YELLOW}[WARNING]${NC} Nenhum ticket detectado. Usando placeholder."
fi

# Executar validação Docker
if [ -f "$SCRIPT_DIR/pre-commit-docker-validation.sh" ]; then
    echo "Executando validação Docker..."
    
    if "$SCRIPT_DIR/pre-commit-docker-validation.sh" "$TICKET_KEY" "$SERVICE_NAME"; then
        echo -e "${GREEN}[SUCCESS]${NC} Validação Docker aprovada!"
    else
        echo -e "${RED}[ERROR]${NC} Validação Docker falhou. Commit bloqueado."
        echo ""
        echo "Corrija os erros e tente novamente."
        exit 1
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} Script de validação não encontrado."
    echo "Pulando validação Docker..."
fi

# Validação adicional: Formato da mensagem de commit
if [ -n "$COMMIT_MSG_FILE" ] && [ "$TICKET_KEY" != "NO-TICKET" ]; then
    COMMIT_MSG="$(head -n1 "$COMMIT_MSG_FILE")"
    
    # Verificar se mensagem segue convenção
    if [[ ! "$COMMIT_MSG" =~ ^\[$TICKET_KEY\].+ ]]; then
        echo -e "${YELLOW}[WARNING]${NC} Mensagem de commit não segue convenção."
        echo "Esperado: [$TICKET_KEY] descrição"
        echo "Atual: $COMMIT_MSG"
        echo ""
        read -p "Deseja corrigir? (s/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            # Sugerir correção
            SUGGESTED_MSG="[$TICKET_KEY] ${COMMIT_MSG}"
            echo "Sugestão: $SUGGESTED_MSG"
            read -p "Usar esta mensagem? (s/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                echo "$SUGGESTED_MSG" > "$COMMIT_MSG_FILE"
                echo "Mensagem corrigida."
            fi
        fi
    fi
fi

echo -e "${GREEN}[SUCCESS]${NC} Pre-commit validation passed!"
exit 0
EOF

chmod +x "$HOOKS_DIR/pre-commit"
success "Hook pre-commit configurado"

# 2. Hook commit-msg: Validação de formato
log "Criando hook commit-msg..."

cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/bin/bash
# Git commit-msg hook para validação de formato
# Valida se a mensagem de commit segue convenções

COMMIT_MSG_FILE="$1"
COMMIT_MSG="$(head -n1 "$COMMIT_MSG_FILE")"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}[COMMIT-MSG]${NC} Validando formato da mensagem..."

# Padrões aceitáveis:
# 1. [GAQNO-XXXX] descrição
# 2. GAQNO-XXXX tipo: descrição (convenção do workspace)
# 3. Merge, Revert, etc (mensagens especiais)

# Mensagens especiais (permitidas)
if [[ "$COMMIT_MSG" =~ ^(Merge|Revert|fixup|squash) ]]; then
    echo -e "${GREEN}[OK]${NC} Mensagem especial permitida"
    exit 0
fi

# Verificar formato [GAQNO-XXXX]
if [[ "$COMMIT_MSG" =~ ^\[([A-Z]+-[0-9]+)\].+ ]]; then
    TICKET_KEY="${BASH_REMATCH[1]}"
    echo -e "${GREEN}[OK]${NC} Formato: [$TICKET_KEY] descrição"
    exit 0
fi

# Verificar formato GAQNO-XXXX tipo: descrição
if [[ "$COMMIT_MSG" =~ ^([A-Z]+-[0-9]+)[[:space:]]+([a-z]+):[[:space:]]+.+ ]]; then
    TICKET_KEY="${BASH_REMATCH[1]}"
    TIPO="${BASH_REMATCH[2]}"
    
    # Tipos válidos (baseado na documentação)
    VALID_TYPES="feat fix docs style refactor test chore build ci perf"
    if [[ " $VALID_TYPES " =~ " $TIPO " ]]; then
        echo -e "${GREEN}[OK]${NC} Formato: $TICKET_KEY $TIPO: descrição"
        exit 0
    else
        echo -e "${YELLOW}[WARNING]${NC} Tipo '$TIPO' não é padrão."
        echo "Tipos válidos: $VALID_TYPES"
    fi
fi

# Se chegou aqui, formato inválido
echo -e "${RED}[ERROR]${NC} Formato de mensagem inválido: $COMMIT_MSG"
echo ""
echo "Formatos aceitos:"
echo "1. [GAQNO-XXXX] Descrição da mudança"
echo "2. GAQNO-XXXX tipo: Descrição da mudança"
echo "   Tipos: feat, fix, docs, style, refactor, test, chore, build, ci, perf"
echo ""
echo "Exemplos:"
echo "  [GAQNO-1381] Integração OpenClaw no ai-service"
echo "  GAQNO-1382 fix: Corrigir erro useAuth no módulo AI"
echo ""
echo "Mensagens especiais também são permitidas:"
echo "  Merge branch 'feature/...'"
echo "  Revert \"[GAQNO-XXXX] ...\""
echo ""
exit 1
EOF

chmod +x "$HOOKS_DIR/commit-msg"
success "Hook commit-msg configurado"

# 3. Hook pre-push: Validação final antes de push
log "Criando hook pre-push..."

cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash
# Git pre-push hook para validação final
# Executa testes e validações antes de push para remote

set -e

SERVICE_DIR="$(git rev-parse --show-toplevel)"
SERVICE_NAME="$(basename "$SERVICE_DIR")"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[PRE-PUSH]${NC} Validando $SERVICE_NAME antes do push..."

# 1. Verificar se há testes para executar
if [ -f "$SERVICE_DIR/package.json" ]; then
    cd "$SERVICE_DIR"
    
    # Verificar se há script de test
    if npm run | grep -q " test"; then
        echo "Executando testes..."
        if npm test 2>&1; then
            echo -e "${GREEN}[OK]${NC} Testes passaram"
        else
            echo -e "${RED}[ERROR]${NC} Testes falharam"
            echo ""
            echo "Corrija os testes antes de fazer push."
            exit 1
        fi
    else
        echo -e "${YELLOW}[WARNING]${NC} Script de testes não encontrado"
    fi
    
    # Verificar se há lint
    if npm run | grep -q " lint"; then
        echo "Executando lint..."
        if npm run lint 2>&1; then
            echo -e "${GREEN}[OK]${NC} Lint passou"
        else
            echo -e "${YELLOW}[WARNING]${NC} Lint falhou (continuando mesmo assim)"
        fi
    fi
fi

# 2. Verificar se build ainda funciona
echo "Verificando build..."
if [ -f "$SERVICE_DIR/Dockerfile" ]; then
    # Build rápido (usando cache)
    if docker build --target builder -t "$SERVICE_NAME:pre-push" "$SERVICE_DIR" 2>&1 | tail -20; then
        echo -e "${GREEN}[OK]${NC} Build rápido bem-sucedido"
        # Limpar imagem temporária
        docker rmi "$SERVICE_NAME:pre-push" 2>/dev/null || true
    else
        echo -e "${RED}[ERROR]${NC} Build rápido falhou"
        echo ""
        echo "O build Docker falhou. Não é seguro fazer push."
        echo "Execute o script de validação completo para diagnosticar:"
        echo "  /data/gaqno-development-workspace/scripts/validate-docker-build.sh $SERVICE_NAME"
        exit 1
    fi
fi

# 3. Verificar se está na branch correta (opcional)
BRANCH_NAME="$(git branch --show-current)"
if [[ "$BRANCH_NAME" =~ ^(main|master|develop)$ ]]; then
    echo -e "${YELLOW}[WARNING]${NC} Push para branch protegida: $BRANCH_NAME"
    echo "Certifique-se de que isso é intencional."
    read -p "Continuar com push para $BRANCH_NAME? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Push cancelado."
        exit 1
    fi
fi

echo -e "${GREEN}[SUCCESS]${NC} Todas validações passaram. Pode fazer push!"
exit 0
EOF

chmod +x "$HOOKS_DIR/pre-push"
success "Hook pre-push configurado"

# 4. Instalar dependências extras (hadolint para validação Dockerfile)
log "Instalando dependências extras..."

if ! command -v hadolint &> /dev/null; then
    echo "Instalando hadolint para validação de Dockerfile..."
    if command -v docker &> /dev/null; then
        echo "Usando Docker para hadolint (não requer instalação local)"
    else
        echo "Docker não encontrado. Hadolint será usado via container quando necessário."
    fi
else
    success "Hadolint já instalado"
fi

if ! command -v jq &> /dev/null; then
    echo "Instalando jq para manipulação JSON..."
    apt-get update && apt-get install -y jq 2>/dev/null || \
    echo "Não foi possível instalar jq. Instale manualmente: apt-get install jq"
else
    success "jq já instalado"
fi

# Resumo
echo ""
echo "================================================"
echo "GIT HOOKS CONFIGURADOS PARA: $SERVICE"
echo "================================================"
echo ""
echo "Hooks instalados:"
echo "  1. pre-commit    - Validação Docker básica"
echo "  2. commit-msg    - Validação formato da mensagem"
echo "  3. pre-push      - Validação final (testes, build)"
echo ""
echo "Fluxo de trabalho recomendado:"
echo "  1. git add ."
echo "  2. git commit -m \"[GAQNO-XXXX] descrição\""
echo "     ↑ Validação Docker + formato da mensagem"
echo "  3. git push"
echo "     ↑ Validação final (testes + build)"
echo ""
echo "Scripts disponíveis:"
echo "  • validate-docker-build.sh <servico>        - Validação completa"
echo "  • pre-commit-docker-validation.sh <ticket> <servico> - Validação específica"
echo ""
echo "Para desativar temporariamente:"
echo "  chmod -x $HOOKS_DIR/<hook-name>"
echo ""
success "Configuração concluída com sucesso!"
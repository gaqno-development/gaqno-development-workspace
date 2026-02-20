#!/bin/bash

# Validação de estrutura sem Docker
# Para ambientes onde Docker não está disponível

set -e

TICKET_KEY="$1"
SERVICE="$2"
WORKSPACE_DIR="/data/gaqno-development-workspace"
VALIDATION_DIR="$WORKSPACE_DIR/.docker-validation"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[STRUCTURE-VALIDATION]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar parâmetros
if [ -z "$TICKET_KEY" ] || [ -z "$SERVICE" ]; then
    echo "Uso: $0 <ticket-key> <servico>"
    exit 1
fi

SERVICE_DIR="$WORKSPACE_DIR/$SERVICE"

if [ ! -d "$SERVICE_DIR" ]; then
    error "Serviço '$SERVICE' não encontrado"
    exit 1
fi

mkdir -p "$VALIDATION_DIR"
REPORT_FILE="$VALIDATION_DIR/${TICKET_KEY}_${SERVICE}_structure_${TIMESTAMP}.json"

log "Validação de estrutura para:"
log "  Ticket: $TICKET_KEY"
log "  Serviço: $SERVICE"

# Inicializar report
cat > "$REPORT_FILE" << EOF
{
  "ticket": "$TICKET_KEY",
  "service": "$SERVICE",
  "timestamp": "$(date -Iseconds)",
  "environment": "no-docker",
  "validations": [],
  "summary": {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "warnings": 0
  }
}
EOF

add_validation() {
    local name="$1"
    local status="$2"
    local message="$3"
    
    jq --arg name "$name" \
       --arg status "$status" \
       --arg message "$message" \
       '.validations += [{name: $name, status: $status, message: $message}] |
        .summary.total += 1 |
        .summary.passed += (if $status == "PASSED" then 1 else 0 end) |
        .summary.failed += (if $status == "FAILED" then 1 else 0 end) |
        .summary.warnings += (if $status == "WARNING" then 1 else 0 end)' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# 1. Validação de arquivos essenciais
log "1. Validando arquivos essenciais..."

ESSENTIAL_FILES=("Dockerfile" "package.json" ".gitignore")
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$SERVICE_DIR/$file" ]; then
        success "✓ $file encontrado"
        add_validation "${file}_exists" "PASSED" "$file encontrado"
    else
        if [ "$file" = ".gitignore" ]; then
            warning "⚠ $file não encontrado (opcional)"
            add_validation "${file}_exists" "WARNING" "$file não encontrado"
        else
            error "✗ $file não encontrado"
            add_validation "${file}_exists" "FAILED" "$file não encontrado"
        fi
    fi
done

# 2. Validação Dockerfile
log "2. Analisando Dockerfile..."

if [ -f "$SERVICE_DIR/Dockerfile" ]; then
    # Verificar se é multi-stage
    if grep -q "FROM.*AS" "$SERVICE_DIR/Dockerfile"; then
        success "✓ Dockerfile multi-stage detectado"
        add_validation "dockerfile_multi_stage" "PASSED" "Multi-stage build"
    else
        warning "⚠ Dockerfile não é multi-stage"
        add_validation "dockerfile_multi_stage" "WARNING" "Não é multi-stage"
    fi
    
    # Verificar node version
    NODE_VERSION=$(grep -oP 'FROM node:\K[0-9.]+' "$SERVICE_DIR/Dockerfile" | head -1)
    if [ -n "$NODE_VERSION" ]; then
        success "✓ Node.js $NODE_VERSION especificado"
        add_validation "node_version" "PASSED" "Node.js $NODE_VERSION"
    else
        warning "⚠ Versão do Node.js não especificada"
        add_validation "node_version" "WARNING" "Versão não especificada"
    fi
    
    # Verificar portas
    if grep -q "EXPOSE" "$SERVICE_DIR/Dockerfile"; then
        PORTS=$(grep "EXPOSE" "$SERVICE_DIR/Dockerfile" | tr '\n' ' ')
        success "✓ Portas expostas: $PORTS"
        add_validation "ports_exposed" "PASSED" "Portas: $PORTS"
    else
        warning "⚠ Nenhuma porta EXPOSE definida"
        add_validation "ports_exposed" "WARNING" "Sem portas expostas"
    fi
fi

# 3. Validação package.json
log "3. Validando package.json..."

if [ -f "$SERVICE_DIR/package.json" ]; then
    cd "$SERVICE_DIR"
    
    # Verificar JSON válido
    if jq empty package.json 2>/dev/null; then
        success "✓ package.json JSON válido"
        add_validation "package_json_valid" "PASSED" "JSON válido"
    else
        error "✗ package.json JSON inválido"
        add_validation "package_json_valid" "FAILED" "JSON inválido"
        exit 1
    fi
    
    # Extrair informações
    NAME=$(jq -r '.name // empty' package.json)
    VERSION=$(jq -r '.version // empty' package.json)
    SCRIPTS=$(jq -r '.scripts | keys[]' package.json 2>/dev/null | tr '\n' ', ')
    
    if [ -n "$NAME" ]; then
        success "✓ Nome: $NAME"
        add_validation "package_name" "PASSED" "Nome: $NAME"
    fi
    
    if [ -n "$VERSION" ]; then
        success "✓ Versão: $VERSION"
        add_validation "package_version" "PASSED" "Versão: $VERSION"
    fi
    
    # Verificar scripts essenciais
    ESSENTIAL_SCRIPTS=("build" "start")
    for script in "${ESSENTIAL_SCRIPTS[@]}"; do
        if jq -e ".scripts.${script}" package.json >/dev/null 2>&1; then
            SCRIPT_CMD=$(jq -r ".scripts.${script}" package.json)
            success "✓ Script $script: $SCRIPT_CMD"
            add_validation "script_${script}" "PASSED" "$script definido"
        else
            if [ "$script" = "start" ]; then
                warning "⚠ Script $script não definido"
                add_validation "script_${script}" "WARNING" "$script não definido"
            else
                error "✗ Script $script não definido"
                add_validation "script_${script}" "FAILED" "$script não definido"
            fi
        fi
    done
    
    # Verificar dependências
    DEPS_COUNT=$(jq '.dependencies | length' package.json 2>/dev/null || echo "0")
    DEV_DEPS_COUNT=$(jq '.devDependencies | length' package.json 2>/dev/null || echo "0")
    
    success "✓ Dependências: $DEPS_COUNT produção, $DEV_DEPS_COUNT desenvolvimento"
    add_validation "dependencies" "PASSED" "$DEPS_COUNT prod, $DEV_DEPS_COUNT dev"
fi

# 4. Validação de estrutura de diretórios
log "4. Validando estrutura de diretórios..."

ESSENTIAL_DIRS=("src" "test")
for dir in "${ESSENTIAL_DIRS[@]}"; do
    if [ -d "$SERVICE_DIR/$dir" ]; then
        FILE_COUNT=$(find "$SERVICE_DIR/$dir" -type f -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l)
        success "✓ Diretório $dir: $FILE_COUNT arquivos"
        add_validation "dir_${dir}" "PASSED" "$FILE_COUNT arquivos"
    else
        if [ "$dir" = "test" ]; then
            warning "⚠ Diretório $dir não encontrado"
            add_validation "dir_${dir}" "WARNING" "Não encontrado"
        else
            error "✗ Diretório $dir não encontrado"
            add_validation "dir_${dir}" "FAILED" "Não encontrado"
        fi
    fi
done

# 5. Validação de configurações
log "5. Validando arquivos de configuração..."

CONFIG_FILES=("tsconfig.json" "nest-cli.json" ".env.example" "docker-compose.yml")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$SERVICE_DIR/$file" ]; then
        success "✓ $file encontrado"
        add_validation "config_${file}" "PASSED" "Encontrado"
    else
        # Alguns são opcionais
        if [[ "$file" =~ ^(\.env\.example|docker-compose\.yml)$ ]]; then
            warning "⚠ $file não encontrado (opcional)"
            add_validation "config_${file}" "WARNING" "Não encontrado"
        else
            # tsconfig.json e nest-cli.json são importantes para NestJS
            if [[ "$SERVICE" == *-service ]] && [[ "$file" =~ ^(tsconfig\.json|nest-cli\.json)$ ]]; then
                error "✗ $file não encontrado (essencial para NestJS)"
                add_validation "config_${file}" "FAILED" "Não encontrado"
            else
                warning "⚠ $file não encontrado"
                add_validation "config_${file}" "WARNING" "Não encontrado"
            fi
        fi
    fi
done

# 6. Resumo final
log "6. Gerando resumo..."

TOTAL=$(jq '.summary.total' "$REPORT_FILE")
PASSED=$(jq '.summary.passed' "$REPORT_FILE")
FAILED=$(jq '.summary.failed' "$REPORT_FILE")
WARNINGS=$(jq '.summary.warnings' "$REPORT_FILE")

echo ""
echo "================================================"
echo "RESUMO DA VALIDAÇÃO DE ESTRUTURA"
echo "================================================"
echo "Ticket:    $TICKET_KEY"
echo "Serviço:   $SERVICE"
echo "Total:     $TOTAL validações"
echo "Aprovadas: $PASSED"
echo "Falhas:    $FAILED"
echo "Alertas:   $WARNINGS"
echo "Report:    $REPORT_FILE"
echo ""

# Listar validações
echo "Validações realizadas:"
jq -r '.validations[] | "\(if .status == "PASSED" then "✅" elif .status == "FAILED" then "❌" else "⚠️ " end) \(.name): \(.message)"' "$REPORT_FILE"

echo ""
echo "Próximos passos:"

if [ "$FAILED" -gt 0 ]; then
    error "❌ VALIDAÇÃO FALHOU - Corrija os erros:"
    jq -r '.validations[] | select(.status == "FAILED") | "  - \(.name): \(.message)"' "$REPORT_FILE"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    warning "⚠ VALIDAÇÃO COM ALERTAS - Recomendado corrigir:"
    jq -r '.validations[] | select(.status == "WARNING") | "  - \(.name): \(.message)"' "$REPORT_FILE"
    echo ""
    success "✅ Pode prosseguir (com alertas)"
    exit 0
else
    success "✅ VALIDAÇÃO BEM-SUCEDIDA - Estrutura OK"
    echo ""
    echo "Recomendações para commit:"
    echo "  1. Mensagem: \"[$TICKET_KEY] descrição\""
    echo "  2. Testar localmente se possível"
    echo "  3. Seguir workflow do workspace"
    exit 0
fi
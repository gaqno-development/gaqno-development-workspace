#!/bin/bash

# Script de validação Docker para pre-commit
# Integrado com workflow Jira-Git
# Uso: ./pre-commit-docker-validation.sh <ticket-key> <servico>

set -e

TICKET_KEY="$1"
SERVICE="$2"
WORKSPACE_DIR="/data/gaqno-development-workspace"
VALIDATION_DIR="$WORKSPACE_DIR/.docker-validation"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funções
log() {
    echo -e "${BLUE}[DOCKER-VALIDATION]${NC} $1"
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
    echo "Exemplo: $0 GAQNO-1381 gaqno-ai-service"
    echo "         $0 GAQNO-1382 gaqno-sso-service"
    exit 1
fi

# Validar formato do ticket
if [[ ! "$TICKET_KEY" =~ ^[A-Z]+-[0-9]+$ ]]; then
    error "Formato de ticket inválido. Use: PROJECT-NUMBER (ex: GAQNO-1381)"
    exit 1
fi

SERVICE_DIR="$WORKSPACE_DIR/$SERVICE"

if [ ! -d "$SERVICE_DIR" ]; then
    error "Serviço '$SERVICE' não encontrado em $SERVICE_DIR"
    exit 1
fi

# Criar diretório de validação
mkdir -p "$VALIDATION_DIR"
REPORT_FILE="$VALIDATION_DIR/${TICKET_KEY}_${SERVICE}_${TIMESTAMP}.json"

log "Iniciando validação Docker para:"
log "  Ticket: $TICKET_KEY"
log "  Serviço: $SERVICE"
log "  Diretório: $SERVICE_DIR"
log "  Report: $REPORT_FILE"

# Inicializar report JSON
cat > "$REPORT_FILE" << EOF
{
  "ticket": "$TICKET_KEY",
  "service": "$SERVICE",
  "timestamp": "$(date -Iseconds)",
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
    local details="$4"
    
    local validation=$(jq -n \
        --arg name "$name" \
        --arg status "$status" \
        --arg message "$message" \
        --arg details "$details" \
        '{name: $name, status: $status, message: $message, details: $details}')
    
    jq --argjson validation "$validation" \
        '.validations += [$validation] | 
        .summary.total += 1 |
        .summary.passed += (if $validation.status == "PASSED" then 1 else 0 end) |
        .summary.failed += (if $validation.status == "FAILED" then 1 else 0 end) |
        .summary.warnings += (if $validation.status == "WARNING" then 1 else 0 end)' \
        "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# 1. Validação de estrutura básica
log "1. Validando estrutura do serviço..."

if [ -f "$SERVICE_DIR/Dockerfile" ]; then
    success "✓ Dockerfile encontrado"
    add_validation "dockerfile_exists" "PASSED" "Dockerfile encontrado" "$SERVICE_DIR/Dockerfile"
else
    error "✗ Dockerfile não encontrado"
    add_validation "dockerfile_exists" "FAILED" "Dockerfile não encontrado" "$SERVICE_DIR"
    exit 1
fi

if [ -f "$SERVICE_DIR/package.json" ]; then
    success "✓ package.json encontrado"
    add_validation "package_json_exists" "PASSED" "package.json encontrado" "$SERVICE_DIR/package.json"
else
    error "✗ package.json não encontrado"
    add_validation "package_json_exists" "FAILED" "package.json não encontrado" "$SERVICE_DIR"
    exit 1
fi

# 2. Validação de sintaxe Dockerfile
log "2. Validando sintaxe do Dockerfile..."

if docker run --rm -i hadolint/hadolint < "$SERVICE_DIR/Dockerfile" 2>/dev/null; then
    success "✓ Sintaxe Dockerfile válida"
    add_validation "dockerfile_syntax" "PASSED" "Sintaxe Dockerfile válida" "hadolint validation passed"
else
    warning "⚠ Possíveis issues no Dockerfile (hadolint)"
    add_validation "dockerfile_syntax" "WARNING" "Possíveis issues no Dockerfile" "Recomendado revisar com hadolint"
fi

# 3. Validação de dependências
log "3. Validando dependências..."

# Verificar se todas dependências no package.json estão instaláveis
if [ -f "$SERVICE_DIR/package.json" ]; then
    cd "$SERVICE_DIR"
    
    # Verificar se package.json é JSON válido
    if jq empty package.json 2>/dev/null; then
        success "✓ package.json JSON válido"
        add_validation "package_json_valid" "PASSED" "package.json JSON válido" "JSON syntax OK"
    else
        error "✗ package.json JSON inválido"
        add_validation "package_json_valid" "FAILED" "package.json JSON inválido" "Invalid JSON syntax"
        exit 1
    fi
    
    # Verificar scripts de build
    BUILD_SCRIPT=$(jq -r '.scripts.build // empty' package.json)
    if [ -n "$BUILD_SCRIPT" ]; then
        success "✓ Script de build definido: $BUILD_SCRIPT"
        add_validation "build_script_defined" "PASSED" "Script de build definido" "$BUILD_SCRIPT"
    else
        warning "⚠ Script de build não definido no package.json"
        add_validation "build_script_defined" "WARNING" "Script de build não definido" "Adicionar em scripts.build"
    fi
fi

# 4. Build Docker local
log "4. Executando build Docker local..."

BUILD_LOG="$VALIDATION_DIR/${TICKET_KEY}_${SERVICE}_build_${TIMESTAMP}.log"
BUILD_TAG="gaqno-validation/${SERVICE}:${TICKET_KEY}-${TIMESTAMP}"

{
    echo "=== DOCKER BUILD: $SERVICE for $TICKET_KEY ==="
    echo "Timestamp: $(date)"
    echo "Tag: $BUILD_TAG"
    echo ""
    
    if docker build \
        --no-cache \
        --progress=plain \
        -t "$BUILD_TAG" \
        "$SERVICE_DIR" 2>&1; then
        
        echo ""
        echo "✅ BUILD SUCESSO"
        BUILD_STATUS="PASSED"
        BUILD_MESSAGE="Build Docker concluído com sucesso"
        
        # Verificar tamanho da imagem
        IMAGE_SIZE=$(docker images "$BUILD_TAG" --format "{{.Size}}")
        echo "Tamanho: $IMAGE_SIZE"
        
        # Verificar layers
        echo ""
        echo "Layers da imagem:"
        docker history "$BUILD_TAG" --format "table {{.CreatedBy}}\t{{.Size}}" | head -10
        
    else
        echo ""
        echo "❌ BUILD FALHOU"
        BUILD_STATUS="FAILED"
        BUILD_MESSAGE="Build Docker falhou"
    fi
    
    echo ""
    echo "Fim: $(date)"
    
} | tee "$BUILD_LOG"

if [ "$BUILD_STATUS" = "PASSED" ]; then
    success "Build Docker local bem-sucedido"
    add_validation "docker_build" "PASSED" "$BUILD_MESSAGE" "Tag: $BUILD_TAG, Size: $IMAGE_SIZE, Log: $BUILD_LOG"
    
    # 5. Testar imagem construída
    log "5. Testando imagem construída..."
    
    TEST_LOG="$VALIDATION_DIR/${TICKET_KEY}_${SERVICE}_test_${TIMESTAMP}.log"
    
    {
        echo "=== IMAGE TEST: $SERVICE ==="
        echo "Image: $BUILD_TAG"
        echo ""
        
        # Testar entrypoint básico
        echo "Testando entrypoint..."
        if docker run --rm --entrypoint echo "$BUILD_TAG" "Test OK" 2>/dev/null; then
            echo "✅ Entrypoint testado"
            ENTRYPOINT_TEST="PASSED"
        else
            echo "⚠ Entrypoint com possível problema"
            ENTRYPOINT_TEST="WARNING"
        fi
        
        # Verificar arquivos essenciais
        echo ""
        echo "Verificando arquivos essenciais..."
        
        ESSENTIAL_FILES=("package.json" "node_modules")
        
        for file in "${ESSENTIAL_FILES[@]}"; do
            if docker run --rm "$BUILD_TAG" ls -la "/app/$file" 2>/dev/null; then
                echo "✅ $file encontrado"
            else
                echo "⚠ $file não encontrado"
            fi
        done
        
        # Verificar se é aplicação web (porta)
        echo ""
        echo "Verificando configuração de porta..."
        EXPOSED_PORTS=$(docker inspect --format='{{json .Config.ExposedPorts}}' "$BUILD_TAG")
        if [ "$EXPOSED_PORTS" != "null" ] && [ "$EXPOSED_PORTS" != "{}" ]; then
            echo "✅ Portas expostas: $EXPOSED_PORTS"
            PORT_TEST="PASSED"
        else
            echo "⚠ Nenhuma porta exposta"
            PORT_TEST="WARNING"
        fi
        
        echo ""
        echo "✅ Testes concluídos"
        
    } | tee "$TEST_LOG"
    
    add_validation "image_test" "PASSED" "Teste de imagem concluído" "Log: $TEST_LOG"
    
    # 6. Limpeza
    log "6. Limpando imagem de teste..."
    docker rmi "$BUILD_TAG" 2>/dev/null || warning "Não foi possível remover imagem de teste"
    
else
    error "Build Docker falhou"
    add_validation "docker_build" "FAILED" "$BUILD_MESSAGE" "Verifique o log: $BUILD_LOG"
    
    # Analisar erro
    echo ""
    echo "🔍 Análise do erro de build:"
    
    if grep -q "npm ERR!" "$BUILD_LOG"; then
        error "Problema com npm install"
        echo "  Possíveis causas:"
        echo "  - Token NPM não configurado"
        echo "  - Dependências privadas sem acesso"
        echo "  - Network issues"
    fi
    
    if grep -q "build did not produce" "$BUILD_LOG"; then
        error "Build não produziu artefatos esperados"
        echo "  Verifique:"
        echo "  - Scripts de build no package.json"
        echo "  - Dependências de desenvolvimento"
    fi
    
    exit 1
fi

# 7. Gerar resumo final
log "7. Gerando resumo final..."

SUMMARY=$(jq -r '.summary | "Total: \(.total) | Aprovadas: \(.passed) | Falhas: \(.failed) | Alertas: \(.warnings)"' "$REPORT_FILE")

echo ""
echo "================================================"
echo "RESUMO DA VALIDAÇÃO DOCKER"
echo "================================================"
echo "Ticket:    $TICKET_KEY"
echo "Serviço:   $SERVICE"
echo "Status:    $SUMMARY"
echo "Report:    $REPORT_FILE"
echo ""

# Listar validações
echo "Validações realizadas:"
jq -r '.validations[] | "\(.status) - \(.name): \(.message)"' "$REPORT_FILE"

echo ""
echo "Próximos passos:"

if jq -e '.summary.failed > 0' "$REPORT_FILE" >/dev/null; then
    error "❌ VALIDAÇÃO FALHOU - Não prossiga com o commit"
    echo "  Corrija os erros antes de continuar:"
    jq -r '.validations[] | select(.status == "FAILED") | "  - \(.name): \(.message)"' "$REPORT_FILE"
    exit 1
elif jq -e '.summary.warnings > 0' "$REPORT_FILE" >/dev/null; then
    warning "⚠ VALIDAÇÃO COM ALERTAS - Revise antes de prosseguir"
    echo "  Alertas encontrados:"
    jq -r '.validations[] | select(.status == "WARNING") | "  - \(.name): \(.message)"' "$REPORT_FILE"
    echo ""
    echo "  Você pode prosseguir, mas recomendo corrigir os alertas."
    success "✅ Pode prosseguir com o commit"
    exit 0
else
    success "✅ VALIDAÇÃO BEM-SUCEDIDA - Pode prosseguir com o commit"
    echo ""
    echo "Recomendações:"
    echo "  1. Execute testes unitários: npm test (se disponível)"
    echo "  2. Verifique linting: npm run lint (se disponível)"
    echo "  3. Commit seguindo convenção: \"$TICKET_KEY tipo: descrição\""
    exit 0
fi
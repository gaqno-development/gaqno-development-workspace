#!/bin/bash

# Script para validar build Docker antes de subir
# Uso: ./validate-docker-build.sh <servico> [--force]

set -e

SERVICE="$1"
FORCE="${2:-false}"
WORKSPACE_DIR="/data/gaqno-development-workspace"
LOG_DIR="$WORKSPACE_DIR/logs/docker-builds"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se serviço foi fornecido
if [ -z "$SERVICE" ]; then
    echo "Uso: $0 <servico> [--force]"
    echo "Exemplo: $0 gaqno-ai-service"
    echo "         $0 gaqno-sso-service --force"
    exit 1
fi

SERVICE_DIR="$WORKSPACE_DIR/$SERVICE"
DOCKERFILE="$SERVICE_DIR/Dockerfile"

# Verificar se serviço existe
if [ ! -d "$SERVICE_DIR" ]; then
    log_error "Serviço '$SERVICE' não encontrado em $SERVICE_DIR"
    exit 1
fi

# Verificar se Dockerfile existe
if [ ! -f "$DOCKERFILE" ]; then
    log_error "Dockerfile não encontrado em $SERVICE_DIR"
    exit 1
fi

# Criar diretório de logs se não existir
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/${SERVICE}_${TIMESTAMP}.log"

log_info "Iniciando validação do build para: $SERVICE"
log_info "Diretório: $SERVICE_DIR"
log_info "Log: $LOG_FILE"

# Verificar se já existe uma imagem recente (menos de 1 hora)
if [ "$FORCE" != "--force" ]; then
    EXISTING_IMAGE=$(docker images -q "gaqno/$SERVICE:latest" 2>/dev/null || true)
    if [ -n "$EXISTING_IMAGE" ]; then
        IMAGE_AGE=$(docker inspect --format='{{.Created}}' "gaqno/$SERVICE:latest" 2>/dev/null | cut -d'T' -f1)
        TODAY=$(date +%Y-%m-%d)
        if [ "$IMAGE_AGE" = "$TODAY" ]; then
            log_warning "Imagem recente encontrada para $SERVICE (criada hoje)"
            log_warning "Use --force para rebuild forçado"
            read -p "Continuar com rebuild? (s/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Ss]$ ]]; then
                log_info "Build cancelado pelo usuário"
                exit 0
            fi
        fi
    fi
fi

# Verificar dependências
log_info "Verificando dependências..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info &> /dev/null; then
    log_error "Docker daemon não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Verificar arquivos necessários
REQUIRED_FILES=("package.json" "Dockerfile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$SERVICE_DIR/$file" ]; then
        log_error "Arquivo necessário não encontrado: $SERVICE_DIR/$file"
        exit 1
    fi
done

log_success "Dependências verificadas com sucesso"

# Iniciar build
log_info "Iniciando build Docker..."
log_info "Comando: docker build -t gaqno/$SERVICE:latest -t gaqno/$SERVICE:$TIMESTAMP $SERVICE_DIR"

{
    echo "=== BUILD LOG: $SERVICE - $TIMESTAMP ==="
    echo "Diretório: $SERVICE_DIR"
    echo "Início: $(date)"
    echo ""
    
    # Executar build
    if docker build \
        -t "gaqno/$SERVICE:latest" \
        -t "gaqno/$SERVICE:$TIMESTAMP" \
        "$SERVICE_DIR" 2>&1; then
        
        BUILD_STATUS="SUCCESS"
        echo ""
        echo "Build concluído com sucesso!"
        echo "Imagens criadas:"
        docker images "gaqno/$SERVICE" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | tail -n +2
        
    else
        BUILD_STATUS="FAILED"
        echo ""
        echo "Build falhou!"
        exit 1
    fi
    
    echo ""
    echo "Fim: $(date)"
    echo "Status: $BUILD_STATUS"
    
} | tee "$LOG_FILE"

if [ "$BUILD_STATUS" = "SUCCESS" ]; then
    log_success "Build Docker concluído com sucesso!"
    
    # Testar a imagem criada
    log_info "Testando imagem criada..."
    
    TEST_LOG="$LOG_DIR/${SERVICE}_test_${TIMESTAMP}.log"
    
    {
        echo "=== TEST LOG: $SERVICE - $TIMESTAMP ==="
        
        # Verificar se a imagem tem entrypoint/command válido
        ENTRYPOINT=$(docker inspect --format='{{json .Config.Entrypoint}}' "gaqno/$SERVICE:latest")
        CMD=$(docker inspect --format='{{json .Config.Cmd}}' "gaqno/$SERVICE:latest")
        
        echo "Entrypoint: $ENTRYPOINT"
        echo "Cmd: $CMD"
        echo ""
        
        # Verificar se há arquivos essenciais
        echo "Verificando arquivos essenciais na imagem..."
        
        ESSENTIAL_FILES=()
        
        # Verificar baseado no tipo de serviço
        if [[ "$SERVICE" == *-service ]]; then
            # Serviço backend (NestJS)
            ESSENTIAL_FILES=("dist/main.js" "package.json" "node_modules")
        elif [[ "$SERVICE" == *-ui ]]; then
            # Frontend UI
            ESSENTIAL_FILES=("dist/index.html" "package.json" "node_modules")
        fi
        
        for file in "${ESSENTIAL_FILES[@]}"; do
            if docker run --rm "gaqno/$SERVICE:latest" ls -la "/app/$file" &>/dev/null; then
                echo "✅ $file encontrado"
            else
                echo "❌ $file NÃO encontrado"
            fi
        done
        
        # Testar health check se definido
        HEALTH_CHECK=$(docker inspect --format='{{json .Config.Healthcheck}}' "gaqno/$SERVICE:latest")
        if [ "$HEALTH_CHECK" != "null" ]; then
            echo ""
            echo "Health check configurado: $HEALTH_CHECK"
        fi
        
        # Verificar tamanho da imagem
        IMAGE_SIZE=$(docker images "gaqno/$SERVICE:latest" --format "{{.Size}}")
        echo ""
        echo "Tamanho da imagem: $IMAGE_SIZE"
        
        # Verificar variáveis de ambiente
        echo ""
        echo "Variáveis de ambiente padrão:"
        docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' "gaqno/$SERVICE:latest" | head -20
        
    } | tee "$TEST_LOG"
    
    log_success "Teste da imagem concluído!"
    
    # Resumo final
    echo ""
    echo "========================================="
    echo "RESUMO DO BUILD: $SERVICE"
    echo "========================================="
    echo "Status: ✅ SUCESSO"
    echo "Imagem: gaqno/$SERVICE:latest"
    echo "Tag: gaqno/$SERVICE:$TIMESTAMP"
    echo "Log: $LOG_FILE"
    echo "Teste: $TEST_LOG"
    echo "Tamanho: $IMAGE_SIZE"
    echo ""
    echo "Próximos passos:"
    echo "1. Testar em ambiente local: docker run -p 3000:3000 gaqno/$SERVICE:latest"
    echo "2. Push para registry: docker push gaqno/$SERVICE:latest"
    echo "3. Deploy via Coolify"
    echo "========================================="
    
else
    log_error "Build falhou. Verifique o log: $LOG_FILE"
    
    # Analisar erros comuns
    echo ""
    echo "Análise de erros comuns:"
    
    if grep -q "npm ERR!" "$LOG_FILE"; then
        log_error "Erro no npm install. Verifique:"
        echo "  - Token NPM configurado?"
        echo "  - Dependências no package.json?"
        grep -A 5 -B 5 "npm ERR!" "$LOG_FILE" | head -20
    fi
    
    if grep -q "build did not produce" "$LOG_FILE"; then
        log_error "Build não produziu arquivos esperados"
        echo "  - Script de build correto no package.json?"
        echo "  - Dependências de desenvolvimento instaladas?"
    fi
    
    if grep -q "failed to solve" "$LOG_FILE"; then
        log_error "Erro no Docker build"
        echo "  - Dockerfile sintaxe correta?"
        echo "  - Imagem base disponível?"
    fi
    
    exit 1
fi
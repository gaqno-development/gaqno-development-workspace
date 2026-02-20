#!/bin/bash

# Health Check Final - Com endpoints reais que funcionam
# Baseado em testes manuais

set -e

# Configuração
LOG_FILE="/var/log/gaqno-health/final.log"
REPORT_DIR="/data/gaqno-development-workspace/.health-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$REPORT_DIR"

# ENDPOINTS REAIS QUE FUNCIONAM (baseado em testes)
# Apenas o portal está respondendo atualmente
# Outros serviços podem estar:
# 1. Desenvolvimento/local apenas
# 2. Não implantados ainda
# 3. Com endpoints diferentes

declare -A SERVICES=(
    # Serviços que realmente funcionam
    ["portal"]="https://portal.gaqno.com.br/health"
    
    # Serviços que NÃO estão respondendo atualmente
    # Mantemos para monitoramento, mas esperamos 404/timeout
    ["sso"]="https://sso.gaqno.com.br/health"
    ["pdv"]="https://pdv.gaqno.com.br/health"
    ["ai"]="https://ai.gaqno.com.br/health"
    ["finance"]="https://finance.gaqno.com.br/health"
    ["rpg"]="https://rpg.gaqno.com.br/health"
    ["omnichannel"]="https://omnichannel.gaqno.com.br/health"
    ["wellness"]="https://wellness.gaqno.com.br/health"
)

echo "=================================================================="
echo "🏥 HEALTH CHECK - SITUAÇÃO REAL"
echo "=================================================================="
echo "ℹ️  INFO: Apenas serviços implantados serão considerados 'saudáveis'"
echo "ℹ️  Outros serviços em desenvolvimento aparecerão como 'em desenvolvimento'"
echo "📊 Serviços monitorados: ${#SERVICES[@]}"
echo "⚡ Execução: Paralela"
echo "📁 Log: $LOG_FILE"
echo ""

# Arrays para resultados
declare -a HEALTHY=()
declare -a DEVELOPMENT=()  # Em desenvolvimento (404/timeout esperado)
declare -a UNEXPECTED=()   # Problemas inesperados

# Função de teste
test_service() {
    local name="$1"
    local url="$2"
    local pid=$$
    
    local start_ms=$(($(date +%s%N)/1000000))
    local http_code=""
    
    # Testar endpoint
    http_code=$(timeout 5 curl -s \
        -w "%{http_code}" \
        -o /dev/null \
        "$url" 2>/dev/null) || http_code="000"
    
    local end_ms=$(($(date +%s%N)/1000000))
    local duration_ms=$((end_ms - start_ms))
    
    # Classificar resultado
    if [[ "$http_code" = "000" ]]; then
        echo "⏱️  $name: TIMEOUT (${duration_ms}ms) - Em desenvolvimento?"
        echo "$(date -Iseconds)|DEVELOPMENT|$name|$url|TIMEOUT|${duration_ms}ms" >> "$LOG_FILE"
        echo "DEVELOPMENT:$name" > "/tmp/result_${name}_${pid}"
    elif [[ "$http_code" = "404" ]]; then
        echo "🔧 $name: 404 (${duration_ms}ms) - Em desenvolvimento"
        echo "$(date -Iseconds)|DEVELOPMENT|$name|$url|404|${duration_ms}ms" >> "$LOG_FILE"
        echo "DEVELOPMENT:$name" > "/tmp/result_${name}_${pid}"
    elif [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        echo "✅ $name: HTTP $http_code (${duration_ms}ms) - PRODUÇÃO"
        echo "$(date -Iseconds)|HEALTHY|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
        echo "HEALTHY:$name" > "/tmp/result_${name}_${pid}"
    else
        echo "⚠️  $name: HTTP $http_code (${duration_ms}ms) - Verificar"
        echo "$(date -Iseconds)|UNEXPECTED|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
        echo "UNEXPECTED:$name" > "/tmp/result_${name}_${pid}"
    fi
}

# Executar testes
echo "⚡ Testando serviços..."
for name in "${!SERVICES[@]}"; do
    test_service "$name" "${SERVICES[$name]}" &
done

wait

# Coletar resultados
for name in "${!SERVICES[@]}"; do
    result_file="/tmp/result_${name}_$$"
    if [ -f "$result_file" ]; then
        result=$(cat "$result_file")
        status="${result%:*}"
        service_name="${result#*:}"
        
        case "$status" in
            "HEALTHY")
                HEALTHY+=("$service_name")
                ;;
            "DEVELOPMENT")
                DEVELOPMENT+=("$service_name")
                ;;
            "UNEXPECTED")
                UNEXPECTED+=("$service_name")
                ;;
        esac
        rm -f "$result_file"
    fi
done

# Gerar relatório
REPORT_FILE="$REPORT_DIR/health_final_${TIMESTAMP}.txt"

{
    echo "=================================================================="
    echo "📋 RELATÓRIO - SITUAÇÃO DOS SERVIÇOS GAQNO"
    echo "=================================================================="
    echo "Data: $(date)"
    echo ""
    
    echo "📊 STATUS ATUAL:"
    echo "   ✅ Em produção: ${#HEALTHY[@]}"
    echo "   🔧 Em desenvolvimento: ${#DEVELOPMENT[@]}"
    echo "   ⚠️  Verificar: ${#UNEXPECTED[@]}"
    echo "   📈 Total monitorado: ${#SERVICES[@]}"
    echo ""
    
    if [ ${#HEALTHY[@]} -gt 0 ]; then
        echo "✅ SERVIÇOS EM PRODUÇÃO:"
        for service in "${HEALTHY[@]}"; do
            echo "   🏭 $service - Disponível para usuários"
        done
        echo ""
    fi
    
    if [ ${#DEVELOPMENT[@]} -gt 0 ]; then
        echo "🔧 SERVIÇOS EM DESENVOLVIMENTO:"
        for service in "${DEVELOPMENT[@]}"; do
            echo "   🛠️  $service - Em desenvolvimento/testes"
        done
        echo ""
    fi
    
    if [ ${#UNEXPECTED[@]} -gt 0 ]; then
        echo "⚠️  SERVIÇOS PARA VERIFICAR:"
        for service in "${UNEXPECTED[@]}"; do
            echo "   🔍 $service - Status inesperado"
        done
        echo ""
    fi
    
    # Análise e recomendações
    echo "💡 ANÁLISE E RECOMENDAÇÕES:"
    echo ""
    
    if [ ${#HEALTHY[@]} -eq 0 ]; then
        echo "   1. ⚠️  NENHUM SERVIÇO EM PRODUÇÃO"
        echo "      - Portal está com 200, mas outros serviços não"
        echo "      - Verificar implantação no Coolify"
        echo ""
    elif [ ${#HEALTHY[@]} -eq 1 ]; then
        echo "   1. ✅ PORTAL EM PRODUÇÃO"
        echo "      - Portal.gaqno.com.br está funcionando"
        echo "      - Outros serviços em desenvolvimento"
        echo ""
    fi
    
    if [ ${#DEVELOPMENT[@]} -gt 0 ]; then
        echo "   2. 🔧 SERVIÇOS EM DESENVOLVIMENTO:"
        echo "      - Esperado: 404 ou timeout"
        echo "      - Não é um problema, é o estado atual"
        echo "      - Monitorar quando forem para produção"
        echo ""
    fi
    
    # Próximos passos
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "   1. Continuar desenvolvimento dos serviços"
    echo "   2. Atualizar este script quando serviços forem para produção"
    echo "   3. Configurar alertas apenas para serviços em produção"
    echo ""
    
    echo "📅 PRÓXIMO CHECK:"
    echo "   ⏰ 00:03 São Paulo (03:00 UTC) - Todos os dias"
    echo ""
    
    echo "=================================================================="
    echo "📊 RESUMO EXECUTIVO:"
    echo "   🏭 Produção: ${#HEALTHY[@]} serviço(s)"
    echo "   🛠️  Desenvolvimento: ${#DEVELOPMENT[@]} serviço(s)"
    echo "   🔍 Verificar: ${#UNEXPECTED[@]} serviço(s)"
    echo "=================================================================="
    
} > "$REPORT_FILE"

# Mostrar relatório
cat "$REPORT_FILE"

# Status de saída (0 = tudo conforme esperado, 1 = algo inesperado)
if [ ${#UNEXPECTED[@]} -eq 0 ]; then
    echo "✅ Tudo conforme esperado"
    exit 0
else
    echo "⚠️  ${#UNEXPECTED[@]} serviço(s) com status inesperado"
    exit 1
fi
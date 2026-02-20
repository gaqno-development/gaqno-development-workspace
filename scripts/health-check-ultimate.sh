#!/bin/bash

# Health Check Ultimate - Simples, rápido e eficiente
# Substitui 8 cron jobs individuais por 1 job paralelizado

set -e

# Configuração
LOG_FILE="/var/log/gaqno-health/consolidated.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="/data/gaqno-development-workspace/.health-reports"
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$REPORT_DIR"

# Serviços (baseado nos logs reais)
# Portal: ✓ (200 OK)
# Omnichannel: ✓ (200 OK no log anterior)
# RPG: ✗ (404 - endpoint API)
declare -A SERVICES=(
    ["portal"]="https://portal.gaqno.com.br/health"
    ["sso"]="https://sso.gaqno.com.br/health"
    ["pdv"]="https://pdv.gaqno.com.br/health"
    ["ai"]="https://ai.gaqno.com.br/health"
    ["finance"]="https://finance.gaqno.com.br/health"
    ["rpg"]="https://api.gaqno.com.br/rpg/v1/health"  # Endpoint API
    ["omnichannel"]="https://omnichannel.gaqno.com.br/health"
    ["wellness"]="https://wellness.gaqno.com.br/health"
)

echo "=================================================================="
echo "🚀 HEALTH CHECK CONSOLIDADO - $(date)"
echo "=================================================================="
echo "📊 Serviços: ${#SERVICES[@]}"
echo "⚡ Execução: Paralela (todos simultâneos)"
echo "⏱️  Timeout: 5 segundos"
echo "📁 Log: $LOG_FILE"
echo ""

# Arrays para resultados
declare -a HEALTHY=()
declare -a UNHEALTHY=()
declare -a TIMEOUTS=()

# Função para check individual (executada em background)
check_service() {
    local name="$1"
    local url="$2"
    local pid=$$
    
    # Arquivo temporário para resultado
    local temp_file="/tmp/health_${name}_${pid}.tmp"
    
    # Executar curl com timeout
    local start_ms=$(($(date +%s%N)/1000000))
    
    if timeout 5 curl -s -f -o /dev/null -w "%{http_code}" "$url" > "$temp_file" 2>/dev/null; then
        local http_code=$(cat "$temp_file")
        local end_ms=$(($(date +%s%N)/1000000))
        local duration_ms=$((end_ms - start_ms))
        
        if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
            echo "✅ $name: HTTP $http_code (${duration_ms}ms)"
            echo "$(date -Iseconds)|HEALTHY|$name|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "HEALTHY:$name" > "/tmp/result_${name}_${pid}"
        else
            echo "❌ $name: HTTP $http_code (${duration_ms}ms)"
            echo "$(date -Iseconds)|UNHEALTHY|$name|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "UNHEALTHY:$name" > "/tmp/result_${name}_${pid}"
        fi
    else
        local end_ms=$(($(date +%s%N)/1000000))
        local duration_ms=$((end_ms - start_ms))
        echo "⏱️  $name: TIMEOUT (${duration_ms}ms)"
        echo "$(date -Iseconds)|TIMEOUT|$name|0|${duration_ms}ms" >> "$LOG_FILE"
        echo "TIMEOUT:$name" > "/tmp/result_${name}_${pid}"
    fi
    
    rm -f "$temp_file"
}

# Executar TODOS os checks em paralelo
echo "⚡ Executando checks em paralelo..."
for name in "${!SERVICES[@]}"; do
    check_service "$name" "${SERVICES[$name]}" &
done

# Aguardar todos completarem
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
            "UNHEALTHY")
                UNHEALTHY+=("$service_name")
                ;;
            "TIMEOUT")
                TIMEOUTS+=("$service_name")
                ;;
        esac
        rm -f "$result_file"
    fi
done

# Gerar relatório
REPORT_FILE="$REPORT_DIR/health_report_${TIMESTAMP}.txt"

{
    echo "=================================================================="
    echo "📋 RELATÓRIO DE HEALTH CHECK - $(date)"
    echo "=================================================================="
    echo ""
    echo "📊 ESTATÍSTICAS:"
    echo "   Total de serviços: ${#SERVICES[@]}"
    echo "   ✅ Saudáveis: ${#HEALTHY[@]}"
    echo "   ❌ Com problemas: ${#UNHEALTHY[@]}"
    echo "   ⏱️  Timeouts: ${#TIMEOUTS[@]}"
    echo ""
    
    if [ ${#HEALTHY[@]} -gt 0 ]; then
        echo "✅ SERVIÇOS SAUDÁVEIS:"
        for service in "${HEALTHY[@]}"; do
            echo "   - $service"
        done
        echo ""
    fi
    
    if [ ${#UNHEALTHY[@]} -gt 0 ]; then
        echo "❌ SERVIÇOS COM PROBLEMAS:"
        for service in "${UNHEALTHY[@]}"; do
            echo "   - $service"
        done
        echo ""
    fi
    
    if [ ${#TIMEOUTS[@]} -gt 0 ]; then
        echo "⏱️  SERVIÇOS COM TIMEOUT:"
        for service in "${TIMEOUTS[@]}"; do
            echo "   - $service"
        done
        echo ""
    fi
    
    # Recomendações
    echo "💡 RECOMENDAÇÕES:"
    if [ ${#UNHEALTHY[@]} -gt 0 ]; then
        echo "   1. Verificar endpoints dos serviços com problema"
        echo "   2. RPG service usa endpoint API: https://api.gaqno.com.br/rpg/v1/health"
    fi
    
    if [ ${#TIMEOUTS[@]} -gt 0 ]; then
        echo "   3. Serviços com timeout podem estar sobrecarregados"
    fi
    
    if [ ${#HEALTHY[@]} -eq ${#SERVICES[@]} ]; then
        echo "   🎉 TODOS OS SERVIÇOS ESTÃO SAUDÁVEIS!"
    fi
    
    echo ""
    echo "=================================================================="
    echo "⏰ Próximo check: 00:03 UTC (21:03 São Paulo)"
    echo "📁 Log completo: $LOG_FILE"
    echo "📄 Este relatório: $REPORT_FILE"
    echo "=================================================================="
} > "$REPORT_FILE"

# Mostrar resumo na tela
cat "$REPORT_FILE"

# Status de saída (0 = todos saudáveis, 1 = alguns problemas, 2 = muitos problemas)
TOTAL_PROBLEMS=$(( ${#UNHEALTHY[@]} + ${#TIMEOUTS[@]} ))
if [ $TOTAL_PROBLEMS -eq 0 ]; then
    exit 0
elif [ $TOTAL_PROBLEMS -le 2 ]; then
    exit 1
else
    exit 2
fi
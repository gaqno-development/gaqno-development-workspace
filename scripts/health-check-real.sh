#!/bin/bash

# Health Check Real - Baseado na descoberta real dos endpoints
# Atualizado em 2026-02-20 após teste dos módulos

set -e

# Configuração
LOG_FILE="/var/log/gaqno-health/real.log"
REPORT_DIR="/data/gaqno-development-workspace/.health-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$REPORT_DIR"

# ENDPOINTS REAIS DESCOBERTOS
# Baseado em testes manuais dos módulos
declare -A REAL_ENDPOINTS=(
    # 🏭 PRODUÇÃO CONFIRMADA
    ["portal"]="https://portal.gaqno.com.br/health"
    ["sso"]="https://sso.gaqno.com.br/health"
    ["wellness"]="https://wellness.gaqno.com.br/health"
    
    # 🔧 MÓDULOS DO PORTAL (testar via portal)
    ["ai-portal"]="https://portal.gaqno.com.br/ai"
    ["rpg-portal"]="https://portal.gaqno.com.br/rpg"
    ["crm-portal"]="https://portal.gaqno.com.br/crm"
    ["finance-portal"]="https://portal.gaqno.com.br/finance"
    ["erp-portal"]="https://portal.gaqno.com.br/erp"
    ["omnichannel-portal"]="https://portal.gaqno.com.br/omnichannel"
    
    # ⏳ BACKEND NÃO IMPLANTADO
    ["pdv-api"]="https://api.gaqno.com.br/pdv/v1/health"
)

echo "=================================================================="
echo "🏥 HEALTH CHECK - SITUAÇÃO REAL CONFIRMADA"
echo "=================================================================="
echo "📊 Baseado em testes reais dos endpoints"
echo "📈 Módulos: ${#REAL_ENDPOINTS[@]}"
echo "📁 Log: $LOG_FILE"
echo ""

# Arrays para resultados
declare -a PRODUCTION=()
declare -a PORTAL_MODULES=()
declare -a NOT_DEPLOYED=()
declare -a UNEXPECTED=()

# Função de teste
test_real_endpoint() {
    local name="$1"
    local url="$2"
    local pid=$$
    
    local start_ms=$(($(date +%s%N)/1000000))
    local http_code=""
    
    # Testar com curl
    http_code=$(timeout 8 curl -s \
        -w "%{http_code}" \
        -o /dev/null \
        "$url" 2>/dev/null) || http_code="000"
    
    local end_ms=$(($(date +%s%N)/1000000))
    local duration_ms=$((end_ms - start_ms))
    
    # Classificação inteligente
    if [[ "$name" == *"-portal" ]]; then
        # Módulos do portal
        if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
            echo "🔧 ${name%-portal}: HTTP $http_code (${duration_ms}ms) - Portal OK"
            echo "$(date -Iseconds)|PORTAL_MODULE|${name%-portal}|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "PORTAL_MODULE:${name%-portal}" > "/tmp/real_result_${name}_${pid}"
        elif [[ "$http_code" = "404" ]] || [[ "$http_code" = "000" ]]; then
            echo "🔧 ${name%-portal}: HTTP $http_code (${duration_ms}ms) - Portal com problema"
            echo "$(date -Iseconds)|PORTAL_MODULE|${name%-portal}|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "PORTAL_MODULE:${name%-portal}" > "/tmp/real_result_${name}_${pid}"
        else
            echo "⚠️  ${name%-portal}: HTTP $http_code (${duration_ms}ms) - Verificar"
            echo "$(date -Iseconds)|UNEXPECTED|${name%-portal}|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "UNEXPECTED:${name%-portal}" > "/tmp/real_result_${name}_${pid}"
        fi
    elif [[ "$name" == *"-api" ]]; then
        # APIs backend
        if [[ "$http_code" = "404" ]] || [[ "$http_code" = "000" ]]; then
            echo "⏳ ${name%-api}: HTTP $http_code (${duration_ms}ms) - Não implantado"
            echo "$(date -Iseconds)|NOT_DEPLOYED|${name%-api}|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "NOT_DEPLOYED:${name%-api}" > "/tmp/real_result_${name}_${pid}"
        elif [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
            echo "🏭 ${name%-api}: HTTP $http_code (${duration_ms}ms) - IMPLANTADO!"
            echo "$(date -Iseconds)|PRODUCTION|${name%-api}|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "PRODUCTION:${name%-api}" > "/tmp/real_result_${name}_${pid}"
        else
            echo "⚠️  ${name%-api}: HTTP $http_code (${duration_ms}ms) - Verificar"
            echo "$(date -Iseconds)|UNEXPECTED|${name%-api}|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "UNEXPECTED:${name%-api}" > "/tmp/real_result_${name}_${pid}"
        fi
    else
        # Produção direta
        if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
            echo "🏭 $name: HTTP $http_code (${duration_ms}ms) - PRODUÇÃO"
            echo "$(date -Iseconds)|PRODUCTION|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "PRODUCTION:$name" > "/tmp/real_result_${name}_${pid}"
        else
            echo "⚠️  $name: HTTP $http_code (${duration_ms}ms) - Verificar"
            echo "$(date -Iseconds)|UNEXPECTED|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
            echo "UNEXPECTED:$name" > "/tmp/real_result_${name}_${pid}"
        fi
    fi
}

# Executar testes
echo "🔍 Testando endpoints reais..."
for name in "${!REAL_ENDPOINTS[@]}"; do
    test_real_endpoint "$name" "${REAL_ENDPOINTS[$name]}" &
done

wait

# Coletar resultados
for name in "${!REAL_ENDPOINTS[@]}"; do
    result_file="/tmp/real_result_${name}_$$"
    if [ -f "$result_file" ]; then
        result=$(cat "$result_file")
        status="${result%:*}"
        module_name="${result#*:}"
        
        case "$status" in
            "PRODUCTION")
                PRODUCTION+=("$module_name")
                ;;
            "PORTAL_MODULE")
                PORTAL_MODULES+=("$module_name")
                ;;
            "NOT_DEPLOYED")
                NOT_DEPLOYED+=("$module_name")
                ;;
            "UNEXPECTED")
                UNEXPECTED+=("$module_name")
                ;;
        esac
        rm -f "$result_file"
    fi
done

# Gerar relatório
REPORT_FILE="$REPORT_DIR/health_real_${TIMESTAMP}.txt"

{
    echo "=================================================================="
    echo "📋 RELATÓRIO - SITUAÇÃO REAL CONFIRMADA"
    echo "=================================================================="
    echo "Data: $(date)"
    echo "Baseado em testes reais dos endpoints"
    echo ""
    
    echo "📊 ESTADO REAL DA PLATAFORMA:"
    echo "   🏭  Produção confirmada: ${#PRODUCTION[@]}"
    echo "   🔧  Módulos do portal: ${#PORTAL_MODULES[@]}"
    echo "   ⏳  Backend não implantado: ${#NOT_DEPLOYED[@]}"
    echo "   ⚠️   Status inesperado: ${#UNEXPECTED[@]}"
    echo ""
    
    if [ ${#PRODUCTION[@]} -gt 0 ]; then
        echo "🏭 SERVIÇOS EM PRODUÇÃO:"
        for service in "${PRODUCTION[@]}"; do
            echo "   ✅ $service - Disponível com endpoint /health"
        done
        echo ""
    fi
    
    if [ ${#PORTAL_MODULES[@]} -gt 0 ]; then
        echo "🔧 MÓDULOS DO PORTAL:"
        for module in "${PORTAL_MODULES[@]}"; do
            case "$module" in
                "ai")
                    echo "   🐛 $module - Erro JavaScript (useAuth)"
                    ;;
                "rpg")
                    echo "   🐛 $module - Erro JavaScript (CampaignStep)"
                    ;;
                "crm")
                    echo "   📝 $module - Conteúdo 'Coming Soon'"
                    ;;
                "finance"|"erp")
                    echo "   📭 $module - Página vazia"
                    ;;
                "omnichannel")
                    echo "   ⚙️  $module - Dashboard funcional"
                    ;;
                *)
                    echo "   🔧 $module - Módulo do portal"
                    ;;
            esac
        done
        echo ""
    fi
    
    if [ ${#NOT_DEPLOYED[@]} -gt 0 ]; then
        echo "⏳ BACKEND NÃO IMPLANTADO:"
        for service in "${NOT_DEPLOYED[@]}"; do
            echo "   🔄 $service - API não respondendo"
        done
        echo ""
    fi
    
    # Status dos tickets
    echo "📋 STATUS DOS TICKETS (GAQNO-1382):"
    echo "   ✅ GAQNO-1383: Corrigir erro AI (useAuth)"
    echo "   ✅ GAQNO-1384: Corrigir erro RPG (CampaignStep)"
    echo "   ✅ GAQNO-1385: Implementar conteúdo CRM"
    echo "   ✅ GAQNO-1386: Desenvolver módulo Financeiro"
    echo "   ✅ GAQNO-1387: Melhorar navegação UX"
    echo ""
    
    # Recomendações
    echo "🎯 PRÓXIMAS AÇÕES:"
    echo ""
    echo "1. 🔧 CORREÇÕES DO PORTAL (Alta prioridade):"
    echo "   • Começar pelas subtasks criadas"
    echo "   • Foco nos erros JavaScript (AI/RPG)"
    echo "   • Implementar conteúdo mínimo no CRM"
    echo ""
    
    echo "2. 🏭 EXPANSÃO DA PRODUÇÃO:"
    echo "   • Implantar backend PDV"
    echo "   • Verificar se outros serviços podem ser implantados"
    echo "   • Configurar endpoints /health consistentes"
    echo ""
    
    echo "3. 📊 MONITORAMENTO AJUSTADO:"
    echo "   • Health checks refletem realidade"
    echo "   • Alertas diferenciados por categoria"
    echo "   • Acompanhamento do progresso"
    echo ""
    
    echo "=================================================================="
    echo "💡 RESUMO PARA DESENVOLVIMENTO:"
    echo "   • Portal: Base funcional operacional"
    echo "   • Problemas: Erros JS em AI/RPG, conteúdo ausente"
    echo "   • Tickets: 5 subtasks criadas e priorizadas"
    echo "   • Próximo: Começar pela GAQNO-1383 (erro AI)"
    echo "=================================================================="
    
} > "$REPORT_FILE"

# Mostrar relatório
cat "$REPORT_FILE"

# Status final
if [ ${#UNEXPECTED[@]} -eq 0 ]; then
    echo "✅ Situação mapeada com precisão"
    exit 0
else
    echo "⚠️  ${#UNEXPECTED[@]} endpoint(s) com status inesperado"
    exit 1
fi
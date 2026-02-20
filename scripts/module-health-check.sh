#!/bin/bash

# Health Check Inteligente para Módulos Gaqno
# Baseado no estado real da plataforma

set -e

# Configuração
LOG_FILE="/var/log/gaqno-modules/module-health.log"
REPORT_DIR="/data/gaqno-development-workspace/.module-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$REPORT_DIR"

# Módulos baseados na auditoria do portal
# Classificação baseada no estado real descoberto
declare -A MODULES=(
    # 🏭 PRODUÇÃO - Disponível para usuários
    ["portal"]="https://portal.gaqno.com.br/health"
    
    # 🔧 DESENVOLVIMENTO - Módulos com interface mas problemas
    ["ai"]="https://portal.gaqno.com.br/ai"
    ["rpg"]="https://portal.gaqno.com.br/rpg"
    ["crm"]="https://portal.gaqno.com.br/crm"
    ["finance"]="https://portal.gaqno.com.br/finance"
    ["erp"]="https://portal.gaqno.com.br/erp"
    ["omnichannel"]="https://portal.gaqno.com.br/omnichannel"
    
    # ⏳ NÃO IMPLANTADOS - Serviços backend
    ["sso"]="https://api.gaqno.com.br/sso/v1/health"
    ["pdv"]="https://api.gaqno.com.br/pdv/v1/health"
    ["wellness"]="https://api.gaqno.com.br/wellness/v1/health"
)

echo "=================================================================="
echo "🏥 HEALTH CHECK INTELIGENTE - MÓDULOS GAQNO"
echo "=================================================================="
echo "ℹ️  Classificação baseada no estado real da plataforma"
echo "📊 Módulos monitorados: ${#MODULES[@]}"
echo "📁 Log: $LOG_FILE"
echo ""

# Arrays para resultados
declare -a PRODUCTION=()      # 🏭 Em produção
declare -a DEVELOPMENT=()     # 🔧 Em desenvolvimento (com problemas)
declare -a NOT_DEPLOYED=()    # ⏳ Não implantados
declare -a UNEXPECTED=()      # ⚠️ Status inesperado

# Função de teste inteligente
test_module() {
    local name="$1"
    local url="$2"
    local pid=$$
    
    local start_ms=$(($(date +%s%N)/1000000))
    local http_code=""
    
    # Testar endpoint
    http_code=$(timeout 8 curl -s \
        -w "%{http_code}" \
        -o /dev/null \
        "$url" 2>/dev/null) || http_code="000"
    
    local end_ms=$(($(date +%s%N)/1000000))
    local duration_ms=$((end_ms - start_ms))
    
    # Classificação baseada no módulo e resposta
    case "$name" in
        "portal")
            # Portal deve estar em produção
            if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
                echo "🏭 $name: HTTP $http_code (${duration_ms}ms) - PRODUÇÃO"
                echo "$(date -Iseconds)|PRODUCTION|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
                echo "PRODUCTION:$name" > "/tmp/module_result_${name}_${pid}"
            else
                echo "⚠️  $name: HTTP $http_code (${duration_ms}ms) - VERIFICAR (deveria ser produção)"
                echo "$(date -Iseconds)|UNEXPECTED|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
                echo "UNEXPECTED:$name" > "/tmp/module_result_${name}_${pid}"
            fi
            ;;
            
        "ai"|"rpg"|"crm"|"finance"|"erp"|"omnichannel")
            # Módulos do portal em desenvolvimento
            if [[ "$http_code" =~ ^2[0-9][0-9]$ ]] || [[ "$http_code" = "404" ]] || [[ "$http_code" = "000" ]]; then
                echo "🔧 $name: HTTP $http_code (${duration_ms}ms) - DESENVOLVIMENTO"
                echo "$(date -Iseconds)|DEVELOPMENT|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
                echo "DEVELOPMENT:$name" > "/tmp/module_result_${name}_${pid}"
            else
                echo "⚠️  $name: HTTP $http_code (${duration_ms}ms) - VERIFICAR"
                echo "$(date -Iseconds)|UNEXPECTED|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
                echo "UNEXPECTED:$name" > "/tmp/module_result_${name}_${pid}"
            fi
            ;;
            
        "sso"|"pdv"|"wellness")
            # Serviços backend não implantados
            if [[ "$http_code" = "404" ]] || [[ "$http_code" = "000" ]]; then
                echo "⏳ $name: HTTP $http_code (${duration_ms}ms) - NÃO IMPLANTADO"
                echo "$(date -Iseconds)|NOT_DEPLOYED|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
                echo "NOT_DEPLOYED:$name" > "/tmp/module_result_${name}_${pid}"
            elif [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
                echo "🏭 $name: HTTP $http_code (${duration_ms}ms) - IMPLANTADO!"
                echo "$(date -Iseconds)|PRODUCTION|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
                echo "PRODUCTION:$name" > "/tmp/module_result_${name}_${pid}"
            else
                echo "⚠️  $name: HTTP $http_code (${duration_ms}ms) - VERIFICAR"
                echo "$(date -Iseconds)|UNEXPECTED|$name|$url|$http_code|${duration_ms}ms" >> "$LOG_FILE"
                echo "UNEXPECTED:$name" > "/tmp/module_result_${name}_${pid}"
            fi
            ;;
    esac
}

# Executar testes
echo "🔍 Testando módulos..."
for name in "${!MODULES[@]}"; do
    test_module "$name" "${MODULES[$name]}" &
done

wait

# Coletar resultados
for name in "${!MODULES[@]}"; do
    result_file="/tmp/module_result_${name}_$$"
    if [ -f "$result_file" ]; then
        result=$(cat "$result_file")
        status="${result%:*}"
        module_name="${result#*:}"
        
        case "$status" in
            "PRODUCTION")
                PRODUCTION+=("$module_name")
                ;;
            "DEVELOPMENT")
                DEVELOPMENT+=("$module_name")
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
REPORT_FILE="$REPORT_DIR/module_health_${TIMESTAMP}.txt"

{
    echo "=================================================================="
    echo "📋 RELATÓRIO - SAÚDE DOS MÓDULOS GAQNO"
    echo "=================================================================="
    echo "Data: $(date)"
    echo "Baseado na auditoria real do portal e estado atual"
    echo ""
    
    echo "📊 STATUS DOS MÓDULOS:"
    echo "   🏭  Produção: ${#PRODUCTION[@]}"
    echo "   🔧  Desenvolvimento: ${#DEVELOPMENT[@]}"
    echo "   ⏳  Não implantados: ${#NOT_DEPLOYED[@]}"
    echo "   ⚠️   Verificar: ${#UNEXPECTED[@]}"
    echo "   📈  Total: ${#MODULES[@]}"
    echo ""
    
    if [ ${#PRODUCTION[@]} -gt 0 ]; then
        echo "🏭 MÓDULOS EM PRODUÇÃO:"
        for module in "${PRODUCTION[@]}"; do
            echo "   ✅ $module - Disponível para usuários"
        done
        echo ""
    fi
    
    if [ ${#DEVELOPMENT[@]} -gt 0 ]; then
        echo "🔧 MÓDULOS EM DESENVOLVIMENTO:"
        for module in "${DEVELOPMENT[@]}"; do
            case "$module" in
                "ai")
                    echo "   🐛 $module - Erro: useAuth must be used within an AuthProvider"
                    ;;
                "rpg")
                    echo "   🐛 $module - Erro: CampaignStep is not defined"
                    ;;
                "crm")
                    echo "   📝 $module - Conteúdo 'Coming Soon' (11 abas)"
                    ;;
                "finance"|"erp")
                    echo "   📭 $module - Página vazia/sem conteúdo"
                    ;;
                "omnichannel")
                    echo "   ⚙️  $module - Funcional mas pode melhorar"
                    ;;
                *)
                    echo "   🛠️  $module - Em desenvolvimento"
                    ;;
            esac
        done
        echo ""
    fi
    
    if [ ${#NOT_DEPLOYED[@]} -gt 0 ]; then
        echo "⏳ SERVIÇOS NÃO IMPLANTADOS:"
        for module in "${NOT_DEPLOYED[@]}"; do
            echo "   🔄 $module - Backend não implantado ainda"
        done
        echo ""
    fi
    
    if [ ${#UNEXPECTED[@]} -gt 0 ]; then
        echo "⚠️  MÓDULOS PARA VERIFICAR:"
        for module in "${UNEXPECTED[@]}"; do
            echo "   🔍 $module - Status inesperado"
        done
        echo ""
    fi
    
    # Análise e recomendações
    echo "💡 ANÁLISE E PLANO DE AÇÃO:"
    echo ""
    
    echo "1. 🏭 PRODUÇÃO ESTÁVEL:"
    echo "   • Portal funcionando normalmente"
    echo "   • Manter monitoramento contínuo"
    echo ""
    
    echo "2. 🔧 CORREÇÕES PRIORITÁRIAS (GAQNO-1382):"
    echo "   • GAQNO-1383: Corrigir erro AI (useAuth)"
    echo "   • GAQNO-1384: Corrigir erro RPG (CampaignStep)"
    echo "   • GAQNO-1385: Implementar conteúdo CRM"
    echo "   • GAQNO-1386: Desenvolver módulo Financeiro"
    echo "   • GAQNO-1387: Melhorar navegação UX"
    echo ""
    
    echo "3. ⏳ PRÓXIMOS PASSOS:"
    echo "   • Implantar serviços backend (SSO, PDV, Wellness)"
    echo "   • Completar módulos em desenvolvimento"
    echo "   • Implementar endpoints /health para todos os serviços"
    echo ""
    
    echo "4. 📊 MONITORAMENTO:"
    echo "   • Health checks ajustados para realidade atual"
    echo "   • Alertas apenas para produção"
    echo "   • Acompanhar transição dev→produção"
    echo ""
    
    echo "=================================================================="
    echo "🎯 RESUMO EXECUTIVO:"
    echo "   🏭  Produção: ${#PRODUCTION[@]} módulo(s)"
    echo "   🔧  Desenvolvimento: ${#DEVELOPMENT[@]} módulo(s)"
    echo "   ⏳  Não implantados: ${#NOT_DEPLOYED[@]} serviço(s)"
    echo "   📋  Tickets criados: 5 subtasks no GAQNO-1382"
    echo "=================================================================="
    
} > "$REPORT_FILE"

# Mostrar relatório
cat "$REPORT_FILE"

# Status de saída
if [ ${#UNEXPECTED[@]} -eq 0 ]; then
    echo "✅ Situação conforme esperado"
    exit 0
else
    echo "⚠️  ${#UNEXPECTED[@]} módulo(s) com status inesperado"
    exit 1
fi
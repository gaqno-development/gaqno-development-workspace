#!/bin/bash

# Script para criar subtasks para GAQNO-1382 usando curl

JIRA_URL="https://gaqno.atlassian.net"
EMAIL="gabriel.aquino@outlook.com"
TOKEN="ATATT3xFfGF0UzAmDlvKRT0Isu_v1-fzBDyE_tMVgn9JkCkH0ZE5waY2xRyKHRW08EEr7uqXjEv0ww6DdsKE1alVnpPS0mmAQIHvqOI6mberDOtoa54yYGV3sVMArX374dRfLFAIRtyTjnYg9M_hItIFeGmfEy96LK5brjvLhMeGiOX1axaKmf0=66ED92B3"
EPIC_KEY="GAQNO-1382"

echo "🚀 Criando subtasks para $EPIC_KEY (Correções Portal)"
echo "=================================================="

# Função para criar subtask
create_subtask() {
    local summary="$1"
    local description="$2"
    local labels="$3"
    local priority="$4"
    local points="$5"
    
    echo "📝 Criando: $summary"
    
    # Payload JSON
    local payload=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "GAQNO"
    },
    "summary": "$summary",
    "issuetype": {
      "name": "Sub-task"
    },
    "parent": {
      "key": "$EPIC_KEY"
    },
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "$description"
            }
          ]
        }
      ]
    },
    "priority": {
      "name": "$priority"
    },
    "labels": [$labels]
  }
}
EOF
)
    
    # Criar issue
    local response=$(curl -s -w "\n%{http_code}" \
        -u "$EMAIL:$TOKEN" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -X POST \
        --data "$payload" \
        "$JIRA_URL/rest/api/3/issue")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        local key=$(echo "$body" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
        echo "  ✅ Criada: $key"
        echo "  🔗 URL: $JIRA_URL/browse/$key"
        echo "$key|$summary|$priority" >> /tmp/created_tasks.txt
        return 0
    else
        echo "  ❌ Erro $http_code"
        echo "  Response: $body"
        return 1
    fi
}

# Array de subtasks
declare -a TASKS=(
    "Corrigir erro JavaScript: useAuth must be used within an AuthProvider (Módulo AI)"
    "Erro crítico no módulo AI do portal. O componente está tentando usar o hook useAuth fora de um AuthProvider. Corrigir o contexto de autenticação no módulo AI."
    "\"portal\",\"ai\",\"bug\",\"javascript\",\"critical\""
    "Highest"
    
    "Corrigir erro JavaScript: CampaignStep is not defined (Módulo RPG)"
    "Erro crítico no módulo RPG do portal. A variável CampaignStep não está definida. Verificar imports e definição do componente CampaignStep."
    "\"portal\",\"rpg\",\"bug\",\"javascript\",\"critical\""
    "Highest"
    
    "Implementar conteúdo mínimo no CRM (11 abas atualmente 'Coming Soon')"
    "O módulo CRM tem 11 abas funcionais mas sem conteúdo. Implementar conteúdo básico em cada aba: Dashboard, Clientes, Contatos, Oportunidades, etc."
    "\"portal\",\"crm\",\"content\",\"development\""
    "High"
    
    "Desenvolver módulo Financeiro (atualmente vazio)"
    "O módulo Financeiro está completamente vazio. Desenvolver funcionalidades básicas: Dashboard financeiro, Contas a pagar/receber, Relatórios, Integração bancária."
    "\"portal\",\"finance\",\"development\",\"new-feature\""
    "High"
    
    "Melhorar navegação e UX do sidebar"
    "O sidebar de navegação tem inconsistências. Melhorar: Indicadores visuais de página ativa, agrupamento lógico, responsividade, feedback visual."
    "\"portal\",\"ux\",\"navigation\",\"improvement\""
    "Medium"
)

# Limpar arquivo de resultados
> /tmp/created_tasks.txt

# Criar subtasks
success_count=0
total_tasks=$(( ${#TASKS[@]} / 4 ))

for ((i=0; i<${#TASKS[@]}; i+=4)); do
    summary="${TASKS[$i]}"
    description="${TASKS[$((i+1))]}"
    labels="${TASKS[$((i+2))]}"
    priority="${TASKS[$((i+3))]}"
    
    create_subtask "$summary" "$description" "$labels" "$priority"
    if [ $? -eq 0 ]; then
        ((success_count++))
    fi
    echo ""
done

# Resumo
echo "=================================================="
echo "📊 RESUMO DA CRIAÇÃO:"
echo "Total de subtasks criadas: $success_count/$total_tasks"

if [ -f /tmp/created_tasks.txt ] && [ -s /tmp/created_tasks.txt ]; then
    echo ""
    echo "📋 Subtasks criadas:"
    while IFS='|' read -r key summary priority; do
        echo "  • $key: $summary"
        echo "    Priority: $priority"
    done < /tmp/created_tasks.txt
    
    # Salvar relatório
    echo ""
    echo "📄 Relatório salvo em: /tmp/created_tasks.txt"
fi

# Status final
if [ $success_count -eq $total_tasks ]; then
    echo "🎉 Todas as subtasks foram criadas com sucesso!"
    exit 0
elif [ $success_count -gt 0 ]; then
    echo "⚠️  $success_count de $total_tasks subtasks criadas"
    exit 0
else
    echo "❌ Nenhuma subtask foi criada"
    exit 1
fi
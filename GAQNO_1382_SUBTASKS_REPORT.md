# Subtasks Criadas para GAQNO-1382 (Correções Portal)

## 📅 Data: 2026-02-20 22:12 UTC

## 🎯 **Contexto:**
Baseado na auditoria do portal.gaqno.com.br, foram criadas 5 subtasks prioritárias para corrigir os problemas identificados.

## ✅ **Subtasks Criadas:**

### **1. GAQNO-1383: Corrigir erro JavaScript: useAuth must be used within an AuthProvider (Módulo AI)**
- **Prioridade**: Highest
- **Labels**: `portal`, `ai`, `bug`, `javascript`, `critical`
- **Descrição**: Erro crítico no módulo AI do portal. O componente está tentando usar o hook useAuth fora de um AuthProvider. Corrigir o contexto de autenticação no módulo AI.
- **URL**: https://gaqno.atlassian.net/browse/GAQNO-1383

### **2. GAQNO-1384: Corrigir erro JavaScript: CampaignStep is not defined (Módulo RPG)**
- **Prioridade**: Highest  
- **Labels**: `portal`, `rpg`, `bug`, `javascript`, `critical`
- **Descrição**: Erro crítico no módulo RPG do portal. A variável CampaignStep não está definida. Verificar imports e definição do componente CampaignStep.
- **URL**: https://gaqno.atlassian.net/browse/GAQNO-1384

### **3. GAQNO-1385: Implementar conteúdo mínimo no CRM (11 abas atualmente 'Coming Soon')**
- **Prioridade**: High
- **Labels**: `portal`, `crm`, `content`, `development`
- **Descrição**: O módulo CRM tem 11 abas funcionais mas sem conteúdo. Implementar conteúdo básico em cada aba: Dashboard, Clientes, Contatos, Oportunidades, etc.
- **URL**: https://gaqno.atlassian.net/browse/GAQNO-1385

### **4. GAQNO-1386: Desenvolver módulo Financeiro (atualmente vazio)**
- **Prioridade**: High
- **Labels**: `portal`, `finance`, `development`, `new-feature`
- **Descrição**: O módulo Financeiro está completamente vazio. Desenvolver funcionalidades básicas: Dashboard financeiro, Contas a pagar/receber, Relatórios, Integração bancária.
- **URL**: https://gaqno.atlassian.net/browse/GAQNO-1386

### **5. GAQNO-1387: Melhorar navegação e UX do sidebar**
- **Prioridade**: Medium
- **Labels**: `portal`, `ux`, `navigation`, `improvement`
- **Descrição**: O sidebar de navegação tem inconsistências. Melhorar: Indicadores visuais de página ativa, agrupamento lógico, responsividade, feedback visual.
- **URL**: https://gaqno.atlassian.net/browse/GAQNO-1387

## 🔍 **Problemas Correspondentes (da Auditoria):**

### **Críticos (Alta Prioridade):**
1. **Módulo AI**: Erro `useAuth must be used within an AuthProvider` → **GAQNO-1383**
2. **Módulo RPG**: Erro `CampaignStep is not defined` → **GAQNO-1384**

### **Conteúdo Ausente (Média Prioridade):**
3. **CRM**: 11 abas com "Coming Soon" → **GAQNO-1385**
4. **Financeiro**: Página completamente vazia → **GAQNO-1386**

### **UX/UI (Baixa Prioridade):**
5. **Navegação**: Sidebar inconsistente → **GAQNO-1387**

## 🚀 **Sequência Recomendada de Desenvolvimento:**

### **Fase 1: Estabilização (Semana 1)**
1. **GAQNO-1383**: Corrigir erro AI (1-2 dias)
2. **GAQNO-1384**: Corrigir erro RPG (1-2 dias)
3. **Testes**: Verificar que ambos módulos funcionam

### **Fase 2: Conteúdo (Semana 2)**
4. **GAQNO-1385**: Implementar conteúdo CRM (3-4 dias)
5. **GAQNO-1386**: Desenvolver módulo Financeiro (3-4 dias)

### **Fase 3: Otimização (Semana 3)**
6. **GAQNO-1387**: Melhorar navegação UX (2-3 dias)
7. **Testes finais**: Validação completa

## 📊 **Estimativa de Esforço:**

| Subtask | Pontos | Dias Estimados | Prioridade |
|---------|--------|----------------|------------|
| GAQNO-1383 | 3 | 1-2 | Highest |
| GAQNO-1384 | 3 | 1-2 | Highest |
| GAQNO-1385 | 8 | 3-4 | High |
| GAQNO-1386 | 13 | 5-6 | High |
| GAQNO-1387 | 5 | 2-3 | Medium |
| **Total** | **32** | **12-17 dias** | |

## 🔧 **Tecnologias Envolvidas:**
- **Frontend**: React, TypeScript, Tailwind CSS
- **Autenticação**: Context API / AuthProvider
- **Componentes**: Shadcn UI (configurado via MCP)
- **API**: Endpoints REST do backend Gaqno
- **Estado**: React hooks, context

## 📁 **Arquivos Relacionados:**
1. **Auditoria**: `PORTAL_AUDIT_REPORT.md`
2. **Epic**: GAQNO-1382 (Correções e Melhorias do Portal Gaqno)
3. **Scripts**: `create-portal-subtasks.sh`, `module-health-check.sh`
4. **Health Check**: `health-check-real.sh` (atualizado)

## 🎯 **Critérios de Aceitação:**

### **Para GAQNO-1383/1384 (Erros JavaScript):**
- [ ] Módulo AI carrega sem erros no console
- [ ] Módulo RPG carrega sem erros no console
- [ ] Autenticação funciona corretamente
- [ ] Componentes renderizam normalmente

### **Para GAQNO-1385 (Conteúdo CRM):**
- [ ] 11 abas com conteúdo real (não "Coming Soon")
- [ ] Dados de exemplo consistentes
- [ ] Navegação entre abas funcional
- [ ] Responsividade mantida

### **Para GAQNO-1386 (Módulo Financeiro):**
- [ ] Dashboard financeiro com métricas
- [ ] Lista de contas a pagar/receber
- [ ] Gráficos básicos de receita/despesa
- [ ] Formulários de cadastro funcionais

### **Para GAQNO-1387 (Navegação UX):**
- [ ] Sidebar com indicador de página ativa
- [ ] Agrupamento lógico de itens
- [ ] Responsividade em mobile
- [ ] Feedback visual melhorado

## 📈 **Métricas de Sucesso:**
- **Erros críticos**: 0 no console
- **Conteúdo**: 100% das páginas com conteúdo real
- **UX**: NPS > 50 (após melhorias)
- **Performance**: Core Web Vitals dentro dos padrões

## 🔗 **Integrações Disponíveis:**
- ✅ **Jira MCP**: Tracking de progresso
- ✅ **Playwright MCP**: Testes automatizados
- ✅ **Shadcn MCP**: Componentes UI
- ✅ **Coolify MCP**: Deploy e monitoramento

## 🚀 **Próximos Passos:**

### **Imediatos:**
1. Atribuir subtasks ao responsável
2. Criar branches seguindo convenções (`story/GAQNO-1383`, etc.)
3. Iniciar desenvolvimento pela GAQNO-1383

### **Médio Prazo:**
4. Implementar testes automatizados com Playwright
5. Configurar CI/CD para deploy automático
6. Monitorar métricas de uso

### **Longo Prazo:**
7. Expandir para outros módulos (ERP, Organização, etc.)
8. Implementar features avançadas
9. Otimizar performance

---

**Status**: 5 subtasks criadas e priorizadas. Estrutura pronta para início imediato de desenvolvimento.

*Próxima ação: Iniciar desenvolvimento da GAQNO-1383 (erro AI)*
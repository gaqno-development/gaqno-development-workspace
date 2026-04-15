# Análise de Reutilização: fifia_doces → gaqno-dropshipping

## Resumo Executivo

Este documento mapeia todos os componentes, hooks, padrões e integrações reutilizáveis do projeto `fifia_doces` que podem ser adaptados e melhorados no projeto `gaqno-dropshipping`.

## 1. Hooks Reutilizáveis

### 1.1 use-cart.ts (Melhoria Significativa)
**Status:** ✅ Disponível no fifia_doces | ⚠️ Versão básica no dropshipping

**Melhorias do fifia_doces:**
- Type guard (`isCartItem`) para validação de dados do localStorage
- Eventos de sincronização cross-tab (`CART_EVENT`)
- Persistência com `localStorage`
- Cálculo de total com decorations
- Atualização de item decorations

**Arquivos Afetados no dropshipping:**
- `/hooks/use-cart.tsx` - Substituir implementação básica

---

### 1.2 use-viacep.ts (Novo)
**Status:** ✅ Disponível no fifia_doces | ❌ Não existe no dropshipping

**Funcionalidades:**
- Debounce de 400ms
- AbortController para cancelar requisições
- Tratamento de erro completo
- Retorno tipado: `{ data, loading, error }`

**Caso de Uso:** Formulários de checkout com preenchimento automático de endereço

**Arquivos Novos no dropshipping:**
- `/hooks/use-viacep.ts`

---

### 1.3 use-checkout.ts (Melhoria Significativa)
**Status:** ✅ Disponível no fifia_doces | ⚠️ Parcial no dropshipping

**Melhorias do fifia_doces:**
- Integração com useShipping (cálculo de frete)
- Integração com useViaCep
- Suporte a cupons de desconto
- Validação de data mínima (dias úteis)
- Toast notifications integradas

**Arquivos Afetados no dropshipping:**
- Novo arquivo: `/hooks/use-checkout.ts`

---

### 1.4 use-payment-confirmed.ts (Novo)
**Status:** ✅ Disponível no fifia_doces | ❌ Não existe no dropshipping

**Funcionalidade:** Hook para detectar quando pagamento é confirmado e disparar callback

**Arquivos Novos no dropshipping:**
- `/hooks/use-payment-confirmed.ts`

---

## 2. Componentes de UI Reutilizáveis

### 2.1 Toast System (Novo)
**Status:** ✅ Disponível no fifia_doces | ❌ Não existe no dropshipping

**Componentes:**
- `ToastProvider` - Context provider
- `useToast` - Hook com métodos: `success`, `error`, `warning`, `info`

**Funcionalidades:**
- Auto-dismiss com timer
- Múltiplos toasts simultâneos
- Animações CSS
- Acessibilidade (aria-live)

**Arquivos Novos no dropshipping:**
- `/components/ui/toast.tsx`

---

### 2.2 UI Components Básicos
**Status:** ✅ Disponíveis no fifia_doces | ⚠️ Parciais no dropshipping

| Componente | fifia_doces | dropshipping | Ação |
|------------|-------------|--------------|------|
| Button | ✅ Custom | ✅ Basic | Melhorar com variants |
| Card | ✅ Custom | ✅ Basic | Adicionar sombras warm |
| Badge | ✅ Custom | ❌ Ausente | Adicionar novo |
| Input | ✅ Custom | ❌ Ausente | Adicionar novo |
| Modal | ✅ Custom | ❌ Ausente | Adicionar novo |

**Arquivos Novos/Afetados:**
- `/components/ui/badge.tsx`
- `/components/ui/modal.tsx`
- Melhorar: `/components/ui/` existentes

---

## 3. Componentes de Store Reutilizáveis

### 3.1 Product Card (Melhoria)
**Status:** ✅ fifia_doces tem versão superior | ⚠️ dropshipping tem versão básica

**Melhorias do fifia_doces:**
- Animação hover (scale + shadow)
- Placeholder SVG quando sem imagem
- Gradientes sutis
- Tipografia com font-serif
- Cores warm (accent, secondary)

**Arquivos Afetados:**
- `/components/store/product-card.tsx` - Atualizar design

---

### 3.2 Payment Components (Melhoria Significativa)

#### PixPaymentCard
**Status:** ✅ fifia_doces completo | ⚠️ dropshipping básico

**Melhorias:**
- Status tracking (CONFIRMED, AWAITING_PAYMENT, REFUNDED)
- Countdown timer para expiração
- Callback `onPaymentConfirmed`
- Badge de status

**Arquivos Afetados:**
- `/components/store/pix-payment-card.tsx`

#### CheckoutProPaymentCard
**Status:** ✅ fifia_doces completo | ⚠️ dropshipping básico

**Melhorias:**
- Status tracking
- Callback `onPaymentConfirmed`
- Badge de status

**Arquivos Afetados:**
- `/components/store/checkout-pro-card.tsx`

---

### 3.3 Cart Components

#### Cart Drawer (Novo)
**Status:** ✅ fifia_doces | ❌ dropshipping

**Funcionalidades:**
- Drawer lateral com animação
- Lista de itens com thumbnails
- Controles de quantidade
- Total e botão de checkout

**Arquivos Novos:**
- `/components/store/cart-drawer.tsx`

#### Cart Badge (Melhoria)
**Status:** ✅ fifia_doces | ⚠️ dropshipping

**Melhorias:**
- Animação pulse quando item adicionado
- Contador com badge

---

### 3.4 Order Components

#### Order Status Tracker (Novo)
**Status:** ✅ fifia_doces | ❌ dropshipping

**Funcionalidades:**
- Timeline visual do pedido
- Status atual destacado
- Cores por status

**Arquivos Novos:**
- `/components/store/order-status-tracker.tsx`

#### Pedido Detail View (Novo)
**Status:** ✅ fifia_doces | ⚠️ dropshipping parcial

**Funcionalidades:**
- Visualização completa do pedido
- Integração com payment cards
- Timeline de eventos

---

## 4. Sistemas e Configurações

### 4.1 Feature Flags (Novo)
**Status:** ✅ fifia_doces | ❌ dropshipping

**Funcionalidades:**
- Configuração por tenant
- Gating de features (shipping, coupons, checkoutPro, pix)
- Helper `featureGate()` para API routes

**Arquivos Novos:**
- `/config/features.ts`
- `/config/tenant.ts`

---

### 4.2 Toast Provider Integration
**Status:** ✅ fifia_doces | ❌ dropshipping

**Integração necessária:**
- Adicionar ao root layout
- Envolver providers existentes

---

## 5. Integrações Backend

### 5.1 MercadoPago Service (Melhoria)
**Status:** ⚠️ Ambos têm implementações similares

**Comparação:**
| Feature | fifia_doces | dropshipping |
|---------|-------------|--------------|
| PIX | ✅ | ✅ |
| Checkout Pro | ✅ | ✅ |
| Webhook signature | ✅ | ✅ |
| Search payments | ✅ | ✅ |
| Expiry config | 30min | 10min |

**Recomendação:** Manter dropshipping (mais recente), adicionar comentários

---

### 5.2 Order Flow Processor (Novo)
**Status:** ✅ fifia_doces (n8n workflow) | ⚠️ dropshipping parcial

**Funcionalidades:**
- Automação de emails por status
- Atualização automática de estoque
- Notificações

**Arquivo de Referência:**
- `n8n-workflow-order-emails.json`

---

## 6. Utilitários Reutilizáveis

### 6.1 Formatters
**Status:** ✅ fifia_doces | ⚠️ dropshipping

| Utilitário | fifia_doces | Ação |
|------------|-------------|------|
| formatCurrency | ✅ | Copiar para dropshipping |
| formatDate | ✅ | Copiar para dropshipping |
| cn (class merge) | ✅ | Verificar se existe |

---

### 6.2 Validators
**Status:** ✅ fifia_doces | ❌ dropshipping

- Order validators com Zod
- Coupon validators
- Shipping validators

---

## 7. Mapeamento de Fluxos de 10 Iterações

### Flow 1: Análise ✅
**Status:** Em progresso
- Documentar todos componentes reutilizáveis
- Identificar gaps

### Flow 2-3: Cart Hook Improvements
**Arquivos:** `/hooks/use-cart.tsx`
**Melhorias:**
- Adicionar type guards
- Sincronização cross-tab
- Eventos customizados

### Flow 4-5: Toast System
**Arquivos:** `/components/ui/toast.tsx`, `/app/layout.tsx`
**Implementação:**
- Toast provider
- useToast hook
- Integração no layout

### Flow 6-7: Feature Flags
**Arquivos:** `/config/features.ts`, `/config/tenant.ts`
**Implementação:**
- Sistema de feature flags
- Gating para API routes

### Flow 8-9: ViaCep Hook
**Arquivos:** `/hooks/use-viacep.ts`
**Implementação:**
- Hook com debounce
- Integração em checkout

### Flow 10-11: Pix Payment Card
**Arquivos:** `/components/store/pix-payment-card.tsx`
**Melhorias:**
- Status tracking
- Countdown timer
- Callbacks

### Flow 12-13: Checkout Pro Card
**Arquivos:** `/components/store/checkout-pro-card.tsx`
**Melhorias:**
- Status tracking
- Callbacks

### Flow 14-15: UI Components
**Arquivos:** `/components/ui/*.tsx`
**Adições:**
- Badge
- Modal
- Input
- Melhorias em existentes

### Flow 16-17: Product Card
**Arquivos:** `/components/store/product-card.tsx`
**Melhorias:**
- Animações
- Design system warm

### Flow 18-19: Order Status Tracker
**Arquivos:** `/components/store/order-status-tracker.tsx`
**Implementação:**
- Timeline visual
- Status colors

### Flow 20: Integration & Testing
**Tarefas:**
- Verificar builds
- Testar integrações
- Documentar mudanças

---

## 8. Checklist de Implementação

### Prioridade Alta
- [ ] Cart hook com type guards e sync
- [ ] Toast system
- [ ] Payment cards melhorados
- [ ] Order status tracker

### Prioridade Média
- [ ] ViaCep hook
- [ ] Feature flags
- [ ] UI components (Badge, Modal)
- [ ] Product card redesign

### Prioridade Baixa
- [ ] Cart drawer
- [ ] Cart badge melhorado
- [ ] Order detail view completo

---

## 9. Estatísticas

| Categoria | fifia_doces | dropshipping | Reutilizáveis |
|-----------|-------------|--------------|---------------|
| Hooks | 15 | 4 | 11 |
| UI Components | 8 | 3 | 5 |
| Store Components | 23 | 12 | 15 |
| Config Systems | 3 | 1 | 2 |
| Utils | 10+ | 3 | 7+ |

**Total estimado de arquivos a modificar/criar:** ~25
**Potencial de reuso:** ~65% dos componentes do fifia_doces

---

*Documento criado em: 2025-01-XX*
*Próximo passo: Iniciar Flow 2 - Planejamento do Cart Hook*

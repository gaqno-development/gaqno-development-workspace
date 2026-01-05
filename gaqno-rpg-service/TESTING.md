# Testing Guide - RPG Service

Este documento descreve os testes unitários e de integração criados para o módulo RPG.

## Estrutura dos Testes

```
gaqno-rpg-service/
├── src/
│   ├── sessions/
│   │   ├── sessions.service.spec.ts      # Unit tests
│   │   └── sessions.controller.spec.ts  # Integration tests
│   ├── characters/
│   │   ├── characters.service.spec.ts   # Unit tests
│   │   └── characters.controller.spec.ts # Integration tests
│   ├── narrator/
│   │   ├── narrator.service.spec.ts      # Unit tests
│   │   └── image.service.spec.ts         # Unit tests
│   └── actions/
│       └── actions.service.spec.ts        # Unit tests
└── test/
    └── sessions.e2e-spec.ts              # E2E tests
```

## Testes Criados

### 1. Testes Unitários - Services

#### SessionsService (`sessions.service.spec.ts`)
**Cobertura:**
- ✅ Criação de sessão com sucesso
- ✅ Criação de sessão sem descrição
- ✅ Listagem de sessões por usuário
- ✅ Filtro por tenantId
- ✅ Busca de sessão por ID
- ✅ NotFoundException quando sessão não existe
- ✅ Atualização de sessão
- ✅ Exclusão de sessão

**Executar:**
```bash
npm test -- sessions.service.spec.ts
```

#### CharactersService (`characters.service.spec.ts`)
**Cobertura:**
- ✅ Criação de personagem com sucesso
- ✅ NotFoundException se sessão não existe
- ✅ NotFoundException se userId não corresponde
- ✅ Listagem de personagens por sessão
- ✅ Busca de personagem por ID
- ✅ Atualização de personagem
- ✅ Exclusão de personagem

**Executar:**
```bash
npm test -- characters.service.spec.ts
```

#### NarratorService (`narrator.service.spec.ts`)
**Cobertura:**
- ✅ Geração de narrativa com sucesso
- ✅ Tratamento de erro do AI service (fallback)
- ✅ Parsing de resposta JSON string
- ✅ Parsing de resposta com campo content
- ✅ Fallback para critical success (natural 20)
- ✅ Fallback para critical failure (natural 1)

**Executar:**
```bash
npm test -- narrator.service.spec.ts
```

#### ImageService (`image.service.spec.ts`)
**Cobertura:**
- ✅ Geração de imagem com Stable Diffusion
- ✅ Geração de imagem com Gemini (quando API key disponível)
- ✅ Tratamento de erro na geração
- ✅ Suporte a diferentes aspect ratios

**Executar:**
```bash
npm test -- image.service.spec.ts
```

#### ActionsService (`actions.service.spec.ts`)
**Cobertura:**
- ✅ Submissão de ação com sucesso
- ✅ NotFoundException se sessão não existe
- ✅ Atualização de ficha de personagem
- ✅ Salvamento de atualizações de memória
- ✅ Salvamento de entrada de histórico
- ✅ Geração de imagens quando prompts disponíveis
- ✅ Ação sem personagem associado

**Executar:**
```bash
npm test -- actions.service.spec.ts
```

### 2. Testes de Integração - Controllers

#### SessionsController (`sessions.controller.spec.ts`)
**Cobertura:**
- ✅ POST /v1/rpg/sessions - criação bem-sucedida
- ✅ POST /v1/rpg/sessions - validação de campos obrigatórios
- ✅ GET /v1/rpg/sessions - listagem
- ✅ GET /v1/rpg/sessions/:id - busca por ID
- ✅ PATCH /v1/rpg/sessions/:id - atualização
- ✅ DELETE /v1/rpg/sessions/:id - exclusão

**Executar:**
```bash
npm test -- sessions.controller.spec.ts
```

#### CharactersController (`characters.controller.spec.ts`)
**Cobertura:**
- ✅ POST /v1/rpg/characters - criação bem-sucedida
- ✅ POST /v1/rpg/characters - validação de campos obrigatórios
- ✅ GET /v1/rpg/characters - listagem por sessão
- ✅ GET /v1/rpg/characters/:id - busca por ID
- ✅ PATCH /v1/rpg/characters/:id - atualização
- ✅ DELETE /v1/rpg/characters/:id - exclusão

**Executar:**
```bash
npm test -- characters.controller.spec.ts
```

### 3. Testes E2E

#### Sessions E2E (`test/sessions.e2e-spec.ts`)
**Cobertura:**
- ✅ POST /v1/rpg/sessions - criação completa com banco real
- ✅ POST /v1/rpg/sessions - validações
- ✅ GET /v1/rpg/sessions - listagem

**Executar:**
```bash
npm run test:e2e -- sessions.e2e-spec.ts
```

**Nota:** Os testes E2E requerem:
- Banco de dados configurado (DATABASE_URL no .env)
- Serviço AI disponível (para testes de ações)

## Executar Todos os Testes

```bash
# Todos os testes
npm test

# Com coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Apenas E2E
npm run test:e2e
```

## Cobertura de Testes

### Thresholds Configurados
- Branches: 70%
- Functions: 75%
- Lines: 75%
- Statements: 75%

### Status Atual

✅ **Testes Unitários:**
- SessionsService: 8 testes
- CharactersService: 7 testes
- NarratorService: 6 testes
- ImageService: 4 testes
- ActionsService: 7 testes
- **Total Unit: 32 testes**

✅ **Testes de Integração:**
- SessionsController: 6 testes
- CharactersController: 6 testes
- **Total Integration: 12 testes**

✅ **Testes E2E:**
- Sessions E2E: 2 testes
- WebSocket Gateway E2E: 8 testes
- **Total E2E: 10 testes**

**Total Geral: 54 testes**

## Dados de Teste

Os testes usam dados mockados e não requerem banco de dados real para testes unitários e de integração. Os testes E2E requerem:
- JWT token válido (exemplo fornecido nos testes)
- User ID: `a8cdf1d2-16d9-4bd8-81b1-810ff8ab0249`
- Tenant ID: `6ebf2ba8-2f2c-42b4-be43-7016c05023c3`

### WebSocket Gateway E2E (`test/websocket.e2e-spec.ts`)
**Cobertura:**
- ✅ Conexão de cliente WebSocket
- ✅ Join session em modo presentation
- ✅ Join session em modo player/master
- ✅ Rejeição de join sem userId em modo player
- ✅ Broadcast de action_result para todos os clientes
- ✅ Prevenção de submit_action em modo presentation
- ✅ Leave session
- ✅ Broadcast de update_requested

**Executar:**
```bash
npm run test:e2e -- websocket.e2e-spec.ts
```

Ou usando o script:
```bash
./test-websocket.sh
```

**Nota:** Este teste mocka o ActionsService para evitar dependência do AI service durante os testes.

## Próximos Passos

Para melhorar a cobertura de testes, considere adicionar:
- Testes E2E para characters e actions
- Testes de erro de banco de dados
- Testes de autenticação/autorização mais detalhados
- Testes de integração com AI service real (mockado)
- Testes de geração de imagem com diferentes providers


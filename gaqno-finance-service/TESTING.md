# Testing Guide

Este documento descreve os testes unitários e de integração criados para o módulo de transações.

## Testes Criados

### 1. Testes Unitários - `transactions.service.spec.ts`

Testa a lógica de negócio do `TransactionsService` com mocks do banco de dados.

**Cobertura:**
- ✅ Criação de transação com sucesso
- ✅ Validação de userId obrigatório
- ✅ Validação de descrição obrigatória
- ✅ Validação de amount > 0
- ✅ Validação de transaction_date obrigatória
- ✅ Tratamento de valores null
- ✅ Conversão de amount de string para number
- ✅ Transações recorrentes

**Executar:**
```bash
npm test -- transactions.service.spec.ts
```

**Status:** ✅ 8/8 testes passando

### 2. Testes de Integração - `transactions.controller.spec.ts`

Testa o controller com mocks do serviço, incluindo validação de DTOs e middleware de autenticação.

**Cobertura:**
- ✅ POST /v1/finance/transactions - criação bem-sucedida
- ✅ POST /v1/finance/transactions - validação de campos obrigatórios (description, amount, transaction_date)
- ✅ POST /v1/finance/transactions - transações recorrentes

**Executar:**
```bash
npm test -- transactions.controller.spec.ts
```

**Status:** ✅ 5/5 testes passando

### 3. Testes E2E - `test/transactions.e2e-spec.ts`

Testes end-to-end usando o AppModule completo com banco de dados real.

**Cobertura:**
- ✅ POST /v1/finance/transactions - criação completa
- ✅ POST /v1/finance/transactions - validações
- ✅ POST /v1/finance/transactions - diferentes tipos de transação
- ✅ GET /v1/finance/transactions - listagem
- ✅ GET /v1/finance/transactions - filtros por data

**Executar:**
```bash
npm test -- transactions.e2e-spec.ts
```

**Nota:** Os testes E2E requerem:
- Banco de dados configurado (DATABASE_URL no .env)
- Categoria válida no banco (category_id usado nos testes)

## Executar Todos os Testes

```bash
npm test
```

## Executar com Coverage

```bash
npm test -- --coverage
```

## Estrutura dos Testes

```
gaqno-finance-service/
├── src/
│   └── transactions/
│       ├── transactions.service.spec.ts    # Unit tests
│       └── transactions.controller.spec.ts # Integration tests
└── test/
    └── transactions.e2e-spec.ts              # E2E tests
```

## Dados de Teste

Os testes usam um JWT token válido decodificado do exemplo fornecido:
- User ID: `a8cdf1d2-16d9-4bd8-81b1-810ff8ab0249`
- Tenant ID: `6ebf2ba8-2f2c-42b4-be43-7016c05023c3`

## Status Atual

✅ **Todos os testes estão passando!**
- Testes unitários: 8/8 ✅
- Testes de integração: 5/5 ✅
- **Total: 13/13 testes passando**

## Próximos Passos

Para melhorar a cobertura de testes, considere adicionar:
- Testes para updateTransaction
- Testes para deleteTransaction
- Testes para getTransactionById
- Testes de erro de banco de dados
- Testes de autenticação/autorização


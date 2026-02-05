# API Contracts Convention

**Responsáveis:** @front-dev, @back-dev  
**Baseado em:** [SYSTEM-ARCHITECTURE-AUDIT.md](./SYSTEM-ARCHITECTURE-AUDIT.md)

---

## snake_case vs camelCase

### Regra

| Camada                         | Convenção  | Exemplo                                       |
| ------------------------------ | ---------- | --------------------------------------------- |
| **API (Backend)**              | snake_case | `transaction_date`, `category_id`, `due_date` |
| **Frontend (UI state, props)** | camelCase  | `transactionDate`, `categoryId`, `dueDate`    |

### Justificativa

- APIs REST/JSON costumam usar snake_case (convenção Python, Ruby, muitos backends)
- JavaScript/TypeScript usam camelCase
- A transformação deve ocorrer em **uma camada explícita**, não de forma ad hoc

---

## Onde transformar

### Backend → Frontend (Response)

**Opção A — Interceptor no API client:**

```ts
// No axios response interceptor
response.data = transformKeys(response.data, snakeToCamel);
```

**Opção B — No hook/service que consome a API:**

```ts
const { data } = await api.transactions.getAll();
return data.map((transaction) => snakeToCamel(transaction));
```

**Opção C — Manter snake_case no frontend quando espelha contrato:**

Se o frontend usa tipos que espelham a API (ex.: `IFinanceTransaction` com `transaction_date`), pode manter snake_case para evitar transformação. Documentar que "tipos de API espelham backend".

**Recomendação atual:** Documentar que a API usa snake_case. Frontend pode:

- Usar tipos com snake_case quando espelham a API (menos transformação)
- Ou transformar na camada de serviço/hook para camelCase no restante do app

---

## Frontend → Backend (Request)

**Regra:** O payload enviado ao backend deve usar **snake_case** se a API espera snake_case.

**Opção A — Transformar antes do POST/PATCH:**

```ts
const payload = camelToSnake(createTransactionInput);
await api.transactions.create(payload);
```

**Opção B — Tipos de request já em snake_case:**

```ts
// ICreateTransactionInput usa transaction_date, category_id, etc.
await api.transactions.create(data);
```

---

## Shared types (@gaqno-backcore)

Os tipos em `@gaqno-backcore/types/shared` devem refletir o **contrato da API** (snake_case) quando forem usados para DTOs e requests/responses.

Exemplo: `CreateTransactionInput` usa `transaction_date`, `category_id` — alinhado ao backend.

---

## Resumo

| Direção            | Convenção no wire        | Onde transformar (se necessário)      |
| ------------------ | ------------------------ | ------------------------------------- |
| Backend → Frontend | snake_case               | Interceptor ou hook                   |
| Frontend → Backend | snake_case               | Antes do request ou tipos já em snake |
| Tipos shared       | snake_case (espelha API) | —                                     |
| UI/estado local    | camelCase                | —                                     |

**Princípio:** Uma única decisão por projeto. Documentar e manter consistência.

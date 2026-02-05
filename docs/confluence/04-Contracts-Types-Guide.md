# Contracts & Types Guide

**Document Type:** Confluence Page  
**Last Updated:** 2025-02-05  
**Source:** Derived from gaqno-development-workspace shared packages and services

---

## 1. Source of Truth for Contracts

| Layer                     | Source                 | Location                                                     |
| ------------------------- | ---------------------- | ------------------------------------------------------------ |
| **Backend domain types**  | @gaqno-backcore        | `types/shared/*.ts`                                          |
| **Frontend domain types** | @gaqno-frontcore       | `types/shared/*.ts` (should re-export backcore when unified) |
| **API wire format**       | Backend DTOs           | snake_case                                                   |
| **Zod (when used)**       | Validation + inference | Co-located with DTOs or in shared                            |

**Current state:** backcore and frontcore have parallel type structures. Consolidation planned: backcore as source, frontcore re-exports.

---

## 2. Zod / Shared Schema Strategy

- **Backend:** class-validator on DTOs
- **Frontend:** Use Zod where validation is needed; infer types from schemas
- **Shared:** When both need validation, define in @gaqno-backcore and re-export

---

## 3. DTO ↔ Frontend Alignment Rules

### API Contract (snake_case)

| Direction          | Wire Format | Example                           |
| ------------------ | ----------- | --------------------------------- |
| Backend → Frontend | snake_case  | `transaction_date`, `category_id` |
| Frontend → Backend | snake_case  | Same                              |

### Shared Types

- `@gaqno-backcore/types/shared` reflects API contract (snake_case)
- Example: `CreateTransactionInput` uses `transaction_date`, `category_id`

### DTO Implementation

- DTOs should `implements ICreateTransactionInput` (or equivalent)
- Requires workspace resolution: `@gaqno-development/backcore` or `workspace:*`

---

## 4. Naming, Serialization, Dates, Enums

### Naming

| Context                        | Convention                            |
| ------------------------------ | ------------------------------------- |
| API (JSON)                     | snake_case                            |
| TypeScript (backend)           | snake_case when mirroring API         |
| TypeScript (frontend UI state) | camelCase                             |
| Transform layer                | Explicit: snakeToCamel / camelToSnake |

### Dates

- API: ISO 8601 strings
- Frontend: Date objects or dayjs; transform at boundary

### Enums

- Prefer string unions in shared types
- Backend: enum in DB; map to string in DTO

---

## 5. Common Failure Modes

| Failure                   | Cause                                              | Mitigation                                          |
| ------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| **Contract drift**        | DTO changed, frontend not updated                  | DTOs implement shared interfaces                    |
| **Type duplication**      | backcore + frontcore both define                   | Unify: backcore source, frontcore re-export         |
| **snake/camel mismatch**  | Frontend expects camelCase, API returns snake_case | Document; add transform layer or use snake in types |
| **any in mocks**          | Tests use `any` for speed                          | Use minimal interfaces                              |
| **Ad-hoc types in hooks** | Hook defines own response type                     | Use shared types from backcore/frontcore            |

---

## 6. Required Alignments (from Audit)

1. DTOs → Shared interfaces: Create interfaces in @gaqno-backcore; DTOs implement
2. Zod as source: Use Zod for validation; infer types
3. Remove `any` in tests: Type mocks with minimal interfaces
4. snake vs camel: Document; single transform layer

---

## References

- [API-CONTRACTS-CONVENTION.md](../../API-CONTRACTS-CONVENTION.md)
- [System Architecture Overview](./01-System-Architecture-Overview.md)

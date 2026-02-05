# Architectural Rules & Guardrails

**Document Type:** Confluence Page  
**Last Updated:** 2025-02-05  
**Source:** Extracted from gaqno-development-workspace audits and conventions

---

## 1. Non-Negotiable Rules

| #   | Rule                                 | Enforcement                                   |
| --- | ------------------------------------ | --------------------------------------------- |
| 1   | **Logic in hooks, not components**   | Frontend Architecture Enforcer                |
| 2   | **API client from frontcore**        | No local lib/api-client.ts                    |
| 3   | **DTOs implement shared interfaces** | Contracts & Types Guardian                    |
| 4   | **API uses snake_case**              | Documented; DTOs follow                       |
| 5   | **No `any` in production code**      | ESLint; use Record<string, unknown> if needed |
| 6   | **Shell = host only**                | Migrate admin pages to MFE                    |

---

## 2. Common Violations (from Repo)

### Frontend

| Violation          | Example                              | Fix                                     |
| ------------------ | ------------------------------------ | --------------------------------------- |
| Logic in component | SaasCostingContent with state in App | Extract to CostingPage + useCostingData |
| Local API client   | gaqno-finance-ui/lib/api-client.ts   | Use createAxiosClient from frontcore    |
| Missing hooks      | Admin pages without use\*Page        | Create hooks per page                   |
| `any` in tests     | useRpgWebSocket(options: any)        | Type with minimal interface             |
| `as any` in config | vite.config shared config            | Use proper type from plugin             |

### Backend

| Violation                    | Example                                | Fix                                  |
| ---------------------------- | -------------------------------------- | ------------------------------------ |
| DTO without shared interface | CreateTransactionDto                   | implements CreateTransactionInput    |
| Types duplicated             | backcore + frontcore both have user.ts | backcore source; frontcore re-export |

### Cross-Cutting

| Violation                   | Example                                   | Fix                              |
| --------------------------- | ----------------------------------------- | -------------------------------- |
| Shell overloaded            | 19 admin pages in shell                   | Migrate to gaqno-admin-ui        |
| Inconsistent error handling | Some hooks return { error }, others throw | Document convention; standardize |

---

## 3. Examples Extracted from Repo

### ✅ Correct: Hook with Logic

```ts
// gaqno-rpg-ui/src/hooks/useSessionData.ts
export function useSessionData(sessionId: string) {
  const [data, setData] = useState<SessionData | null>(null);
  // ... fetch logic
  return { data, isLoading, error };
}
```

### ❌ Incorrect: Logic in Component

```tsx
// Before: App.tsx with inline state and fetch
const [costing, setCosting] = useState(...);
useEffect(() => { fetch(...) }, []);
```

### ✅ Correct: API Client from Frontcore

```ts
import { createAxiosClient } from "@gaqno-development/frontcore";
const client = createAxiosClient({ baseURL: ... });
```

### ❌ Incorrect: Local API Client

```ts
// gaqno-finance-ui/lib/api-client.ts - duplicate
const client = axios.create({ ... });
```

---

## 4. How PRs Are Validated

| Check              | Tool/Process                                |
| ------------------ | ------------------------------------------- |
| Lint               | ESLint (turbo run lint)                     |
| Tests              | turbo run test                              |
| Commit message     | Husky + commitlint (conventional)           |
| Architecture       | Manual review; reference Confluence docs    |
| Contract alignment | Manual; DTO changes require frontend review |

**Future:** Consider adding custom ESLint rules for:

- No `any` in production
- Hooks in hooks/ not in components
- No local api-client when frontcore provides

---

## 5. Deferred Refactors

| Refactor                          | Priority | Blocker                      |
| --------------------------------- | -------- | ---------------------------- |
| Migrate shell admin pages         | P1       | Effort                       |
| Unify types (backcore source)     | P2       | Coordination                 |
| DTOs implement shared             | P2       | Workspace package resolution |
| Break useMasterDashboard          | P2       | Effort                       |
| Padronize API client (finance-ui) | P2       | Effort                       |
| Test coverage (admin, saas)       | P3       | Time                         |

---

## References

- [System Architecture Overview](./01-System-Architecture-Overview.md)
- [Frontend Architecture Guide](./02-Frontend-Architecture-Guide.md)
- [Backend Architecture Guide](./03-Backend-Architecture-Guide.md)
- [Contracts & Types Guide](./04-Contracts-Types-Guide.md)
- [REFACTORING-ROADMAP.md](../../REFACTORING-ROADMAP.md)

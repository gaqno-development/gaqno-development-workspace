# API Client Refactoring Plan - All Services

## Overview

**ARCHITECTURE UPDATE**: Remove service-level `api-client.ts` files entirely. All API calls are made directly in React Query hooks using `coreAxiosClient` from `@gaqno-frontcore`. This eliminates an unnecessary abstraction layer and simplifies the codebase.

Consolidate all API calls across all micro-frontends into React Query hooks, separating queries and mutations into dedicated files. All services will use the centralized `coreAxiosClient` from `@gaqno-frontcore` for consistent 401 handling and authentication.

## Services

1. **AI Service** ✅ (Completed)
2. **Finance Service** (In Progress)
3. **CRM Service** (Pending)
4. **ERP Service** (Pending)
5. **PDV Service** (Pending)
6. **SSO Service** (Pending - if needed)

---

## 1. AI Service ✅ COMPLETED

### Status
- ✅ Removed `api-client.ts` entirely
- ✅ Updated all query hooks to use `coreAxiosClient.ai` directly
- ✅ Updated all mutation hooks to use `coreAxiosClient.ai` directly
- ✅ Created query hooks in `src/hooks/queries/`
- ✅ Created mutation hooks in `src/hooks/mutations/`
- ✅ Updated all existing feature hooks to use consolidated hooks

### Structure
```
gaqno-ai/src/
  hooks/
    queries/
      useBooksQueries.ts
      useBookChaptersQueries.ts
      useBookItemsQueries.ts
      useBookSettingsQueries.ts
      useBookToneStyleQueries.ts
    mutations/
      useBooksMutations.ts
      useBookChaptersMutations.ts
      useBookItemsMutations.ts
      useBookSettingsMutations.ts
      useBookToneStyleMutations.ts
  features/books/hooks/
    useBooks.ts (updated to use consolidated hooks)
    useBookChapters.ts (updated)
    useBookBlueprint.ts (updated)
    useBookItems.ts (updated)
    useBookSettings.ts (updated)
    useBookToneStyle.ts (updated)
    useBookCover.ts (updated)
    useBookCharacters.ts (updated)
    useBookGlossary.ts (updated)
    useBookHistory.ts (updated)
    useBookExport.ts (updated)
```

---

## 2. Finance Service 🔄 IN PROGRESS

### Current State
- `api-client.ts` exists (needs to be removed)
- No React Query hooks exist yet

### Target Structure
```
gaqno-finance/src/
  hooks/
    queries/
      useTransactionsQueries.ts
      useCategoriesQueries.ts
      useSubcategoriesQueries.ts
      useCreditCardsQueries.ts
    mutations/
      useTransactionsMutations.ts
      useCategoriesMutations.ts
      useSubcategoriesMutations.ts
      useCreditCardsMutations.ts
```

### Implementation Steps

1. **Remove `api-client.ts`**
   - Delete the file entirely
   - All API calls will be made directly in hooks

2. **Create Query Hooks**
   - `useTransactionsQueries`: getAll, getById
   - `useCategoriesQueries`: getAll, getById
   - `useSubcategoriesQueries`: getAll, getById
   - `useCreditCardsQueries`: getAll, getById

3. **Create Mutation Hooks**
   - `useTransactionsMutations`: create, update, delete
   - `useCategoriesMutations`: create, update, delete
   - `useSubcategoriesMutations`: create, update, delete
   - `useCreditCardsMutations`: create, update, delete

4. **Update Existing Components**
   - Replace direct `api.*` calls with React Query hooks
   - Ensure proper query invalidation on mutations

---

## 3. CRM Service 📋 PENDING

### Current State
- Need to check if API client exists
- Need to identify all resources/endpoints

### Target Structure
```
gaqno-crm/src/
  hooks/
    queries/
      useCrmQueries.ts (or specific resource queries)
    mutations/
      useCrmMutations.ts (or specific resource mutations)
```

### Implementation Steps

1. **Audit CRM Service**
   - Check for existing API client (will be removed)
   - Identify all resources and endpoints
   - Document API structure

2. **Remove API Client** (if exists)
   - Delete `api-client.ts` file
   - All API calls will be made directly in hooks

3. **Create React Query Hooks**
   - Follow same pattern as AI/Finance services
   - Separate queries and mutations

---

## 4. ERP Service 📋 PENDING

### Current State
- Need to check if API client exists
- Need to identify all resources/endpoints

### Target Structure
```
gaqno-erp/src/
  hooks/
    queries/
      useErpQueries.ts (or specific resource queries)
    mutations/
      useErpMutations.ts (or specific resource mutations)
```

### Implementation Steps

1. **Audit ERP Service**
   - Check for existing API client
   - Identify all resources and endpoints
   - Document API structure

2. **Create API Client** (if needed)
   - Use `coreAxiosClient.erp`
   - Define all API methods

3. **Create React Query Hooks**
   - Follow same pattern as AI/Finance services
   - Separate queries and mutations

---

## 5. PDV Service 📋 PENDING

### Current State
- Need to check if API client exists
- Need to identify all resources/endpoints

### Target Structure
```
gaqno-pdv/src/
  hooks/
    queries/
      usePdvQueries.ts (or specific resource queries)
    mutations/
      usePdvMutations.ts (or specific resource mutations)
```

### Implementation Steps

1. **Audit PDV Service**
   - Check for existing API client
   - Identify all resources and endpoints
   - Document API structure

2. **Create API Client** (if needed)
   - Use `coreAxiosClient.pdv`
   - Define all API methods

3. **Create React Query Hooks**
   - Follow same pattern as AI/Finance services
   - Separate queries and mutations

---

## 6. SSO Service 📋 PENDING

### Current State
- SSO is typically handled by `@gaqno-frontcore`
- May not need separate hooks if already centralized

### Implementation Steps

1. **Audit SSO Service**
   - Check if hooks already exist in `@gaqno-frontcore`
   - Identify if any SSO-specific hooks are needed in `gaqno-sso`
   - Document current structure

2. **Create Hooks** (if needed)
   - Follow same pattern as other services
   - Use `coreAxiosClient.sso`

---

## Common Patterns

### Direct API Calls in Hooks Pattern
```typescript
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';

const serviceClient = coreAxiosClient.{serviceName};

// No intermediate api-client.ts file needed!
// All calls are made directly in hooks
```

### Query Hook Pattern
```typescript
import { useQuery } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import { transformers } from '@/lib/api-transformers'; // if needed

const serviceClient = coreAxiosClient.{serviceName};

export const useResourceQueries = () => {
  const getAll = useQuery({
    queryKey: ['resource'],
    queryFn: async () => {
      const response = await serviceClient.get('/resource');
      return transformers.resources(response.data); // if transformation needed
    },
  });

  const getById = (id: string) => useQuery({
    queryKey: ['resource', id],
    queryFn: async () => {
      const response = await serviceClient.get(`/resource/${id}`);
      return transformers.resource(response.data); // if transformation needed
    },
    enabled: !!id,
  });

  return { getAll, getById };
};
```

### Mutation Hook Pattern
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coreAxiosClient } from '@gaqno-dev/frontcore/utils/api';
import { transformers } from '@/lib/api-transformers'; // if needed

const serviceClient = coreAxiosClient.{serviceName};

export const useResourceMutations = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (data) => {
      const response = await serviceClient.post('/resource', data);
      return transformers.resource(response.data); // if transformation needed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource'] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await serviceClient.patch(`/resource/${id}`, data);
      return transformers.resource(response.data); // if transformation needed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource'] });
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id) => {
      await serviceClient.delete(`/resource/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource'] });
    },
  });

  return { create, update, delete: deleteResource };
};
```

---

## Benefits

- ✅ **No intermediate API client layer** - Direct calls in hooks simplify architecture
- ✅ Centralized API client logic in `@gaqno-frontcore`
- ✅ Consistent 401 handling across all services
- ✅ Better separation of queries and mutations
- ✅ Easier to maintain and test
- ✅ Consistent query keys and invalidation patterns
- ✅ Reusable hooks across components
- ✅ Type-safe API calls
- ✅ Less code duplication - transformers/data transformation happens in hooks

---

## Next Steps

1. ✅ Complete AI service refactoring
2. 🔄 Refactor Finance service API client
3. 🔄 Create Finance service React Query hooks
4. 📋 Audit and refactor CRM service
5. 📋 Audit and refactor ERP service
6. 📋 Audit and refactor PDV service
7. 📋 Audit SSO service hooks


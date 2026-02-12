# Epic GAQNO-1112 — Story breakdown & GAQNO-1115 checklist

Use this content to create Jira stories (GAQNO-1112) and to track Confluence/tests (GAQNO-1115).

---

## Part 1: GAQNO-1112 — Proposed stories and acceptance criteria

**Epic:** Limpeza e consistência da arquitetura frontend  
**Parent:** GAQNO-1112

---

### Story 1: Extract hooks from gaqno-rpg-ui components to src/hooks

**Summary:** Extract hooks from gaqno-rpg-ui components to src/hooks (or pages/*/hooks)

**Description:**  
Move inline hook logic from components into dedicated hooks under `src/hooks` (or co-located `pages/*/hooks`). Components listed in epic description: GameDashboard, PlayerGameBoard, PartyStatus, ObjectivesList, NarrativeFlow, MasterDashboardContent (usePlayerBoardData), EquipmentGrid, DialogSystem, CombatActions, CharacterCreationWizard, ActionsDialogContent, CollapsibleDialog, AnimatedDice, ActionDots, ChatLog, JoinSessionDialog, MasterActionChat, MonsterCard, PlayerCharacterHeader (useNextAbilities, usePlayerCharacterHeader), PlayerCharacterSheet, PlayerEquipmentDialog, PlayerActionChat, PlayerNameDialog, SendItemToPlayer, InventoryGrid.

**Acceptance criteria:**
- [ ] No hook logic remains inside `src/components/` for the listed components; logic lives in `src/hooks` or `pages/*/hooks`
- [ ] Components import and use the extracted hooks only
- [ ] Existing behavior preserved (no functional regression)
- [ ] Lint and existing tests pass

**Estimate:** Medium–High (many components)

---

### Story 2: Extract hooks from gaqno-ai-ui components to src/hooks

**Summary:** Extract hooks from gaqno-ai-ui components to src/hooks

**Description:**  
Move inline hook logic from components into `src/hooks`. Components: VideoUploadArea, VideoCreationPanel, ReferenceInputs, PromptTextarea, ImageCreationPanel (+ tabs), CreateBookWizard (BasicInfoStep, WorldSettingsStep, ToneStyleStep, StructureStep, ItemsStep, CharactersStep), CoverDesigner, CharacterList, CharacterEditor, ChapterEditor, BookStructureMap, BookForm, BlueprintStructure, BlueprintContextPanel, BlueprintContent, BlueprintCard, AudioCreationPanel (+ tabs), AISuggestionPopover.

**Acceptance criteria:**
- [ ] No hook logic remains inside `src/components/` for the listed components
- [ ] Hooks organized by domain (e.g. hooks/books/, hooks/ai/, hooks/video/) where it makes sense
- [ ] Components import and use the extracted hooks only
- [ ] Existing behavior preserved; lint and tests pass

**Estimate:** High (wizard and panels are large)

---

### Story 3: Extract hooks from gaqno-sso-ui and gaqno-omnichannel-ui

**Summary:** Extract hooks from gaqno-sso-ui and gaqno-omnichannel-ui components

**Description:**  
- gaqno-sso-ui: user-form (useUserForm), user-card (useUserCard) — move to hooks.  
- gaqno-omnichannel-ui: ExamplePanel (useExamplePanel) — move to hooks.

**Acceptance criteria:**
- [ ] useUserForm, useUserCard live in src/hooks (or equivalent) in gaqno-sso-ui
- [ ] useExamplePanel extracted in gaqno-omnichannel-ui
- [ ] Components only consume hooks; no logic in component bodies
- [ ] Lint and tests pass

**Estimate:** Small

---

### Story 4: Add barrel (index.ts) to MFE hook domains

**Summary:** Add barrel exports (index.ts) to MFE hook domains

**Description:**  
Add `index.ts` in hook domains that export public hooks. Start with gaqno-finance-ui `src/hooks/finance/`; apply same pattern to other MFEs where hooks are grouped by domain (e.g. rpg-ui, ai-ui).

**Acceptance criteria:**
- [ ] gaqno-finance-ui/src/hooks/finance/index.ts exists and re-exports public hooks
- [ ] Imports in the MFE use the barrel where appropriate (e.g. `from '@/hooks/finance'` or `from '../hooks/finance'`)
- [ ] No circular dependencies; build and lint pass
- [ ] Pattern documented in frontend-architecture (Confluence or repo) for other MFEs

**Estimate:** Small

---

### Story 5: Add tests for gaqno-finance-ui critical hooks

**Summary:** Add tests for gaqno-finance-ui critical hooks

**Description:**  
Add unit tests for: useTransactions, useCategories, useCreditCards, useFinanceSummary, useSubcategories. Co-locate with hooks or in `src/hooks/**/*.test.ts` / `*.spec.ts` per project convention.

**Acceptance criteria:**
- [ ] Each of the five hooks has at least one test file
- [ ] Tests cover success path and at least one error/empty state per hook where relevant
- [ ] Tests use minimal mocks (e.g. API client); no `any` types
- [ ] `turbo run test` (or equivalent) passes for gaqno-finance-ui

**Estimate:** Medium

---

### Story 6: Increase frontcore adoption in gaqno-crm-ui and gaqno-omnichannel-ui

**Summary:** Review and increase @gaqno-frontcore adoption in gaqno-crm-ui and gaqno-omnichannel-ui

**Description:**  
Today these MFEs use frontcore in few files. Align with frontend-architecture: use frontcore for UI primitives, contexts, utils, API client where applicable. Identify components that duplicate frontcore capabilities and refactor to import from @gaqno-frontcore.

**Acceptance criteria:**
- [ ] Audit done: list of components/pages in crm-ui and omnichannel-ui that could use frontcore (UI, contexts, utils) instead of local code
- [ ] At least the highest-impact duplicates refactored to use frontcore
- [ ] No new local `lib/api-client.ts` or equivalent; use createAxiosClient from frontcore
- [ ] Lint and tests pass; Confluence or repo doc updated if conventions change

**Estimate:** Medium

---

## Part 2: GAQNO-1115 — Confluence & tests checklist

**Epic:** Cobertura de testes e documentação de arquitetura  
**Use:** Track in Jira (GAQNO-1120, GAQNO-1121, GAQNO-1124) and/or Confluence.

---

### Confluence (architecture docs)

| Item | Status | Jira | Notes |
|------|--------|------|--------|
| System Architecture Overview (DDS) | Done | — | Page 589825, updated 2026-02 |
| Frontend Architecture Guide (DDS) | Done | GAQNO-1120 | Page 688129; sync with docs/architecture/frontend-architecture.md |
| Backend Architecture Guide (DDS) | Done | GAQNO-1121 | Page 720897 |
| Contracts & Types Guide (DDS) | Done | — | Page 819201 |
| Architectural Rules & Guardrails (DDS) | Done | — | Page 884737 |
| Health Dashboard (DDS) | Done | — | Page 917505 |
| DDS home and navigation | Done | — | Reorganized 2026-02 |

**Checklist (GAQNO-1120 / GAQNO-1121):**
- [ ] Confirm Confluence pages above reflect current codebase (MFEs, services, ports, modules)
- [ ] If gaps found: update Confluence and optionally add a short “Last audited” note on each page
- [ ] Close or comment GAQNO-1120 and GAQNO-1121 with link to DDS Overview and “Audited on &lt;date&gt;”

---

### Tests (critical hooks / services)

| Item | Status | Jira | Notes |
|------|--------|------|--------|
| gaqno-finance-ui hooks | Proposed in GAQNO-1112 | GAQNO-1124 / Epic 1112 Story 5 | useTransactions, useCategories, useCreditCards, useFinanceSummary, useSubcategories |
| gaqno-rpg-ui hooks | In progress / backlog | GAQNO-1124 | Prioritize hooks for session, campaign, combat, character |
| Other MFEs (ai-ui, sso-ui, etc.) | Backlog | — | After 1112 extractions, add tests for new hooks |

**Checklist (GAQNO-1124):**
- [ ] Define “critical hooks” for rpg-ui (e.g. session, campaign, game state) and add to GAQNO-1124 description
- [ ] Add at least one test per critical hook in rpg-ui; aim for >60% coverage on hooks directory
- [ ] Run `turbo run test` and fix failures; add to CI if not already
- [ ] Optionally: add one E2E or integration test for a critical flow (e.g. join session, create campaign)

---

### Quick reference

- **DDS Overview:** https://gaqno-development.atlassian.net/wiki/spaces/DDS/overview  
- **Confluence checklist (DDS):** https://gaqno-development.atlassian.net/wiki/spaces/DDS/pages/2785288  
- **Epic GAQNO-1115:** https://gaqno.atlassian.net/browse/GAQNO-1115  
- **Epic GAQNO-1112:** https://gaqno.atlassian.net/browse/GAQNO-1112  
- **Stories created for GAQNO-1112:** GAQNO-1318, 1319, 1320, 1321, 1322, 1323  

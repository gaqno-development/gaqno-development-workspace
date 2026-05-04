# gaqno Mastra integration certification

Mirror of [.cursor/skills/mastra/references/integration-certification.md](../../../../.cursor/skills/mastra/references/integration-certification.md). Update both when the matrix changes.

The Mastra runtime now spans **three packages**:

| Package | Folder | Role |
| --- | --- | --- |
| `@gaqno-development/mastra-runtime` | `@gaqno-mastra-runtime/` | Shared agents, tools, lib, constants, middleware. Bundled by tsup (esbuild). ESM-only. |
| `gaqno-mastra` | `gaqno-mastra/` | Operator Studio host — `mastra build --studio`, served at `mastra.gaqno.com.br`. |
| `gaqno-ai-service` Mastra module | `gaqno-ai-service/src/mastra/` | NestJS host that mounts `MastraModule` from `@mastra/nestjs` under `/v1/mastra`. |

## Checklist (re-run after Mastra upgrades or runtime API changes)

### A. Runtime (`@gaqno-mastra-runtime/`)

| Step | Command | Expected |
| --- | --- | --- |
| 1 | `npm run build -w @gaqno-development/mastra-runtime` | `tsup` builds 6 ESM entries to `dist/` in <1s |
| 2 | `npm test -w @gaqno-development/mastra-runtime` | 4 files, 21 vitest tests pass |
| 3 | `node --input-type=module -e "import('@gaqno-development/mastra-runtime').then(m => console.log(typeof m.createMastraInstance))"` | prints `function` |

### B. Operator host (`gaqno-mastra/`)

| Step | Command | Expected |
| --- | --- | --- |
| 1 | `ls node_modules/@gaqno-development/mastra-runtime/dist/index.js` | exists |
| 2 | `npm run build` (= `mastra build --studio`) | `.mastra/output/index.mjs` produced |
| 3 | `npm run ingest:codebase` (when Qdrant reachable) | Codebase collection upserted |

> Note: `npx tsc --noEmit` on `gaqno-mastra/` OOMs at >8GB heap due to Mastra's type graph. We do not run it in CI; `mastra build` (esbuild) is the source of truth.

### C. NestJS host (`gaqno-ai-service/`)

| Step | Command | Expected |
| --- | --- | --- |
| 1 | `grep -E "@mastra/(nestjs|core)" package.json` | both pinned, ai-service uses `@mastra/nestjs ^0.1.0` |
| 2 | Read `src/app.module.ts` | `MastraModule` imported **last** in the imports array |
| 3 | `npx jest src/mastra` | 5/5 pass (4 middleware + 1 module structure) |
| 4 | `npm run build` | NestJS dist compiles, no TS error from `await import('@gaqno-development/mastra-runtime')` |
| 5 | `curl -i http://localhost:4002/v1/mastra/api/agents` | 401 without JWT (JwtOrgGuard blocks first) |
| 6 | `curl -i -H "Authorization: Bearer $JWT" http://localhost:4002/v1/mastra/api/agents` | reaches Mastra adapter; lists `engineeringAgent`, `wppClientAgent`, `portalAgent` |
| 7 | Trace one tool call hitting `tenant-topics-search` | `RequestContext.tenantId` populated from middleware `x-tenant-id` (set by `MastraContextMiddleware` from `OrgContext`) |

### D. Dokploy

See [dokploy-runtime-and-ai-service.md](../../../.cursor/skills/mastra/references/dokploy-runtime-and-ai-service.md) for the full MCP playbook (env keys + redeploy for both apps).

## Last verification

| Field | Value |
| --- | --- |
| Date (UTC) | 2026-05-04 |
| Session | Portal-agent navigation flow + login/shell branding splash |
| Runtime build (A1) | `tsup` 76ms, 6 ESM entries (`dist/{index,agents,config,constants,lib,tools}/index.js`) |
| Runtime tests (A2) | 6 files, 29 tests pass (vitest) — adds `list-portal-features-tool.test.ts` (3) and `navigate-to-tool.test.ts` (5) |
| Runtime version | `@gaqno-development/mastra-runtime@0.2.0` (workspace symlink) |
| ai-service jest (agents + mastra) | 9 suites, 79 tests pass — includes `mastra-portal-bridge.service.spec.ts` (4) |
| ai-service `nest build` (C4) | OK, no TS errors. Bridge `await import('@gaqno-development/mastra-runtime')` compiles. |
| ai-service runtime dep (C-bridge) | `@gaqno-development/mastra-runtime ^0.2.0` resolved via workspace |
| Shell-ui chat + branding tests | `global-unified-llm-sheet.test.tsx` 4/4, `shell-layout-wrapper.test.tsx` 1/1, `public-layout.test.tsx` 3/3 (new `BrandLoader fullscreen while auth loading` cert added) |
| End-to-end AI navigation flow | shell sheet → `/v1/agents/unified-assistant/chat` → `AgentsService.chat` short-circuit → `MastraPortalBridgeService` → `portalAgent.generate` → `navigate-to` toolCalls in `AgentChatResponse` → `useUnifiedLlmChat.toolCalls` → `NavigateToolCard` "Abrir <Page>" buttons + suggested actions → `useNavigate(route) + setOpen(false)` |
| Skipped (require live infra) | B3 (Qdrant ingest), C5–C7 (live `/v1/mastra/api/agents` curl + tool tracing), D (Dokploy) |
| Dokploy MCP | Not executed this session; see `dokploy-runtime-and-ai-service.md` for the playbook |

## Branding loader — fixes applied this session

The aqn mark was previously invisible on `/login`, `/`, and during the pre-React paint because:

1. `index.html` only had `<div id="root"></div>` — blank flash before React mounts.
2. The placeholder `public/icon.svg` was a generic blue rectangle, not the gaqno mark.
3. `<PublicLayout>` rendered `<Outlet />` immediately, so `/login` showed the form before `useAuth().loading` resolved (no BrandLoader).

Applied:

| File | Change |
| --- | --- |
| `gaqno-shell-ui/public/aqn-mark.svg` | New standalone aqn-only SVG (cropped via `viewBox="300 670 1540 560"`, gradients preserved) |
| `gaqno-shell-ui/public/icon.svg` | Replaced placeholder favicon with the same gaqno aqn mark (smaller — only 5 gradients used) |
| `gaqno-shell-ui/index.html` | Pre-React HTML splash inside `#root` (auto-removed when React mounts), `gaqnoHtmlSplashPulse` keyframes, respects `prefers-reduced-motion`, dark `#0f0f14` background to match `theme-color` |
| `gaqno-shell-ui/src/components/public-layout.tsx` | Extracted `PublicLayoutContent` that gates on `useAuth().loading` and renders `<BrandLoader fullscreen />` until auth resolves; otherwise renders the existing `motion.div` + `<Outlet />` |
| `gaqno-shell-ui/src/components/public-layout.test.tsx` | Adds the loading-state assertion |

## Follow-ups

- After publishing a new `@gaqno-development/mastra-runtime` version: bump it in both `gaqno-mastra/package.json` **and** `gaqno-ai-service/package.json`, then run section A + B + C step 3.
- If `@mastra/nestjs` ships a v1, retest section C (handler signatures may change).
- `gaqno-mastra` `tsc --noEmit` remains intentionally skipped; rely on `mastra build` to catch type errors at deploy time.

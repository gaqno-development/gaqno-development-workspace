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
| Date (UTC) | 2026-05-03 |
| Session | Runtime extracted to `@gaqno-mastra-runtime/`; NestJS host wired in `gaqno-ai-service/src/mastra/` |
| Runtime build | `tsup` 91ms, 6 ESM entries |
| Runtime tests | 4 files, 21 tests pass |
| ai-service mastra tests | 5/5 pass (jest) |
| `gaqno-mastra` runtime resolution | OK (workspace symlink → tsup dist) |
| Dockerfile (`gaqno-mastra/`) | Updated for `NPM_TOKEN` + `@gaqno-development:registry` |
| Dokploy MCP | Steps documented; not executed (DOKPLOY_BASE_URL unreachable in this session) |

## Follow-ups

- After publishing a new `@gaqno-development/mastra-runtime` version: bump it in both `gaqno-mastra/package.json` **and** `gaqno-ai-service/package.json`, then run section A + B + C step 3.
- If `@mastra/nestjs` ships a v1, retest section C (handler signatures may change).
- `gaqno-mastra` `tsc --noEmit` remains intentionally skipped; rely on `mastra build` to catch type errors at deploy time.

# Running the Development Environment

**Importante:** Push apenas pelo workspace para que GitHub Actions disparem. Ver [WORKSPACE-WORKFLOW.md](./WORKSPACE-WORKFLOW.md).

---

## Turbo (default: `npm run dev`)

The workspace uses [Turbo](https://turbo.build/) to run all frontends and backends in parallel. Run:

```bash
npm run dev
```

This starts the **complete stack** (all 8 frontends + 5 backends) in a single terminal. Use `Ctrl+C` to stop everything.

### Full stack (13 apps)

| App                   | Port | Type     |
| --------------------- | ---- | -------- |
| gaqno-shell           | 3000 | Frontend |
| gaqno-sso             | 3001 | Frontend |
| gaqno-ai              | 3002 | Frontend |
| gaqno-crm             | 3003 | Frontend |
| gaqno-erp             | 3004 | Frontend |
| gaqno-finance         | 3005 | Frontend |
| gaqno-pdv             | 3006 | Frontend |
| gaqno-rpg             | 3007 | Frontend |
| gaqno-sso-service     | 4001 | Backend  |
| gaqno-ai-service      | 4002 | Backend  |
| gaqno-finance-service | 4005 | Backend  |
| gaqno-pdv-service     | 4006 | Backend  |
| gaqno-rpg-service     | 4007 | Backend  |

## Running subsets

**Backends only:**

```bash
npm run dev:backends
```

**Frontends only:**

```bash
npm run dev:frontends
```

**Single app** (in a separate terminal):

```bash
npm run dev:shell          # 3000 - main portal
npm run dev:ai             # 3002
npm run dev:sso-service    # 4001
# etc.
```

## Minimal stack for development

For shell + AI features, run each in a separate terminal:

```bash
npm run dev:shell
npm run dev:sso
npm run dev:ai
npm run dev:sso-service
npm run dev:ai-service
```

Or use `npm run dev` for the full stack in a single terminal.

# gaqno-mastra

Welcome to your new [Mastra](https://mastra.ai/) project! We're excited to see what you'll build.

## Getting Started

Start the development server:

```shell
npm run dev
```

Open [http://localhost:4111](http://localhost:4111) in your browser to access [Mastra Studio](https://mastra.ai/docs/studio/overview). It provides an interactive UI for building and testing your agents, along with a REST API that exposes your Mastra application as a local service. This lets you start building without worrying about integration right away.

You can start editing files inside the `src/mastra` directory. The development server will automatically reload whenever you make changes.

## Production (gaqno)

Base URL: [https://mastra.gaqno.com.br](https://mastra.gaqno.com.br) (Dokploy + Cloudflare Tunnel). Ensure `OPENAI_API_KEY` (and any other provider secrets) are set in Dokploy for the app.

**Dokploy checklist:** set `MASTRA_CORS_ORIGINS` for the portal origin when a browser client (shell or MFE) calls Mastra’s HTTP API from the browser. Restrict **`mastra.gaqno.com.br`** to operators (e.g. Cloudflare Zero Trust Access) so B2C users cannot open the operator server UI.

### Dokploy app (verify)

Use a **single** application for `mastra.gaqno.com.br`: the image from [`Dockerfile`](Dockerfile) runs `node index.mjs` from `.mastra/output` and serves the **HTTP API** (`/api`, `/health`, `/chat/:agentId`, …). Production **`npm run build`** uses **`mastra build --studio`**, which also bundles **Mastra Studio** into the **`studio/`** directory next to `index.mjs`. The image sets **`MASTRA_STUDIO_PATH=./studio`** so Studio is served at the root in production (see [Mastra server deploy](https://mastra.ai/docs/deployment/mastra-server)). Without `--studio`, `/` is only the API quick-start HTML (“Mastra Server” landing page).

| Check | Expected |
| --- | --- |
| Build context | Repository path `gaqno-mastra/` (Dockerfile at `gaqno-mastra/Dockerfile`). From monorepo root: [`build-all.sh`](../build-all.sh) with filter `./build-all.sh gaqno-mastra` (listed under `SERVICES`). |
| Container port | Process listens on **`PORT`**; image default **`4111`** (`ENV PORT=4111`). **`MASTRA_STUDIO_PATH=./studio`** is set in the image so the Studio bundle from `mastra build --studio` is served (same directory layout as `.mastra/output` after `COPY`). |
| Public host | **`mastra.gaqno.com.br`** → this service (Dokploy domain + TLS, or Cloudflare Tunnel hostname → container). |
| Health probe | `GET /health` on the container (e.g. `http://127.0.0.1:4111/health` internally, or HTTPS on the public URL after deploy). |
| Studio vs API | **Studio** ships in prod only when the build uses `--studio` (this repo’s `npm run build`). **API** is always there. A separate Module Federation remote (`gaqno-mastra-studio-ui`) is **deferred** — see [`../gaqno-mastra-studio-ui/README.md`](../gaqno-mastra-studio-ui/README.md). |

```shell
curl -sS https://mastra.gaqno.com.br/health
curl -sS https://mastra.gaqno.com.br/api/agents
```

Example agent chat (this repo registers `weather-agent`):

```shell
curl -sS -X POST https://mastra.gaqno.com.br/api/agents/weather-agent/generate \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

Streaming:

```shell
curl -NsS -X POST https://mastra.gaqno.com.br/api/agents/weather-agent/stream \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

Other routes exposed by the server UI include `GET /api/workflows`, `POST /api/workflows/:id/start`, `GET /api/tools`, `POST /api/tools/:id/execute`, `GET /api/memory/threads`. See [Mastra docs](https://mastra.ai/docs/) for agents, workflows, and custom API routes.

## RAG (Qdrant Cloud)

Vectors live in a **dedicated** [Qdrant Cloud](https://cloud.qdrant.io/) cluster (not application Postgres). Set on the host (Dokploy env or local `.env`):

- `QDRANT_URL` — cluster HTTPS URL  
- `QDRANT_API_KEY` — API key (omit only for local Qdrant without auth)  
- `OPENAI_API_KEY` — used for `text-embedding-3-small` (1536 dimensions)

Collection name: **`gaqno_rag_kb`** (created automatically on first ingest).

Ingest plain text into the index (from repo root, with env loaded):

```shell
npm run ingest:rag -- ./path/to-notes.txt optional-doc-id
```

Agent **`knowledge-agent`** calls the `search-knowledge-base` tool (embed query → Qdrant similarity search → context for the model). Example:

```shell
curl -sS -X POST https://mastra.gaqno.com.br/api/agents/knowledge-agent/generate \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"What does our runbook say about deploys?"}]}'
```

More on chunking and stores: [Mastra RAG](https://mastra.ai/docs/rag/overview), [vector databases](https://mastra.ai/docs/rag/vector-databases).

## Portal and admin (`gaqno-shell-ui` + MFEs)

**Product split:** B2C AI lives in **`gaqno-ai-ui`** (`/ai`) and must not host the Mastra operator dashboard. Operators use the dedicated host [https://mastra.gaqno.com.br](https://mastra.gaqno.com.br) (Studio + API; protect with Cloudflare Access or equivalent). Old links to **`/admin/settings/mastra`** in **`gaqno-admin-ui`** redirect to that host.

### Backend: AI SDK chat route

The server exposes **`POST /chat/:agentId`** (AI SDK–compatible streaming) via [`chatRoute`](https://mastra.ai/reference/ai-sdk/chat-route), e.g.:

- `POST https://mastra.gaqno.com.br/chat/weather-agent`
- `POST https://mastra.gaqno.com.br/chat/knowledge-agent`

### CORS and Dokploy

Set **`MASTRA_CORS_ORIGINS`** on the Mastra app in **Dokploy** to the portal origin(s), e.g. `https://portal.gaqno.com.br` (comma-separated list; include `http://localhost:3000` if needed for local shell). When unset, Mastra uses its default permissive CORS (fine for dev only).

### Optional later: embedded chat in admin

To embed chat inside **`gaqno-admin-ui`**, add **`useChat`** + `DefaultChatTransport` pointing at `https://mastra.gaqno.com.br/chat/:agentId` (or a same-origin gateway path proxied there), with AI SDK versions aligned to Mastra [`chatRoute` `version`](https://mastra.ai/reference/ai-sdk/chat-route). Do not add this to **`gaqno-ai-ui`**.

### Optional: reverse proxy under `api.gaqno.com.br`

To avoid cross-origin calls and attach SSO cookies, proxy **`/mastra/chat/:agentId`** on the gateway to `https://mastra.gaqno.com.br/chat/:agentId`; the caller MFE then uses same-origin `/mastra/chat/...`.

## Learn more

To learn more about Mastra, visit our [documentation](https://mastra.ai/docs/). Your bootstrapped project includes example code for [agents](https://mastra.ai/docs/agents/overview), [tools](https://mastra.ai/docs/agents/using-tools), [workflows](https://mastra.ai/docs/workflows/overview), [scorers](https://mastra.ai/docs/evals/overview), and [observability](https://mastra.ai/docs/observability/overview).

If you're new to AI agents, check out our [course](https://mastra.ai/learn) and [YouTube videos](https://youtube.com/@mastra-ai). You can also join our [Discord](https://discord.gg/BTYqqHKUrf) community to get help and share your projects.

## Deploy to the Mastra platform (optional)

Hosted alternative to **Dokploy + `mastra.gaqno.com.br`**: [Mastra platform](https://projects.mastra.ai) runs the artifact from **`mastra build`** on their infrastructure (stable URL, env management, deploy history). Step-by-step: [Server deployment (Mastra platform)](https://mastra.ai/guides/deployment/mastra-platform).

**Ephemeral filesystem:** this repo’s default [`src/mastra/index.ts`](src/mastra/index.ts) uses **LibSQL with `file:./mastra.db`**. On Mastra platform, local file storage does not persist. Before `mastra server deploy`, point LibSQL (and any similar stores) at a **remote** URL per [LibSQLStore](https://mastra.ai/reference/storage/libsql).

**CLI (local or CI):**

1. Install CLI: `npm install -g mastra` or use `npx mastra`.
2. Run from **`gaqno-mastra/`** (not the monorepo root): `mastra server deploy` (use `--yes` in CI). First run creates **`.mastra-project.json`** — commit it if you use this deploy path.
3. CI: secret **`MASTRA_API_TOKEN`** from `mastra auth tokens create ci-deploy`. In GitHub Actions, set `working-directory: gaqno-mastra` and scope `paths` to `gaqno-mastra/**`.
4. Verify `GET /health` and `GET /api/agents`. Configure [server auth](https://mastra.ai/docs/server/auth) before public exposure.

**Studio on platform:** use `mastra studio deploy` and [Studio deployment](https://mastra.ai/docs/studio/deployment) when you want the hosted Studio UI, not only the API server.

**CI overrides:** `MASTRA_ORG_ID` and `MASTRA_PROJECT_ID` override `.mastra-project.json`.

More: [Mastra platform overview](https://mastra.ai/docs/mastra-platform/overview), [CLI reference](https://mastra.ai/reference/cli/mastra).
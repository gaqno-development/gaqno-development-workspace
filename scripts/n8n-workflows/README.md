# n8n Workflows for Gaqno Ecosystem

Ready-to-import n8n workflow JSONs for cross-service automation. Import via **n8n UI: Workflows → Add workflow → Import from File** (or paste JSON).

## Workflows

| File | Name | Trigger | Description |
|------|------|---------|-------------|
| `01-service-health-monitor.json` | Service Health Monitor | Every 5 min | Calls `/v1/health` on all 13 Gaqno services; sends Telegram alert if any fail. |
| `02-lead-enrichment-pipeline.json` | Lead Enrichment Pipeline | Every 15 min | Fetches CRM leads, enriches (placeholder), updates lead, optional notify. |
| `03-order-to-cash-automation.json` | Order-to-Cash | Every 30 min | Gets ERP orders with status `confirmed`, creates finance transaction, optional customer notify. |
| `04-payment-overdue-reminder.json` | Payment Overdue Reminder | Daily 9:00 | Fetches finance transactions, filters overdue, sends reminder (e.g. Telegram). |
| `05-low-stock-alert.json` | Low Stock Alert | Every 2 hours | Lists ERP products, checks stock per product, alerts when stock &lt; 5. |
| `06-daily-business-summary-report.json` | Daily Business Summary | Daily 19:00 | Aggregates CRM leads, finance (today), ERP orders, PDV metrics; sends report (e.g. Telegram). |
| `07-new-customer-welcome-sequence.json` | New Customer Welcome | Webhook `POST /gaqno-customer-welcome` | Sends welcome WhatsApp, waits 3 days, sends follow-up, logs CRM interaction. |
| `08-ai-content-generation-pipeline.json` | AI Content Generation | Webhook `POST /gaqno-ai-content` | Generates social copy via AI service; optional callback URL or inline response. |
| `09-message-received-seller-notify.json` | Message received (seller) | **Event bridge webhook** | First event-driven integration: runs when a message is received; filter by conversation assignee (seller) and notify or create task. |
| `10-pipedrive-to-crm-sync.json` | Pipedrive to CRM Sync | **Backend webhook** | Triggered by CRM backend (`POST /integrations/pipedrive/sync`); fetches Pipedrive persons/deals and creates CRM contacts/deals. |
| `11-salesforce-to-crm-sync.json` | Salesforce to CRM Sync | **Backend webhook** | Triggered by CRM backend (`POST /integrations/salesforce/sync`); fetches Salesforce Contacts/Leads/Opportunities and creates CRM contacts/leads/deals. |
| `12-ai-viral-video-pipeline.json` | AI Viral Video Pipeline | Webhook `POST /gaqno-ai-video-pipeline` | End-to-end viral video creation: AI generates concept → AI writes video prompt → AI Studio generates video → polls until ready → optionally publishes to TikTok. All via Gaqno AI Studio APIs (no external VEO3/Blotato). |
| `13-auth-otp-flow.json` | OTP Authentication | Webhook `POST /gaqno-auth-otp` + `POST /gaqno-auth-verify` | Generates 6-digit OTP, stores in Postgres, sends via email (SMTP) and WhatsApp (Omnichannel), verifies code. |

### OTP Authentication (13)

Workflow **13** provides a standalone OTP authentication flow. Two webhook endpoints: one to **send** the OTP (via email + WhatsApp), another to **verify** it.

**Flow:**

1. **Send OTP** – `POST /webhook/gaqno-auth-otp` – Generates a 6-digit code, stores in Postgres (`otp_codes` table, auto-created), sends via SMTP email from `contato@gaqno.com.br` and WhatsApp via Omnichannel `POST /v1/distribution/publish`
2. **Verify OTP** – `POST /webhook/gaqno-auth-verify` – Looks up the latest unused code for the email, validates match + expiry (5 min), marks as used

**Send OTP payload:**

```json
{
  "email": "user@example.com",
  "phone": "5511999999999",
  "tenantId": "uuid"
}
```

**Verify OTP payload:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Required credentials (configure in n8n UI):**

| Credential | Type | Purpose |
|------------|------|---------|
| `Gaqno SMTP` | SMTP | Email sending from `contato@gaqno.com.br` |
| `Gaqno JWT` | HTTP Header Auth | `Authorization: Bearer <jwt>` for Omnichannel API |
| `n8n Postgres` | Postgres | Connection to `gaqno_n8n_db` (same DB n8n uses internally) |

The `otp_codes` table is created automatically on first execution (idempotent `CREATE TABLE IF NOT EXISTS`).

### AI Viral Video Pipeline (12)

Workflow **12** replaces the original VEO3 + Blotato pipeline with **100% Gaqno AI Studio APIs**. It can be triggered via webhook or scheduled.

**Flow:**

1. **Generate creative idea** – `POST /v1/ai/generate` – AI writes a BEFORE/AFTER concept (idea, caption, environment, sound)
2. **Generate video prompt** – `POST /v1/ai/generate` – AI converts the concept into a detailed cinematic prompt for video generation
3. **Generate video** – `POST /v1/videos/generate` – Sends the prompt to Gaqno AI Studio (NEX AI / Seedance) for video rendering
4. **Poll status** – `GET /v1/videos/:taskId/status` – Polls every 2 min (up to 5 attempts / ~10 min) until status is `completed`
5. **Publish to TikTok** (optional) – `POST /v1/videos/:taskId/publish/tiktok` – Posts the finished video directly to TikTok via AI Studio

**Webhook payload:**

```json
{
  "tenantId": "uuid",
  "topic": "before/after pool renovation",
  "style": "cinematic",
  "aspectRatio": "9:16",
  "model": "st-ai/super-seed2",
  "crmAuthToken": "short-lived-jwt",
  "aiBaseUrl": "http://localhost:4002",
  "publishToTiktok": true,
  "socialAccountIds": ["tiktok-account-uuid"],
  "tiktokPrivacy": "PUBLIC_TO_EVERYONE"
}
```

- `crmAuthToken` – JWT used as `Authorization: Bearer` for all AI Studio API calls
- `aiBaseUrl` – Base URL of `gaqno-ai-service` (default `http://localhost:4002`)
- `publishToTiktok` – Set `true` to auto-publish; `false` to generate only
- `socialAccountIds` – TikTok social account UUIDs registered in AI Studio
- `model` – Video generation model (default `st-ai/super-seed2` / Seedance 2.0)

### CRM integration sync workflows (10, 11)

Workflows **10** and **11** are **not triggered by users directly**. The CRM backend calls them via webhook when a user clicks "Sync now" in the Integrations page. The backend handles OAuth, stores tokens, and sends the provider access token + a short-lived CRM JWT (`crmAuthToken`) in the webhook body.

**Webhook payload shape:**

```json
{
  "tenantId": "uuid",
  "provider": "pipedrive | salesforce",
  "accessToken": "provider-oauth-token",
  "apiDomain": "api.pipedrive.com",
  "instanceUrl": "https://yourinstance.my.salesforce.com",
  "crmAuthToken": "short-lived-jwt-for-crm-api",
  "crmBaseUrl": "http://localhost:4003"
}
```

- `apiDomain` is sent for Pipedrive; `instanceUrl` for Salesforce.
- `crmAuthToken` is a JWT (5-10 min TTL) that the workflow uses as `Authorization: Bearer` when calling CRM endpoints (`POST /v1/contacts`, `/v1/leads`, `/v1/deals`).
- Configure `N8N_SYNC_WEBHOOK_URL` in the CRM backend `.env` to point to the webhook URL of workflow 10 (for Pipedrive) or a single dispatcher. If using one webhook for both, the Code node routes by `provider`.

### Event-driven workflows (automation-bridge)

The **automation-bridge** service subscribes to domain events (BullMQ) and POSTs each event to **N8N_WEBHOOK_URL**. Use this URL as the **Webhook** trigger in n8n (e.g. workflow 09). Incoming body shape:

- `eventType` – e.g. `atendimento.message_received`, `comercial.sale_completed`
- `tenantId`, `aggregateId`, `aggregateType`, `source`
- `data` – event payload (e.g. for `atendimento.message_received`: `messageId`, `conversationId`, `tenantId`, `occurredAt`, `waId?`)
- `metadata` – e.g. `correlationId`

To run automations only when **a message involving a seller** is created: trigger on `eventType === 'atendimento.message_received'`, then (optional) call Omnichannel `GET /v1/conversations/{{ data.conversationId }}` and branch on `assigneeId` to notify the seller or create a CRM task.

## Setup

### Endpoints (default: localhost)

All workflows use **`http://localhost:PORT/v1/...`** by default, matching the workspace `.env` (`VITE_SERVICE_*_URL`). Paths use the global API prefix `/v1` (e.g. `/v1/leads`, `/v1/health`).

| Service         | Default base URL        | Used in workflows   |
|-----------------|-------------------------|---------------------|
| SSO             | `http://localhost:4001` | 01                  |
| AI              | `http://localhost:4002` | 01, 08, 12          |
| CRM             | `http://localhost:4003` | 01, 02, 06, 07      |
| ERP             | `http://localhost:4004` | 01, 03, 05, 06      |
| Finance         | `http://localhost:4005` | 01, 03, 04, 06      |
| PDV             | `http://localhost:4006` | 01, 06              |
| RPG             | `http://localhost:4007` | 01                  |
| Omnichannel     | `http://localhost:4008` | 01, 07, 13          |
| Admin           | `http://localhost:4010` | 01                  |
| Wellness        | `http://localhost:4011` | 01                  |
| Lead-enrichment | `http://localhost:4012` | 01                  |
| Customer        | `http://localhost:4013` | 01                  |
| Intelligence    | `http://localhost:4014` | 01                  |

To point n8n at another host (e.g. Docker or production), edit the **URL** in each HTTP Request node (e.g. replace `localhost` with `gaqno-crm-service` in Docker, or use `https://api.gaqno.com.br` with path `/crm/v1` if you use a single API gateway).

### Authentication

Gaqno APIs expect **JWT in the `Authorization` header**:

- **Header name:** `Authorization`
- **Header value:** `Bearer <access_token>`

In n8n:

1. Create a credential: **Credentials → Add credential → HTTP Header Auth**.
2. Set **Name** to `Gaqno JWT` (workflows reference this name).
3. Set the header **Name** to `Authorization` and **Value** to `Bearer <your_jwt>` (or use an expression to load the token).
4. Assign this credential to every HTTP Request node that calls a Gaqno API.

**Workflow 01 (Service Health Monitor):** the “Check health” node does **not** use auth (health endpoints are typically public).

### Telegram (optional)  
   Where a “Telegram alert” or “Send report” node exists, set:
   - `YOUR_BOT_TOKEN` and `YOUR_CHAT_ID` in the node URL/body, or  
   - Replace the HTTP Request with the n8n **Telegram** node and its credentials.

### Webhooks

- **07** and **08**: After import, open the Webhook node and copy the **Production URL** (e.g. `https://n8n.gaqno.com.br/webhook/gaqno-customer-welcome`). Call this URL from your app or use it as callback.
   - **07** expects body: `{ "contactId", "conversationId", "customerName" }`.
   - **08** expects body: `{ "topic" }` and optional `"callbackUrl"`.
- **09 (event-driven)**: Set **N8N_WEBHOOK_URL** in automation-bridge to this workflow’s Webhook URL (e.g. `https://n8n.gaqno.com.br/webhook/gaqno-message-received`). The body is the full domain event (`eventType`, `tenantId`, `data`, etc.).
- **10** and **11** (CRM sync): Set **N8N_SYNC_WEBHOOK_URL** in `gaqno-crm-service/.env` to the webhook URL (e.g. `https://n8n.gaqno.com.br/webhook/gaqno-pipedrive-sync`). The CRM backend POSTs provider tokens and `crmAuthToken` when the user clicks "Sync".
- **12** (AI video pipeline): Webhook URL e.g. `https://n8n.gaqno.com.br/webhook/gaqno-ai-video-pipeline`. Triggered by the AI Studio UI or backend with topic, auth token, and optional TikTok publish settings.
- **13** (OTP auth): Two webhooks — `https://n8n.gaqno.com.br/webhook/gaqno-auth-otp` (send code) and `https://n8n.gaqno.com.br/webhook/gaqno-auth-verify` (verify code). Requires **Gaqno SMTP** credential (for `contato@gaqno.com.br`) and **n8n Postgres** credential (same DB).

### Wait nodes (workflows 07, 12)  
   The “Wait 3 days” step requires n8n to be able to resume executions (e.g. queue mode or persistent execution store). Ensure your n8n instance supports resumable waits.

## Service ports (reference)

| Service | Port |
|---------|------|
| gaqno-sso-service | 4001 |
| gaqno-ai-service | 4002 |
| gaqno-crm-service | 4003 |
| gaqno-erp-service | 4004 |
| gaqno-finance-service | 4005 |
| gaqno-pdv-service | 4006 |
| gaqno-rpg-service | 4007 |
| gaqno-omnichannel-service | 4008 |
| gaqno-admin-service | 4010 |
| gaqno-wellness-service | 4011 |
| gaqno-lead-enrichment-service | 4012 |
| gaqno-customer-service | 4013 |
| gaqno-intelligence-service | 4014 |

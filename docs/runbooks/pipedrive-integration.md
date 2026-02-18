# Pipedrive integration (OAuth + lead enrichment)

## Who does what

| Component | Responsibility |
| --------- |----------------|
| **CRM (gaqno-crm / gaqno-crm-service)** | OAuth flow: "Connect Pipedrive" → redirect to Pipedrive → **callback** receives `?code=...` → exchange code for tokens → **write** to `lead_pipedrive_integrations`. |
| **gaqno-lead-enrichment-service** | **Reads** tokens from `lead_pipedrive_integrations`, refreshes when expired (JIT), calls Pipedrive API (e.g. person search by phone). No callback; no OAuth UI. |

The **callback** (URL Pipedrive redirects to after user authorizes) **belongs in the CRM** backend, because the user journey starts in the CRM UI ("Connect Pipedrive"). The lead-enrichment microservice only consumes tokens already stored.

## DB contract (shared)

Table: **`lead_pipedrive_integrations`** (same DB as lead-enrichment or a DB the CRM backend can write to and lead-enrichment can read from).

| Column | Type | Notes |
|--------|------|--------|
| `tenant_id` | uuid, PK | Tenant that connected Pipedrive. |
| `access_token` | text | Current access token. |
| `refresh_token` | text | Used by lead-enrichment-service to refresh when expired. |
| `expires_at` | timestamptz | When access_token expires. |
| `api_domain` | varchar(255) | From Pipedrive token response (e.g. `api.pipedrive.com`). |

- **CRM callback:** On successful token exchange, `INSERT` or `UPDATE` this table for the current tenant.
- **lead-enrichment-service:** Reads by `tenant_id`, uses `access_token`; if `expires_at` is near, calls Pipedrive OAuth refresh and updates the row.

## OAuth callback (to implement in CRM)

1. User clicks "Connect Pipedrive" in CRM → redirect to  
   `https://oauth.pipedrive.com/oauth/authorize?client_id=<PIPEDRIVE_CLIENT_ID>&redirect_uri=<CALLBACK_URL>&state=<tenant_id_or_session>`  
   (Use the same `PIPEDRIVE_CLIENT_ID` / `PIPEDRIVE_CLIENT_SECRET` as in lead-enrichment-service env.)
2. Pipedrive redirects to **CALLBACK_URL** with `?code=...&state=...`.
3. **CRM backend** callback handler:
   - Exchange `code` for tokens: `POST https://oauth.pipedrive.com/oauth/token` with `grant_type=authorization_code`, `client_id`, `client_secret`, `redirect_uri`, `code`.
   - Persist `access_token`, `refresh_token`, `expires_at`, `api_domain` into `lead_pipedrive_integrations` for the tenant (from `state` or session).
4. Redirect user back to CRM UI (e.g. "Pipedrive connected").

**Callback URL** must be registered in the Pipedrive app settings (e.g. `https://api.gaqno.com.br/crm/v1/integrations/pipedrive/callback` if CRM backend serves it).

## Reference

- **lead-enrichment-service:** `gaqno-lead-enrichment-service/` in workspace; repo `gaqno-development/gaqno-lead-enrichment-service`. Uses `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET` only for **refresh**; it does not implement the authorize/callback flow.

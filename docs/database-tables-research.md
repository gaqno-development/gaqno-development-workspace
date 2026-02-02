# Database Tables Research: RPG Campaigns, Omnichannel Agents, Finance

Research based on schema and code in `gaqno-rpg-service`, `gaqno-omnichannel-service`, and `gaqno-finance-service`.

---

## 1. RPG Campaigns (gaqno_rpg_db database)

**Service:** `gaqno-rpg-service`  
**Schema:** `gaqno-rpg-service/src/database/schema.ts`  
**Main table:** `rpg_campaigns`  
**Production seed:** See [docs/seed-production/README.md](docs/seed-production/README.md) (SQL via pgAdmin).

### Core campaign/session tables

| Table                   | Purpose                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **rpg_campaigns**       | Campaign definition: name, description, concept (jsonb), world (jsonb), initial_narrative, npcs, hooks, is_public, status (draft/active/archived). Owned by userId; optional tenantId. |
| **rpg_sessions**        | Play sessions: linked to campaign (campaign_id), room_code (unique), ai_master_enabled, ai_improvement_enabled, status (draft/active/paused/completed/archived).                       |
| **rpg_session_masters** | Which users are masters of a session (userId, sessionId, is_original_creator).                                                                                                         |
| **rpg_characters**      | Characters in a session: session_id, player_id, attributes, resources, metadata (jsonb).                                                                                               |
| **rpg_actions**         | Action log per session: action text, dice (jsonb), outcome, narrative (jsonb), mechanics (jsonb).                                                                                      |
| **rpg_memory**          | Session/campaign memory: session_id, campaign_id, key, value, type (general/canonical/improvised).                                                                                     |
| **rpg_history**         | Session history: session_id, summary, timestamp, metadata.                                                                                                                             |
| **rpg_images**          | Session images: session_id, prompt_id, image_url, metadata.                                                                                                                            |

### Campaign-related (bible, locations, classes)

| Table                  | Purpose                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **rpg_locations**      | Locations per campaign: campaign_id, name, type (dungeon/city/region/landmark/building), description, content, coordinates. |
| **rpg_custom_classes** | Custom D&D-like classes per campaign: campaign_id, name, base_class, features, hit_die, proficiencies, spellcasting.        |
| **rpg_codex_entries**  | Codex entries (campaign or session): content, embedding (jsonb), metadata.                                                  |
| **rpg_bible_entities** | Bible entities: campaign_id, type (npc/location/item/event/organization/concept), name, description, content (jsonb).       |
| **rpg_bible_links**    | Links between bible entities: from_entity_id, to_entity_id, relationship.                                                   |
| **rpg_bible_versions** | Version history of bible entity content.                                                                                    |

### D&D reference data (shared, not per-tenant)

| Table                                                                                                                                                                                                                                               | Purpose                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **dnd_classes**, **dnd_monsters**, **dnd_spells**, **dnd_equipment**, **dnd_races**, **dnd_magic_items**, **dnd_feats**, **dnd_backgrounds**, **dnd_subclasses**, **dnd_subraces**, **dnd_languages**, **dnd_magic_schools**, **dnd_proficiencies** | Reference data: index (unique), name, data (jsonb), synced_at.    |
| **dnd_api_sync**                                                                                                                                                                                                                                    | Sync metadata per category (last_synced_at, version, item_count). |

### Enums

- **session_status:** draft, active, paused, completed, archived
- **campaign_status:** draft, active, archived
- **memory_type:** general, canonical, improvised
- **entity_type:** npc, location, item, event, organization, concept
- **location_type:** dungeon, city, region, landmark, building

---

## 2. Omnichannel agents (gaqno_omnichannel_db database)

**Service:** `gaqno-omnichannel-service`  
**Schema:** `gaqno-omnichannel-service/src/database/schema.ts`  
**Agent-related:** channels with `type = 'agent'`, `omni_agent_presence`, `agent_slug` on assignments and team members.  
**Production seed:** See [docs/seed-production/README.md](docs/seed-production/README.md) (SQL via pgAdmin).

### Agent concept

- **Agents** are AI responders (e.g. `tom`, `gabs`) identified by **agent_slug**.
- There is **no** dedicated `omni_agents` table: agent “definitions” are channels with `type = 'agent'` and `config.agentSlug` (e.g. `tom`, `gabs`).
- Human presence (online/away/busy/offline) is in **omni_agent_presence** (one row per user per tenant).

### Agent-related tables

| Table                             | Purpose                                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **omni_channels**                 | Channels: tenant_id, type (whatsapp, instagram, web, email, **agent**), config (jsonb). For agents, config holds `agentSlug` (e.g. `tom`, `gabs`). |
| **omni_agent_presence**           | Human agent presence: user_id, tenant_id, status (online/away/busy/offline), availability, last_seen.                                              |
| **omni_conversation_assignments** | Assignment of conversation to a human (user_id) or an AI agent (agent_slug).                                                                       |
| **omni_team_members**             | Team members: member_type (human/ai), user_id (human) or agent_slug (AI).                                                                          |

### Other omnichannel tables

| Table                        | Purpose                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| **omni_organizations**       | Org name, plan, settings.                                                            |
| **omni_subscription_plans**  | Plan name, limits (jsonb).                                                           |
| **omni_usage_counters**      | tenant_id, period, counts (jsonb).                                                   |
| **omni_customers**           | tenant_id, display_name, metadata, notes.                                            |
| **omni_customer_identities** | customer_id, channel_id, external_id, profile.                                       |
| **omni_customer_tags**       | customer_id, tag.                                                                    |
| **omni_conversations**       | tenant_id, channel_id, customer_id, team_id, status (open/pending/resolved/closed).  |
| **omni_messages**            | conversation_id, direction (inbound/outbound), body, payload, tags, idempotency_key. |
| **omni_business_hours**      | tenant_id, config (jsonb).                                                           |
| **omni_faq**                 | tenant_id, title, content, sort_order.                                               |
| **omni_teams**               | tenant_id, name, description, type (ai_only/humans_only/mixed), is_active.           |
| **omni_routing_rules**       | tenant_id, priority, condition, action, is_active.                                   |
| **omni_sla_rules**           | tenant_id, name, first_response_minutes, resolution_minutes.                         |
| **omni_sla_breaches**        | conversation_id, sla_rule_id, breach_type, breached_at.                              |

### Enums

- **omni_channel_type:** whatsapp, instagram, web, email, **agent**
- **omni_agent_presence_status:** online, away, busy, offline
- **omni_conversation_status:** open, pending, resolved, closed
- **omni_message_direction:** inbound, outbound
- **omni_team_type:** ai_only, humans_only, mixed
- **omni_team_member_type:** human, ai

---

## 3. Finance tables (gaqno_finance_db database)

**Service:** `gaqno-finance-service`  
**Schema:** `gaqno-finance-service/src/database/schema.ts`  
**Tables:** All prefixed with `finance_`.  
**Production seed:** See [docs/seed-production/README.md](docs/seed-production/README.md) (SQL via pgAdmin).

### Core tables

| Table                     | Purpose                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **finance_categories**    | tenant_id, name, type (income/expense), color, icon.                                                                                                                                                                                                                                                                                             |
| **finance_subcategories** | tenant_id, parent_category_id (→ finance_categories), name, icon.                                                                                                                                                                                                                                                                                |
| **finance_credit_cards**  | tenant_id, user_id, name, last_four_digits, card_type, bank_name, credit_limit, closing_day, due_day, color, icon.                                                                                                                                                                                                                               |
| **finance_transactions**  | tenant_id, user_id, category_id, subcategory_id, credit_card_id (optional), description, amount, type (income/expense), transaction_date, due_date, status (pago/a_pagar/em_atraso), assigned_to, notes, installments (installment_count, installment_current), recurring (is_recurring, recurring_type, recurring_day, recurring_months), icon. |

### Enums

- **transaction_status:** pago, a_pagar, em_atraso
- **transaction_type:** income, expense
- **recurrence_type:** none, fifth_business_day, day_15, last_day, custom

### Relations

- Categories → subcategories (one-to-many).
- Categories / subcategories / credit_cards → transactions (optional FKs).
- Transactions reference categories, subcategories, and credit cards for reporting and filters.

---

## Summary by database

| Database                 | Main entities                                                                                                                       | Agent/campaign specific                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **gaqno_rpg_db**         | rpg*campaigns, rpg_sessions, rpg_characters, rpg_actions, rpg_memory, rpg_locations, rpg_custom_classes, rpg_bible*\_, dnd\_\_      | Campaigns = rpg_campaigns + rpg_sessions; no separate “agents” table.                           |
| **gaqno_omnichannel_db** | omni_channels, omni_conversations, omni_messages, omni_agent_presence, omni_conversation_assignments, omni_teams, omni_team_members | Agents = channels with type `agent` and config.agentSlug; omni_agent_presence = human presence. |
| **gaqno_finance_db**     | finance_categories, finance_subcategories, finance_credit_cards, finance_transactions                                               | No agents; pure finance data.                                                                   |

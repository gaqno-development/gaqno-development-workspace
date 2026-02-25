# Omnichannel UX/UI Improvement Map

Audit of all pages/features in `gaqno-omnichannel-ui` that lack a minimal functional use case.

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Empty placeholder — zero functionality, user sees "coming soon" |
| **P1** | Scaffold only — UI shell exists but no data/API wired |
| **P2** | Partially functional — works but missing key UX pieces |

---

## 1. Dashboard — Trends Chart (P0)

**File:** `src/pages/DashboardPage/DashboardPage.tsx` (line 106-118)

**Current state:** A dashed-border empty box with text "Charts coming soon". The 4 KPI cards above (Open conversations, Messages today, SLA alerts, Agents online) ARE functional and fetch from `reports/dashboard`.

**Minimal improvement:** Wire up a simple line/bar chart using frontcore's existing `ChartContainer` (recharts wrapper already in `@gaqno-frontcore`) showing conversation volume over the last 7 days. The backend endpoint `reports/dashboard` can be extended or a new `reports/trends` endpoint created.

---

## 2. Live Metrics Page (P0)

**File:** `src/pages/DashboardSection.tsx` (line 108-117)

**Current state:** Only renders a title "Live Metrics" and text "Real-time conversation and agent metrics. Coming soon."

**Minimal improvement:** Show real-time KPIs that auto-refresh (active conversations, avg wait time, agents available, messages/min). Can reuse the same `reports/dashboard` data with a short polling interval or socket events that already exist in `useOmnichannelSocket`.

---

## 3. SLA Status Page (P0)

**File:** `src/pages/DashboardSection.tsx` (line 119-128)

**Current state:** Only renders a title "SLA Status" and text "SLA compliance and breach overview. Coming soon."

**Minimal improvement:** Display a summary card with SLA compliance rate (% on time), count of active breaches (already available as `slaAlerts` in dashboard stats), and a simple table of recent breached conversations.

---

## 4. Reports Page (P1)

**File:** `src/pages/ReportsPage/ReportsPage.tsx`

**Current state:** Has a filter card (channel selector, disabled Export button) and two stat cards both showing hardcoded `0`. No API calls, no real data.

**Minimal improvement:** Wire filters to `reports/conversations` and `reports/messages` endpoints. Show real totals for the selected period. Enable the Export button to download a CSV of conversations.

---

## 5. Settings Page (P1)

**File:** `src/pages/SettingsPage/SettingsPage.tsx`

**Current state:** Shows a disabled input for "Organization name" and a disabled "Save" button. Description says "forms with Zod validation coming soon".

**Minimal improvement:** Fetch org settings from the API, enable the form fields, add Zod validation, and wire the Save button. Even just showing read-only org info (name, plan, created date) would be an improvement.

---

## 6. Customers Page (P1)

**File:** `src/pages/CustomersPage/CustomersPage.tsx`

**Current state:** A placeholder card with tabs (Profile / Notes). Profile tab shows "Select a customer to view profile" with a static "Tag placeholder" badge. Notes tab has a read-only Textarea.

**Minimal improvement:** Fetch the customer list from the API, render a searchable/filterable table. Clicking a customer shows their profile with real tags and conversation history count.

---

## 7. Agents Page (P1)

**File:** `src/pages/AgentsPage/AgentsPage.tsx`

**Current state:** A DataTable with zero rows (`placeholderData: AgentPlaceholder[] = []`). All switches disabled. Message says "No agents yet. Presence coming soon."

**Minimal improvement:** Fetch real agent data from the attendances API (which is already functional in `AttendancesPage`). Show agent name, status, and online/offline indicator.

---

## 8. Saved Views (P0)

**File:** `src/pages/InboxSection/placeholders.tsx` (line 12-19)

**Current state:** Only text "Custom conversation views and filters. Coming soon."

**Minimal improvement:** Allow users to save their current inbox filter combination (status, assignee, queue) as a named view. Store in localStorage initially, API later.

---

## 9. Attendances — Performance Stats (P2)

**File:** `src/pages/AttendancesPage/AttendancesPage.tsx` (line 84-104)

**Current state:** `StatsPlaceholder` renders fake bar chart with hardcoded heights `[40, 65, 45, 80, 55]`. Shows in agent detail sheet.

**Minimal improvement:** Fetch real per-agent stats (conversations handled, avg response time) from the API and render actual bars proportional to data.

---

## 10. Dashboard Sub-routes: Settings & Automation (P0)

**File:** `src/pages/DashboardSection.tsx` (line 130-137) → routes to `SectionPage`

**Current state:** Both `/omnichannel/settings` and `/omnichannel/automation` from the dashboard sub-nav render the generic `SectionPage` which shows an `EmptyState` with "This section is under construction."

**Minimal improvement:**
- **Settings:** Redirect to the SettingsPage or embed it.
- **Automation:** Show a read-only list of active automation rules (routing rules, SLA policies, business hours) even if editing isn't ready yet.

---

## 11. Dashboard Sub-route: Reports (P0)

**File:** `src/pages/DashboardSection.tsx` (line 130-137) → routes to `SectionPage`

**Current state:** `/omnichannel/reports` from dashboard sub-nav renders the generic `SectionPage` instead of the `ReportsPage` that already exists.

**Quick fix:** Map the `reports` segment to `ReportsPage` in `SEGMENT_TO_COMPONENT` instead of `SectionPage`.

---

## 12. Broadcast — SMS/Email Channels (P2)

**File:** `src/pages/BroadcastPage/BroadcastPage.tsx`

**Current state:** `CHANNEL_OPTIONS` includes WhatsApp, SMS, and Email. Only WhatsApp has backend support. Selecting SMS/Email lets users fill the form but will fail on submit.

**Minimal improvement:** Disable SMS and Email options with a "(coming soon)" label, or hide them entirely until backend support exists.

---

## 13. Template Creation — Disabled Button Types (P2)

**File:** `src/pages/TemplatesPage/components/CreateTemplatePanel.tsx` (line 862-868)

**Current state:** "Call to action" and "Phone call" button types are disabled in the template creation dropdown.

**Minimal improvement:** Either implement these button types or add tooltip explaining they're coming soon.

---

## 14. Route-meta Declared but Unreachable Pages (P0)

**File:** `src/config/route-meta.ts`

These routes have metadata defined but **no dedicated component** — they all fall through to the generic `SectionPage` ("under construction"):

| Route Group | Routes |
|-------------|--------|
| **Customers** | `/customers/recent`, `/customers/vip`, `/customers/segments`, `/customers/segments/tags`, `/customers/segments/dynamic`, `/customers/profiles` |
| **Agents** | `/agents/online`, `/agents/offline`, `/agents/teams/skills`, `/agents/presence` |
| **Automation** | `/automation/routing`, `/automation/routing/assignment`, `/automation/routing/queues`, `/automation/routing/fallback`, `/automation/sla`, `/automation/sla/policies`, `/automation/sla/breach-actions`, `/automation/business-hours` |
| **Reports** | `/reports/conversations`, `/reports/conversations/volume`, `/reports/conversations/response-time`, `/reports/conversations/resolution-time`, `/reports/agents`, `/reports/agents/performance`, `/reports/agents/availability`, `/reports/channels`, `/reports/channels/whatsapp`, `/reports/channels/webchat`, `/reports/channels/instagram` |
| **Settings** | `/settings/organization`, `/settings/organization/profile`, `/settings/organization/billing`, `/settings/organization/usage`, `/settings/channels/*`, `/settings/access/*`, `/settings/integrations/*`, `/settings/system/*` |

**Recommendation:** Either remove these from the navigation/route-meta until they're built (cleaner UX), or provide a minimal read-only view for the most valuable ones first (Reports > Customers > Settings).

---

## Suggested Implementation Order

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | **Dashboard Trends Chart** | Small (frontcore charts exist) | High — dashboard feels complete |
| 2 | **Reports Page wiring** | Small-Medium | High — core business need |
| 3 | **Live Metrics page** | Medium (reuse socket) | High — real-time visibility |
| 4 | **Dashboard reports segment fix** | Trivial (1 line) | Medium — stops showing "under construction" |
| 5 | **Agents Page real data** | Small (API exists) | Medium — eliminates empty table |
| 6 | **SLA Status page** | Medium | Medium — SLA monitoring |
| 7 | **Customers Page list** | Medium | Medium — CRM foundation |
| 8 | **Attendances real stats** | Small | Low-Medium — polish |
| 9 | **Settings Page forms** | Medium | Low-Medium — config |
| 10 | **Saved Views** | Medium | Low — power user feature |
| 11 | **Broadcast channel guards** | Trivial | Low — prevents confusion |
| 12 | **Unreachable routes cleanup** | Small | Low — removes dead ends |

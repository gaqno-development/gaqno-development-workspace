# gaqno-omnichannel-ui — Tracking de commits (últimas 4h)

**Repositório:** gaqno-omnichannel-ui  
**Período:** 2026-02-11 22:48 — 2026-02-12 00:56 (UTC-3)  
**Convenção:** commit-fela (Epic → Story → Subtask; commit = subtask key)

---

## 1. Lista resumida (cronológica reversa)

| Hash     | Tipo   | Descrição resumida |
| -------- | ------ | ------------------ |
| 1d0cd1b  | feat   | Inbox: sub-nav colapsável (Conversations/Queues/Teams/Saved Views/Templates) |
| 084700b  | fix    | Refs React em DeliveryStatusIcon/MessageContent; ListEmptyState e PageHeader (GAQNO-1332) |
| 5da7cda  | fix    | Remover enableContentTransition para compat frontcore |
| 3c5d60e  | refactor | InboxPage em subcomponentes (GAQNO-1331) |
| 3a6d533  | chore  | tsc no build e test script para CI |
| 0be1c67  | feat   | Análise aplicada: config vs hardcodes, import ES, skeleton loading |
| 6ba7db0  | feat   | Error boundaries por seção e retry sem reload (GAQNO-1327) |
| f8e348a  | feat   | Sidebars colapsáveis (inbox e templates) para ganhar espaço |
| e0ea187  | feat   | Templates: preview de detalhe com estrutura analisada por LLM |
| 5a28885  | feat   | Templates: preview WhatsApp por tipo (coupon, call, MPM, carousel) |
| c5d5f3f  | feat   | Templates: sugestões IA para header, body e footer |
| 4869365  | feat   | Templates: preview phone frame WhatsApp (headers, botões, carousel) |
| d23f2fa  | fix    | Templates: form e preview lado a lado no desktop |
| e7344e7  | fix    | Import getTemplateLanguageCode em TemplateDetailPanel |
| e6050e8  | merge  | origin/main: conflito templates, manter getTemplateLanguageCode |
| 63136ff  | fix    | getTemplateLanguageCode e TemplateDetailPanel |

---

## 2. Histórias / blocos para tracking

Agrupamento por tema e sugestão de anexação a épico/story Jira.

### 2.1 Epic GAQNO-1326 — Omnichannel UI: melhorias

| Story / Tema | Commits (hash) | Subtask / Observação |
| ------------ | -------------- | -------------------- |
| **GAQNO-1327** — Error boundaries por seção | 6ba7db0 | Retry sem reload |
| **GAQNO-1331** — Refatorar InboxPage em subcomponentes | 3c5d60e | InboxPage em subcomponentes |
| **GAQNO-1332** — PageHeader e EmptyState reutilizáveis | 084700b | ListEmptyState, PageHeader; fix refs DeliveryStatusIcon/MessageContent |
| Análise aplicada (config, skeleton) | 0be1c67 | Alinhado a GAQNO-1329 / GAQNO-1333 |
| Sidebars colapsáveis (inbox + templates) | f8e348a, 1d0cd1b | UX / ganho de espaço |
| CI / build | 3a6d533, 5da7cda | tsc no build; remove enableContentTransition (frontcore) |

### 2.2 Templates — Preview e IA

| Tema | Commits (hash) | Observação |
| ---- | -------------- | ---------- |
| Preview WhatsApp (phone frame, tipos, carousel) | 4869365, 5a28885 | Headers, botões tipados, coupon, call, MPM, carousel |
| Preview com estrutura LLM | e0ea187 | Detalhe com análise de componentes |
| Sugestões IA (header, body, footer) | c5d5f3f | Campos de template |
| Layout e correções | d23f2fa, e7344e7, 63136ff, e6050e8 | Lado a lado desktop; getTemplateLanguageCode; merge |

---

## 3. Resumo por tipo

- **feat:** 8 (inbox sub-nav, error boundaries, refactor InboxPage, config/skeleton, sidebars colapsáveis, preview templates, sugestões IA)
- **fix:** 5 (refs React, frontcore, form/preview, getTemplateLanguageCode)
- **refactor:** 1 (InboxPage subcomponentes)
- **chore:** 1 (tsc CI)
- **merge:** 1

---

## 4. Anexação a épico (recomendação)

- **Epic GAQNO-1326** (Omnichannel UI melhorias): commits das secções 2.1 (error boundaries, InboxPage, PageHeader/EmptyState, config/skeleton, sidebars, CI).
- **Templates (preview + IA):** se existir Story/Epic de “Templates WhatsApp” no Jira, anexar os commits da secção 2.2; caso contrário, manter como bloco “Templates” até criação do épico/story correspondente.

Commits devem referenciar **subtask** (GAQNO-XXXX) no corpo da mensagem quando aplicável; branches seguir `story/GAQNO-XXXX` ou `epic/GAQNO-XXXX` conforme commit-fela.

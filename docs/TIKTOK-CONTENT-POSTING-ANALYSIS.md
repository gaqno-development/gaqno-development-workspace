# Análise: Especificação TikTok Content Posting vs Implementação Atual

Este documento compara a **seção 8 (Integração TikTok Content Posting API)** que você vai usar no prompt do microfrontend SaaS com o que já existe no workspace, e aponta lacunas e alinhamentos.

---

## 1. Resumo do que a especificação propõe

| Item | Spec | Objetivo |
|------|------|----------|
| **Creator Info** | `GET /api/v1/tiktok/creator-info` | Dados do criador (privacy options, max duration, flags) para montar o post |
| **Iniciar publicação** | `POST /api/v1/videos/:id/publish/tiktok` | Body com `TikTokDirectPostDto` (title, privacyLevel, flags, source, videoUrl etc.) |
| **Status** | `GET /api/v1/videos/:id/publish/tiktok/status?publishId=...` | Status da publicação (PROCESSING, PUBLISH_COMPLETE, FAILED) |
| **Kafka** | `video.publish.commands` / `video.publish.events` | Payload com `provider`, `publishId`, `postInfo`, `source`, `videoUrl` |

Fluxo oficial TikTok: **creator_info/query** → **video/init** → (se FILE_UPLOAD) **PUT upload_url** → **status/fetch**.

---

## 2. O que já existe no código

### 2.1 Backend (gaqno-ai-service)

| Aspecto | Atual | Spec |
|---------|--------|------|
| **Rota de publish** | `POST /api/v1/videos/:id/publish` (única para todos os providers) | `POST /api/v1/videos/:id/publish/tiktok` (específica TikTok) |
| **Body do publish** | `PublishVideoDto`: `socialAccountIds`, `caption` | `TikTokDirectPostDto`: title, privacyLevel, disableDuet/Comment/Stitch, videoCoverTimestampMs, source, videoUrl, videoSizeBytes, chunkSize |
| **Creator info** | Não existe | `GET /api/v1/tiktok/creator-info` |
| **Status de publicação** | Não existe endpoint; status vem só via Kafka → `updatePublishStatus` | `GET /api/v1/videos/:id/publish/tiktok/status?publishId=...` |
| **Kafka topics** | `video.publish.commands`, `video.publish.events` ✅ | Mesmos nomes ✅ |
| **Payload commands** | `tenantId`, `userId`, `projectId`, `socialAccountIds`, `videoUrl`, `caption` | Spec adiciona: `provider`, `source`, `publishId`, `uploadUrl`, `postInfo` |
| **TikTok publisher** | Stub que só emite evento `failed` com "TikTok publisher not yet implemented" | Implementar init → (upload se FILE_UPLOAD) → status/fetch |
| **Social accounts** | `social_accounts` com `access_token_enc`, `platform` (incl. tiktok) ✅ | Uso do token para chamadas TikTok API ✅ |
| **social_publishes** | `status`, `externalId`, `publishedAt`, `error` ✅ | Servir status endpoint a partir daqui (ou chamar TikTok status/fetch ao vivo) |

### 2.2 Tipos compartilhados (@gaqno-types)

Em `@gaqno-types/src/video.ts` já existem:

- **VideoPublishCommandPayload**: já tem `provider`, `socialAccountId`, `source`, `publishId`, `uploadUrl`, `postInfo` (title, privacyLevel, disableDuet/Comment/Stitch, videoCoverTimestampMs), `caption`. Ou seja, o **payload Kafka da spec já está coberto** pelo tipo atual; falta apenas garantir que o backend preencha esses campos no fluxo TikTok.
- **VideoPublishEventPayload**: já tem `publishId`, `status`, `publishedAt`, `error` — alinhado com a spec.

### 2.3 Frontend (gaqno-ai-ui)

- **Publish hoje**: `aiApiClient.publishVideo(id, { socialAccountIds, caption })` → um único endpoint para todas as redes.
- **UI**: seleção de contas (TikTok/Instagram) + campo de legenda; não há título, privacidade, duet/comment/stitch, capa, nem escolha de source (URL vs upload).
- Não há chamada a creator-info nem polling de status TikTok.

---

## 3. Lacunas (o que falta para alinhar à spec)

### Backend

1. **GET /api/v1/tiktok/creator-info**  
   - Novo endpoint (ex.: em `TikTokController` ou em `social-accounts` com prefixo `/tiktok`).  
   - Usar token da `SocialAccount` TikTok do usuário; chamar `POST https://open.tiktokapis.com/v2/post/publish/creator_info/query/` e mapear para o DTO da spec.

2. **POST /api/v1/videos/:id/publish/tiktok**  
   - Nova rota (ou refatorar para “publish por provider”).  
   - Body: `TikTokDirectPostDto`.  
   - Fluxo: validar projeto completed + URL; opcionalmente validar contra creator-info (privacy_level, max_video_post_duration_sec); chamar TikTok `video/init`; se PULL_FROM_URL, publicar comando no Kafka com `source: 'PULL_FROM_URL'`, `publishId`, `postInfo`, `videoUrl`; se FILE_UPLOAD, persistir `uploadUrl` + `publishId` e publicar comando para worker fazer o PUT.

3. **GET /api/v1/videos/:id/publish/tiktok/status?publishId=...**  
   - Novo endpoint.  
   - Chamar `POST https://open.tiktokapis.com/v2/post/publish/status/fetch/` com o token do usuário; opcionalmente atualizar `social_publishes` e retornar o status no formato da spec.

4. **TikTokPublisher (consumer)**  
   - Deixar de ser stub: ao receber comando com `provider === 'tiktok'` e `source === 'PULL_FROM_URL'`, não precisa fazer upload (TikTok puxa da URL); apenas acompanhar status com `status/fetch` e emitir `video.publish.events`.  
   - Para `FILE_UPLOAD`, worker faz PUT no `upload_url` e depois faz polling de status até concluir/falhar e emite o evento.

5. **Payload de commands**  
   - O service que publica no Kafka deve preencher para TikTok: `provider: 'tiktok'`, `source`, `publishId`, `postInfo`, `videoUrl` (e `uploadUrl` + metadados de chunk se FILE_UPLOAD). O consumer já usa `socialAccountIds` e itera por conta; pode continuar assim, mas cada mensagem por conta TikTok deve seguir o formato da spec (e o tipo em `@gaqno-types` já suporta).

### Frontend (SaaS / gaqno-ai-ui)

6. **Creator info**  
   - Antes de abrir o modal de “Publicar no TikTok”, chamar `GET /api/v1/tiktok/creator-info` (quando houver só TikTok selecionado ou ao focar em TikTok).  
   - Usar `privacyLevelOptions`, `maxVideoPostDurationSec`, `commentDisabled`, `duetDisabled`, `stitchDisabled` para montar o formulário (select de privacidade, toggles, validação de duração).

7. **Formulário de publicação TikTok**  
   - Campos da spec: título (legenda), privacy level, disable duet/comment/stitch, video cover timestamp (opcional), source (PULL_FROM_URL vs FILE_UPLOAD).  
   - Para PULL_FROM_URL (caso atual: vídeo já no CDN), enviar `videoUrl` do projeto; backend preenche no init.

8. **Endpoint de publish**  
   - Para TikTok: passar a usar `POST /api/v1/videos/:id/publish/tiktok` com `TikTokDirectPostDto`.  
   - Manter o endpoint atual para Instagram (ou futuramente generalizar com `POST /api/v1/videos/:id/publish` com `provider` no body).

9. **Status**  
   - Após iniciar publicação, exibir estado “Publicando no TikTok…” e fazer polling em `GET /api/v1/videos/:id/publish/tiktok/status?publishId=...` até `PUBLISH_COMPLETE` ou `FAILED`, ou usar WebSocket/SSE se o backend expuser eventos.

---

## 4. Observações importantes (da spec)

- **Domínio verificado**: para `PULL_FROM_URL`, a URL do vídeo deve estar em domínio verificado no TikTok.  
- **Modo privado**: apps não auditados só podem publicar em modo privado até aprovação.  
- **Rate limits**: backoff e retry nas chamadas à Content Posting API.  
- **Segurança**: tokens em `social_accounts` já estão como `access_token_enc`; validar `tenantId` em todas as operações (já é prática no service).

---

## 5. Uso no prompt do microfrontend SaaS

Você pode colar no prompt do microfrontend SaaS:

1. **A seção 8 completa** que você recebeu (requisitos TikTok, endpoints REST, DTOs, eventos Kafka, observações).  
2. **Este resumo de alinhamento**:  
   - “O backend hoje tem `POST /api/v1/videos/:id/publish` com `socialAccountIds` e `caption`; para TikTok deve existir `GET /api/v1/tiktok/creator-info`, `POST /api/v1/videos/:id/publish/tiktok` com TikTokDirectPostDto e `GET /api/v1/videos/:id/publish/tiktok/status?publishId=...`. O frontend deve chamar creator-info antes do formulário TikTok, usar os campos da spec no form e fazer polling de status após publicar.”

Assim o LLM do microfrontend SaaS sabe quais endpoints e DTOs usar e como encaixar no fluxo init/upload/status da Content Posting API.

---

## 6. Próximos passos sugeridos

- **Backend**: Implementar os três endpoints (creator-info, publish/tiktok, status) e o TikTokPublisher real (init + status/fetch; FILE_UPLOAD opcional em fase 2).  
- **Frontend**: Adicionar fluxo TikTok no MFE (creator-info → form TikTokDirectPostDto → publish/tiktok → polling status).  
- **Prompt SaaS**: Incluir a seção 8 + o trecho de alinhamento acima para gerar/ajustar telas e chamadas de API do fluxo TikTok.

Se quiser, no próximo passo posso: (1) traduzir isso em controllers/services NestJS com DTOs e chamadas HTTP à API TikTok, ou (2) montar um fragmento de prompt por módulo (ex.: “gere TikTokPublishModule com base nesses endpoints”) para usar com o LLM de código.
